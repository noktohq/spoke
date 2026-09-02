// Spoke — bike care log with a negotiable subscription. MVP scaffold:
// Garage (bikes) → Bike (service log) → Paywall (haggle with the AI dealer).
import { useEffect, useState } from 'react';
import {
  Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, SafeAreaView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { acceptDeal, isLostSession, makeOffer, openSession, SellerState } from './src/api';
import { hasEntitlement, initPurchases, isMock, onEntitlementChange, purchasePackage, restorePurchases } from './src/purchases';

type Service = { id: string; date: string; what: string; costKr: string };
type Bike = { id: string; name: string; services: Service[] };
type Screen = { name: 'garage' } | { name: 'bike'; bikeId: string } | { name: 'paywall' };

const FREE_BIKE_LIMIT = 1;
const uid = () => Math.random().toString(36).slice(2, 10);
const kr = (minor: number) => `${(minor / 100).toFixed(2).replace('.', ',')} kr`;

export default function App() {
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [premium, setPremium] = useState(false);
  const [screen, setScreen] = useState<Screen>({ name: 'garage' });

  useEffect(() => {
    initPurchases().then(async () => {
      if (isMock()) return; // Expo Go: AsyncStorage-flagget styrer
      setPremium(await hasEntitlement());
      onEntitlementChange(setPremium);
    });
    AsyncStorage.getItem('spoke:v1').then((raw) => {
      if (!raw) return;
      const d = JSON.parse(raw);
      setBikes(d.bikes || []);
      setPremium(!!d.premium);
    });
  }, []);
  useEffect(() => {
    AsyncStorage.setItem('spoke:v1', JSON.stringify({ bikes, premium }));
  }, [bikes, premium]);

  const addBike = (name: string) => {
    if (!premium && bikes.length >= FREE_BIKE_LIMIT) return setScreen({ name: 'paywall' });
    setBikes([...bikes, { id: uid(), name, services: [] }]);
  };
  const addService = (bikeId: string, what: string, costKr: string) => {
    const date = new Date().toISOString().slice(0, 10);
    setBikes(bikes.map((b) => (b.id === bikeId
      ? { ...b, services: [{ id: uid(), date, what, costKr }, ...b.services] } : b)));
  };

  return (
    <SafeAreaView style={st.safe}>
      <StatusBar style="auto" />
      {screen.name === 'garage' && (
        <GarageScreen bikes={bikes} premium={premium} onAdd={addBike}
          onOpen={(bikeId) => setScreen({ name: 'bike', bikeId })} />
      )}
      {screen.name === 'bike' && (
        <BikeScreen bike={bikes.find((b) => b.id === screen.bikeId)!} onAdd={addService}
          onBack={() => setScreen({ name: 'garage' })} />
      )}
      {screen.name === 'paywall' && (
        <PaywallScreen onUnlocked={() => { setPremium(true); setScreen({ name: 'garage' }); }}
          onBack={() => setScreen({ name: 'garage' })} />
      )}
    </SafeAreaView>
  );
}

function GarageScreen(p: { bikes: Bike[]; premium: boolean; onAdd: (name: string) => void; onOpen: (id: string) => void }) {
  const [name, setName] = useState('');
  return (
    <View style={st.page}>
      <Text style={st.h1}>Garage</Text>
      {p.premium && <Text style={st.badge}>Spoke+ member</Text>}
      <FlatList data={p.bikes} keyExtractor={(b) => b.id}
        ListEmptyComponent={<Text style={st.dim}>No bikes yet — add your first one.</Text>}
        renderItem={({ item }) => (
          <Pressable style={st.card} onPress={() => p.onOpen(item.id)}>
            <Text style={st.cardTitle}>{item.name}</Text>
            <Text style={st.dim}>{item.services.length} service entries</Text>
          </Pressable>
        )} />
      <View style={st.row}>
        <TextInput style={st.input} placeholder="Bike name, e.g. Scultura" value={name} onChangeText={setName} />
        <Pressable style={st.btn} onPress={() => { if (name.trim()) { p.onAdd(name.trim()); setName(''); } }}>
          <Text style={st.btnText}>Add</Text>
        </Pressable>
      </View>
    </View>
  );
}

function BikeScreen(p: { bike: Bike; onAdd: (bikeId: string, what: string, costKr: string) => void; onBack: () => void }) {
  const [what, setWhat] = useState('');
  const [cost, setCost] = useState('');
  return (
    <View style={st.page}>
      <Pressable onPress={p.onBack}><Text style={st.link}>‹ Garage</Text></Pressable>
      <Text style={st.h1}>{p.bike.name}</Text>
      <FlatList data={p.bike.services} keyExtractor={(s) => s.id}
        ListEmptyComponent={<Text style={st.dim}>No service logged yet.</Text>}
        renderItem={({ item }) => (
          <View style={st.card}>
            <Text style={st.cardTitle}>{item.what}</Text>
            <Text style={st.dim}>{item.date}{item.costKr ? ` · ${item.costKr} kr` : ''}</Text>
          </View>
        )} />
      <View style={st.row}>
        <TextInput style={[st.input, { flex: 2 }]} placeholder="New chain, brake pads…" value={what} onChangeText={setWhat} />
        <TextInput style={st.input} placeholder="kr" keyboardType="numeric" value={cost} onChangeText={setCost} />
        <Pressable style={st.btn} onPress={() => { if (what.trim()) { p.onAdd(p.bike.id, what.trim(), cost.trim()); setWhat(''); setCost(''); } }}>
          <Text style={st.btnText}>Log</Text>
        </Pressable>
      </View>
    </View>
  );
}

function PaywallScreen(p: { onUnlocked: () => void; onBack: () => void }) {
  const [seller, setSeller] = useState<SellerState | null>(null);
  const [chat, setChat] = useState<{ who: 'dealer' | 'you'; text: string }[]>([]);
  const [bid, setBid] = useState('');
  const [busy, setBusy] = useState(false);

  const say = (who: 'dealer' | 'you', text: string) => setChat((c) => [...c, { who, text }]);

  const open = async () => {
    try {
      const s = await openSession();
      setSeller(s);
      setChat([{ who: 'dealer', text: s.message }]);
    } catch {
      setChat([{ who: 'dealer', text: 'The dealer is out riding — try again in a moment.' }]);
    }
  };
  useEffect(() => { open(); }, []);

  const offer = async () => {
    const krAmount = Number(bid.replace(',', '.'));
    if (!seller?.sessionId || !Number.isFinite(krAmount) || krAmount <= 0) return;
    setBusy(true); setBid('');
    say('you', `I offer ${krAmount.toFixed(2).replace('.', ',')} kr`);
    try {
      const s = await makeOffer(seller.sessionId, Math.round(krAmount * 100));
      setSeller({ ...s, sessionId: seller.sessionId });
      say('dealer', s.message);
    } catch (e) {
      if (isLostSession(e)) { say('dealer', 'Where were we? Let us start over.'); await open(); }
      else say('dealer', 'Hm, I did not catch that — try again.');
    } finally { setBusy(false); }
  };

  const accept = async () => {
    if (!seller?.sessionId) return;
    setBusy(true);
    try {
      const s = await acceptDeal(seller.sessionId);
      say('dealer', s.message);
      const ok = await purchasePackage(s.packageId!);
      if (ok) { Alert.alert('Spoke+', `Unlocked at ${kr(s.dealPrice!)} / month.`); p.onUnlocked(); }
      else say('dealer', 'No hard feelings — the offer stands for 48 hours.');
    } catch (e) {
      if (isLostSession(e)) { say('dealer', 'Where were we? Let us start over.'); await open(); }
      else Alert.alert('Purchase failed', String((e as Error).message));
    } finally { setBusy(false); }
  };

  return (
    <KeyboardAvoidingView style={st.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[st.row, { justifyContent: 'space-between' }]}>
        <Pressable onPress={p.onBack}><Text style={st.link}>‹ Not now</Text></Pressable>
        <Pressable onPress={async () => { if (await restorePurchases()) p.onUnlocked(); }}>
          <Text style={st.link}>Restore purchases</Text>
        </Pressable>
      </View>
      <Text style={st.h1}>Spoke+</Text>
      <Text style={st.dim}>Unlimited bikes, service reminders, export. The price? That is between you and the dealer.</Text>
      <FlatList data={chat} keyExtractor={(_, i) => String(i)} style={{ flex: 1, marginVertical: 12 }}
        renderItem={({ item }) => (
          <View style={[st.bubble, item.who === 'you' ? st.you : st.dealer]}>
            <Text style={item.who === 'you' ? st.youText : undefined}>{item.text}</Text>
          </View>
        )} />
      {seller && seller.state !== 'closed' && (
        <View style={st.row}>
          <TextInput style={st.input} placeholder="Your offer in kr" keyboardType="numeric"
            value={bid} onChangeText={setBid} editable={!busy} />
          <Pressable style={st.btn} onPress={offer} disabled={busy}><Text style={st.btnText}>Bid</Text></Pressable>
          <Pressable style={[st.btn, st.btnGood]} onPress={accept} disabled={busy}>
            <Text style={st.btnText}>Take {seller ? kr(seller.askPrice) : ''}</Text>
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fafafa' },
  page: { flex: 1, padding: 16, gap: 8 },
  h1: { fontSize: 28, fontWeight: '700' },
  dim: { color: '#666' },
  link: { color: '#0a7', fontWeight: '600', paddingVertical: 4 },
  badge: { alignSelf: 'flex-start', backgroundColor: '#0a7', color: '#fff', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, overflow: 'hidden' },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginVertical: 4, borderWidth: 1, borderColor: '#eee' },
  cardTitle: { fontWeight: '600', fontSize: 16 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10 },
  btn: { backgroundColor: '#111', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10 },
  btnGood: { backgroundColor: '#0a7' },
  btnText: { color: '#fff', fontWeight: '600' },
  bubble: { borderRadius: 10, padding: 10, marginVertical: 3, maxWidth: '85%' },
  dealer: { backgroundColor: '#eee', alignSelf: 'flex-start' },
  you: { backgroundColor: '#0a7', alignSelf: 'flex-end' },
  youText: { color: '#fff' },
});
