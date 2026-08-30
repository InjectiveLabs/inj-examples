// src/query.ts
/**
 * Simple example: query wallet balance using @injectivelabs/sdk-ts
 *
 * Usage:
 * 1) Query wallet balance
 *
 * 2) Run:
 *    npm ts-node src/query.ts
 */
const { ChainRestBankApi } = require('@injectivelabs/sdk-ts');

async function main() {
  // 1️⃣ setting RPC endpoints
  const restEndpoint = 'https://testnet.sentry.lcd.injective.network/'; // testnet endpoint
  const bankApi = new ChainRestBankApi(restEndpoint);

  // 2️⃣ Set the address to query
  // const address = '<YOUR_WALLET_ADDRESS>'; // e.g. inj1xxxx
  const address = 'inj15e3nfrzegpajr0ezvscfqncm45ujfqq0r2u893';

  // 3️⃣ Query balances
  try {
    const balances = await bankApi.fetchBalances(address);

    console.log(`Balances for ${address}:`);
    balances.balances.forEach((coin: { denom: any; amount: any; }) => {
      console.log(`${coin.denom}: ${coin.amount}`);
    });
  } catch (error) {
    console.error('Failed to fetch balances:', error);
  }
}

// 4️⃣ execute the main function
main().catch(console.error);