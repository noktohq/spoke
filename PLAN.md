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

- **App:** React Native + Expo (EAS Build, skybygg — ingen lokal Android Studio
  nødvendig). RevenueCat SDK (react-native-purchases) mot Google Play Billing.
  **Android-først** — Nokto har ikke iPhone/Mac, så Apple-veien er skrinlagt.
- **Selger-API:** null-avhengighets Node-server (samme mønster som Haggle),
  egen Cloud Run-tjeneste `spoke-seller` i nokto-cue-agent.
  ALDRI rør `haggle`-tjenesten før 22. september (deploy-frys under bedømming).
- **Motor:** `engine/` — trinnbasert port av Haggle-motoren, 9/9 tester grønne.

## Tidslinje (Android)

| Dato | Milepæl |
|---|---|
| 2.–3. sep | Google Play-konto opprettet (org m/D-U-N-S hvis mulig, ellers personlig + testerverving), repo opp, motor + selger-API |
| 4.–9. sep | Kjernefunksjoner. Første AAB via EAS Build → lukket test i Play Console. **Personlig konto: 12 testere i gang senest 9.–10. sep** |
| 10.–17. sep | Paywall + RevenueCat (Play Billing) + forhandlings-UI + ikon/design, iterasjoner i testsporet |
| 18.–23. sep | Polish, skjermbilder (1179×2556), promokode, Play-review |
| ~24.–26. sep | **Publisert i Google Play** (personlig konto: 14-dagersklokka utløpt) |
| 26.–28. sep | Demovideo ≤2 min på ekte Android-enhet, #BuildInPublic-oppsummering |
| 29. sep | Devpost-innsending levert (aldri vent til fristen) |

**Go/no-go-port 10. september:** Play-konto godkjent OG (for personlig konto)
12 testere aktive. Ellers skrinlegges Shipaton — reserven er Galaxy Store
(ukjent risiko) eller neste hackathon (Nebius × NVIDIA, 30. okt).

## Devpost-krav (sjekkliste)

- [ ] Tekstbeskrivelse
- [ ] Demovideo ≤ 2 min, offentlig på YouTube/Vimeo, vist på ekte enhet
- [ ] URL til publisert app (App Store)
- [ ] App-ikon 1024×1024
- [ ] Minst ett skjermbilde 1179×2556 uten enhetsramme
- [ ] Gratis prøveperiode ELLER promokode til dommerne
- [ ] RevenueCat SDK driver minst ett kjøp

## Nokto må gjøre (blokkerer alt annet)

1. **I dag: sjekk D-U-N-S for Nokto** (gratis oppslag, dnb.com). Finnes →
   opprett Google Play **organisasjonskonto** ($25) — slipper 12-tester-kravet.
2. Ingen D-U-N-S → opprett **personlig** Play-konto ($25) nå
   (identitetsverifisering kan ta dager) og verv 12 testere
   (venner/familie + Shipaton-Discordens testerutveksling).
3. Registrer deg på Shipaton-siden (Ship Kit er «while supplies last»).
4. ~~Apple Developer Program~~ — skrinlagt: ingen iPhone/Mac.
