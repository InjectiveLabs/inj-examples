🌟 Injective Protocol - SDK TS

# Features

Written in TypeScript, with type definitions,
Works in Node.js and in the browser,
Exposes on-chain data and the exchange-api data,
Parses responses into native JavaScript types
much more ...

# Create example project

```bash
npm init -y
```

# Query

## Installation

```bash 
npm install @injectivelabs/sdk-ts
```

## Run

```bash
npm run query-balance

> sdk@1.0.0 query-balance
> ts-node src/query.ts

Balances for inj15e3nfrzegpajr0ezvscfqncm45ujfqq0r2u893:
inj: 9994079999999999000
peggy0x87aB3B4C8661e07D6372361211B96ed4Dc36B1B5: 10000000000
```

This demostrates how to use injective-sdk-ts to query account balance

# Transact with SDK

## Set environment variables

```shell
cp .env.sample .env
```

Fill in the empty values within `.env`.

> **Note**  
> Do not commit `.env`, or push to remote

## Run

```bash
npm run send-inj
```

Here is an example output:

```bash
From address: inj1rv4p9euzue9f8ulpgagmuzwa6rc2lr48u5066h
Sending 1000 inj to inj15e3nfrzegpajr0ezvscfqncm45ujfqq0r2u893
Transaction result: {
  height: 104411002,
  txhash: 'AD081C5FACF57C89462A550E88C377007049417859A692584EBDB77F892CE68B',
  codespace: '',
  code: 0,
  data: '12260A242F636F736D6F732E62616E6B2E763162657461312E4D736753656E64526573706F6E7365',
  rawLog: '',
  logs: [],
  info: '',
  gasWanted: 400000,
  gasUsed: 112895,
  tx: {
    typeUrl: '/cosmos.tx.v1beta1.Tx',
    value: Uint8Array(337) [
       10, 141,   1,  10, 133,   1,  10,  28,  47,  99, 111, 115,
      109, 111, 115,  46,  98,  97, 110, 107,  46, 118,  49,  98,
      101, 116,  97,  49,  46,  77, 115, 103,  83, 101, 110, 100,
       18, 101,  10,  42, 105, 110, 106,  49, 114, 118,  52, 112,
       57, 101, 117, 122, 117, 101,  57, 102,  56, 117, 108, 112,
      103,  97, 103, 109, 117, 122, 119,  97,  54, 114,  99,  50,
      108, 114,  52,  56, 117,  53,  48,  54,  54, 104,  18,  42,
      105, 110, 106,  49,  53, 101,  51, 110, 102, 114, 122, 101,
      103, 112,  97, 106,
      ... 237 more items
    ]
  timestamp: '2025-12-11T07:28:15Z',
  events: [
    { type: 'coin_spent', attributes: [Array] },
    { type: 'coin_received', attributes: [Array] },
    { type: 'transfer', attributes: [Array] },
    { type: 'message', attributes: [Array] },
    { type: 'tx', attributes: [Array] },
    { type: 'tx', attributes: [Array] },
    { type: 'tx', attributes: [Array] },
    { type: 'message', attributes: [Array] },
    { type: 'coin_spent', attributes: [Array] },
    { type: 'coin_received', attributes: [Array] },
    { type: 'transfer', attributes: [Array] },
    { type: 'message', attributes: [Array] }
  ],
  txHash: 'AD081C5FACF57C89462A550E88C377007049417859A692584EBDB77F892CE68B'
```

This demostrates how to use injective-sdk-ts to send some inj to another account
