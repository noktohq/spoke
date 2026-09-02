# Lanseringsplan — Spoke i Google Play

Rekkefølgen under er avhengighetsstyrt. Punkt merket [E] gjør Edin i
nettleser/terminal; resten er allerede gjort i repoet.

## 1. Produkt- og pakkestruktur (fasit)

- Google Play: ÉN subscription med produkt-ID `spoke-plus`, med FEM base
  plans (månedlig): `p3990` (39,90 kr), `p3490`, `p2990`, `p2490`, `p1990`
  — pluss ETT engangsprodukt `spoke-lifetime` (799 kr, prutbart senere).
- RevenueCat: seks produkter som peker på disse; seks pakker i default
  offering med identifikatorene `spoke_plus_3990` … `spoke_plus_1990` og
  `spoke_lifetime`. Entitlement: `spoke_pro` (alle seks knyttes til den).
- Selger-serveren returnerer pakke-ID etter forhandling; appen viser kun det
  fremforhandlede alternativet. IDs må stemme EKSAKT.

## 2. Kjøreplan

1. [E] **Play Console → Create app**: navn «Spoke — Bike Care Log», app,
   gratis. Fyll Store listing fra `store/listing.md`; ikon
   `app/assets/icon.png`.
2. [E] **Personvern-URL**: last opp `docs/privacy.html` på nokto.no og lim
   URL-en inn i Play Console.
3. [E] **Data safety-skjema**: ingen innsamling av brukerdata utover kjøp
   (Play/RevenueCat); ingen deling; data lagres lokalt. Content rating:
   utility, ingen sensitive elementer. **Countries: inkluder USA + Norge**
   (Shipaton-krav: må kunne lastes ned i USA).
4. [E] **EAS-bygg** (Cloud Shell eller lokalt):
   `npm i -g eas-cli && eas login` (gratis Expo-konto) →
   `cd app && eas build --platform android --profile production`
   → last opp AAB-en i Play Console (intern testing først).
5. [E] **Opprett produktene** fra punkt 1 i Play Console → Monetize.
   (Krever at første AAB er lastet opp.)
6. [E] **Koble RevenueCat til Play**: RevenueCat-dashboard → Project
   settings → Apps → Add Google Play-app (package `no.nokto.spoke`) +
   service account-JSON (veiviseren forklarer). Bytt `test_`-nøkkelen i
   `app/src/purchases.ts` til `goog_`-nøkkelen etterpå (si fra, jeg gjør det).
7. [E] Legg produktene inn i RevenueCat (produkter → pakker → entitlement
   `spoke_pro`) med ID-ene fra punkt 1.
8. **Dev-bygg-test av ekte kjøp** med lisenstestere (Play → License testing:
   legg inn din egen Gmail) — testkjøp belastes ikke.
9. [E] **Promokode/free trial til dommerne**: enklest er 7 dagers free trial
   på alle fem base plans (Shipaton-kravet er «free trial ELLER promo code»).
10. **Produksjonslansering** i Play (review tar typisk noen dager første
    gang). Mål: publisert senest 24. september.
11. Devpost-innsending: video ≤2 min (skjermopptak på telefonen), ikon,
    skjermbilde 1179×2556, beskrivelse — utkast kommer i `store/`.

## 3. Milepæler

| Frist | Hva |
|---|---|
| 6. sep | Punkt 1–4 ferdig (app-oppføring + første AAB) |
| 10. sep | Produkter + RevenueCat koblet, ekte testkjøp verifisert |
| 20. sep | Produksjons-AAB sendt til review |
| 24. sep | Publisert |
| 29. sep | Devpost levert |
