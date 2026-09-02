# Spoke — plan for RevenueCat Shipaton 2026

Arbeidstittel. Frist: **30. september 23:45 PDT (1. oktober 08:45 norsk tid)**.
Appen må være **førstegangs-publisert** i butikken innen fristen.

## Konsept

**Spoke** — en ren, rask service- og vedlikeholdslogg for sykler (sykler,
deler, kjedeslitasje, serviceintervaller, kostnader). Nytten er ekte og
avgrenset; stjernen er monetiseringen:

**Verdens første prutbare abonnement.** Paywallen er en forhandling: en
AI-sykkelhandler (samme motor og personlighet som Haggle/Bikepoint) tar imot
bud på Spoke+-prisen. Utfallet lander alltid på ett av kjøpmannens
forhåndsgodkjente pristrinn — gulvet er strukturelt, akkurat som i Haggle.
Late bud lukker høyt; gode forhandlere når gulvet.

## Kategorier (mål)

1. **HAMM Award** ($20k/1. plass) — primærmål. Dømmes på «most robust and
   creative monetization strategy». Historien: forhandling som kontrollert
   prisdiskriminering, strukturelt gulv, per-bruker-pris uten lekkasje.
2. **RevenueCat Design Award** — sekundært: poler paywall-opplevelsen.
3. **#BuildInPublic** ($30k/1. plass) — poster underveis fra dag 1.

Grand Prize dømmes på traction — ikke et mål.

## Monetisering (HAMM-designet)

- Gratis: 1 sykkel, enkel logg.
- **Spoke+** (månedsabonnement): ubegrensede sykler, servicevarsler,
  slitasjesporing, eksport.
- Fem pristrinn som fem produkter i én RevenueCat-offering, f.eks.
  39,90 / 34,90 / 29,90 / 24,90 / 19,90 kr/mnd (endelig valuta/nivåer TBD).
- Forhandlingen (server-side motor, `engine/`) velger hvilket trinn brukeren
  får se — appen viser kun det fremforhandlede produktet. Tilbudet utløper
  etter 48 timer (samme DNA som Haggle).
- Roadmap i innsendingsteksten: prute på fornyelse, vinn-tilbake-forhandling,
  per-bruker-strategier.

## Stack

- **App:** React Native + Expo (EAS Build). RevenueCat SDK (react-native-purchases).
- **Selger-API:** null-avhengighets Node-server (samme mønster som Haggle),
  egen Cloud Run-tjeneste `spoke-seller` i nokto-cue-agent.
  ALDRI rør `haggle`-tjenesten før 22. september (deploy-frys under bedømming).
- **Motor:** `engine/` — trinnbasert port av Haggle-motoren, 9/9 tester grønne.

## Tidslinje

| Dato | Milepæl |
|---|---|
| 2.–3. sep | Apple-konto godkjent, repo opp, Expo-skjelett, motor + selger-API deployet |
| 4.–8. sep | Kjernefunksjoner: sykler, servicelogg, intervaller. Første TestFlight |
| 9.–14. sep | Paywall + RevenueCat-integrasjon + forhandlings-UI + ikon/design |
| 15.–17. sep | Polish, skjermbilder (1179×2556), promokode til dommere |
| **18. sep** | **Send til App Review** (buffer for avslag) |
| 19.–28. sep | Lansering, #BuildInPublic-poster, demovideo ≤2 min |
| 29. sep | Devpost-innsending levert (aldri vent til fristen) |

## Devpost-krav (sjekkliste)

- [ ] Tekstbeskrivelse
- [ ] Demovideo ≤ 2 min, offentlig på YouTube/Vimeo, vist på ekte enhet
- [ ] URL til publisert app (App Store)
- [ ] App-ikon 1024×1024
- [ ] Minst ett skjermbilde 1179×2556 uten enhetsramme
- [ ] Gratis prøveperiode ELLER promokode til dommerne
- [ ] RevenueCat SDK driver minst ett kjøp

## Nokto må gjøre (blokkerer alt annet)

1. **I dag: Apple Developer Program** ($99/år) — godkjenning kan ta dager.
2. **Avklar Google Play-konto:** ny personlig konto krever lukket test med
   12 testere i 14 dager før produksjon → i praksis kun Apple hvis du ikke
   har konto fra før. Ukjent status.
3. **Opprett `github.com/noktohq/spoke`** (privat, tomt — ingen README) og si
   fra, så pushes alt dette.
4. Registrer deg på Shipaton-siden (Ship Kit-fordeler er «while supplies last»).
