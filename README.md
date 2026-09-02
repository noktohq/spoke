# Spoke — bike care, negotiable price

A clean service & maintenance log for your bikes — with the world's first
**negotiable subscription**. The paywall is a negotiation: an AI bike dealer
(the same engine and charm as [Haggle](https://github.com/noktohq/haggle))
takes your bid for Spoke+. Every outcome lands on one of the merchant's
pre-approved price tiers — the floor is structural, not a prompt.

Built for [RevenueCat Shipaton 2026](https://revenuecat-shipaton-2026.devpost.com/).
By [Nokto](https://nokto.no).

## Layout

```
engine/   tier-based negotiation engine (plain JS, zero deps, unit-tested)
server/   seller API — the AI dealer over pre-approved tiers (Cloud Run-ready)
app/      Expo React Native scaffold: garage, service log, haggle paywall
```

## Run it

```bash
cd engine && npm test              # engine: 9 tests
cd ../server && npm test           # API black-box: full negotiation over HTTP
cd ../app && npm install && npx expo install --fix && npx expo start
```

The app runs in Expo Go with a mocked purchase; `react-native-purchases` and a
real RevenueCat offering (five packages, `spoke_plus_<minor>` ids, entitlement
`spoke_plus`) activate in the dev build. Point the app at a seller API with
`EXPO_PUBLIC_SELLER_API`.

## Test the engine

```bash
cd engine && npm test
```
