# DebtPay

A React Native + Expo MVP for aggressively tracking and paying off debt.

## Features (MVP)

- **Dashboard** — a debt-free countdown date and a progress ring showing how much of your total debt is paid off.
- **Debts** — manually add debts (name, balance, APR, minimum payment) and log real payments against them.
- **Strategy Playground** — toggle between the Debt Snowball (smallest balance first) and Debt Avalanche (highest APR first) methods, and use a slider to see how extra monthly payments move up your debt-free date.
- **Snowflake Log** — record unexpected cash windfalls, which are applied immediately to your highest-priority debt, and see exactly how many days that saves.

## Stack

- Expo SDK 57 + Expo Router (file-based navigation, 4-tab layout)
- TypeScript
- `@react-native-async-storage/async-storage` for local persistence — the MVP relies entirely on manual entry and on-device storage (no backend, no accounts), matching the product's privacy-first, mindfulness-driven design.

## Getting started

```bash
cd debtpay-app
npm install
npx expo start --web   # test in Chrome
npx expo start         # scan the QR code with Expo Go on your phone
```

## Project structure

```
app/
  _layout.tsx            root layout (providers, stack)
  (tabs)/
    _layout.tsx           tab bar (Dashboard, Debts, Strategy, Snowflakes)
    index.tsx             Dashboard
    debts.tsx             Debts
    strategy.tsx           Strategy Playground
    snowflakes.tsx         Snowflake Log
lib/
  types.ts                Debt / Snowflake / Settings types
  storage.ts              AsyncStorage read/write helpers
  payoff.ts               snowball/avalanche amortization simulator
  DebtsContext.tsx         shared app state + persistence
  format.ts               currency/date formatting
components/
  ProgressRing.tsx        SVG progress ring
  Card.tsx                shared card styling
```

## Not yet implemented

Retention features (streaks, badges, push notifications), analytics, and release/store prep are follow-up work — this MVP is the "skeleton first" step.
