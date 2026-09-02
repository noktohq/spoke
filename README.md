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
server/   seller API for the app (Cloud Run)            — coming
app/      Expo React Native app with RevenueCat SDK     — coming
```

## Test the engine

```bash
cd engine && npm test
```
