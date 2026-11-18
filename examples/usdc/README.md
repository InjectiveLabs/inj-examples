# Bridge USDC on Injective Testnet

Use Circle CCTP V2 to move native testnet USDC between Ethereum Sepolia and Injective EVM Testnet. Start with **1 USDC on Sepolia**, burn it there, and mint it on Injective. Then use the received USDC to try the reverse route.

## What will you verify?

- **What do you start with, and where does it end up?** Your Sepolia wallet starts with native testnet USDC. The recipient gets native Circle USDC on Injective after minting, minus any CCTP fee.
- **Why do you approve and burn separately?** The approval lets the source TokenMessenger spend the selected amount. The burn reduces the source balance and creates a CCTP message.
- **What does Circle attest to?** Circle signs the burn message after the source chain meets the required confirmation threshold. On Testnet, use Circle’s Iris sandbox API to retrieve the message and its attestation by the original burn transaction hash. [Circle’s Iris API reference](https://developers.circle.com/api-reference/cctp/all/get-messages-v2).
- **How do you know the transfer finished?** Check the destination receipt and the recipient's USDC balance. On Injective, the minted token uses the same balance across EVM and native modules through MTS.

## Prerequisites

- Node.js 22 or later and the npm version it ships with.
- A MetaMask browser wallet with access to [Injective EVM Testnet](https://docs.injective.network/developers-evm/network-information) and Ethereum Sepolia. The app prompts you to switch networks for each transaction.
- Sepolia ETH and testnet INJ for gas on both networks. Get [Sepolia ETH](https://sepoliafaucet.com/) and [testnet INJ](https://testnet.faucet.injective.network/), or use the [Google Cloud INJ faucet](https://cloud.google.com/application/web3/faucet/injective/testnet).
- Sepolia USDC from the [Circle faucet](https://faucet.circle.com/). You can also get USDC directly on Injective Testnet if you want to start there.

| Network | EVM chain ID | CCTP domain | Gas | Explorer |
| --- | --- | --- | --- | --- |
| Ethereum Sepolia | `11155111` | `0` | ETH | [Etherscan](https://sepolia.etherscan.io/) |
| Injective EVM Testnet | `1439` | `29` | INJ | [Blockscout](https://testnet.blockscout.injective.network/) |

Use the chain ID to select a wallet network and the domain ID to route the CCTP message. The demo's [chain configuration](src/wagmi.ts) defines the source USDC, `TokenMessengerV2`, and `MessageTransmitterV2` addresses for each network. Verify them against Circle’s [USDC addresses](https://developers.circle.com/stablecoins/usdc-contract-addresses) and [CCTP deployments](https://developers.circle.com/cctp/references/contract-addresses).

## Run the app

```bash
git clone https://github.com/InjectiveLabs/inj-examples.git
cd inj-examples/examples/usdc
npm ci
npm run dev
```

Open [localhost:5173](http://localhost:5173) and connect MetaMask. The app opens on **Dashboard**. Note your starting Injective USDC balance there or in [Blockscout](https://testnet.blockscout.injective.network/), then open the **CCTP Transfer** tab. Only confirm a transaction after checking the network, amount, and recipient in the app and wallet.

## Transfer on public Testnet

### 1. Select the route and approve USDC

1. At the top of the **CCTP Transfer** tab, find the **Transfer Direction** card. Click the **Sepolia → Injective** button below the **From** and **To** boxes. **From** should now show **Ethereum Sepolia** and **To** should show **Injective**.
2. In **Step 1**, if the app says **Please switch to Ethereum Sepolia to continue**, click **Switch** in that banner and confirm the network change in MetaMask. If MetaMask is already on Sepolia, continue to the amount field.
3. Enter `1` in **Amount (USDC)** and click **Use connected address** beneath the recipient field. This lets you check the same account on both chains.

Select **Approve USDC** and confirm it on Sepolia. The approval grants the source `TokenMessengerV2` an allowance for the entered amount. If sufficient allowance already exists, proceed to the burn.

Leave **Request Fast Transfer from Sepolia** unchecked for the first run to use Standard Transfer. To try Fast Transfer separately, enable it and review the quoted fee cap before burning. The app fetches Circle's route fee and adds a 20% buffer to the cap. The actual fee is determined at execution and deducted at mint. A Fast Transfer can fall back to Standard.

### 2. Burn on the source chain

Select **Burn & Send** and confirm on Sepolia. Open the **Burn TX** link and save the hash. The source USDC balance decreases after a successful burn. The receipt contains a `MessageSent` log from the source `MessageTransmitterV2`.

Under the hood, [CCTPTransfer.tsx](src/components/CCTPTransfer.tsx) calls `depositForBurn`:

| Argument | Value for this route |
| --- | --- |
| `amount` | `1000000` base units for 1 USDC, using viem `parseUnits` |
| `destinationDomain` | `29` for Injective |
| `mintRecipient` | Your EVM address padded on the left to 32 bytes with viem `padHex` |
| `burnToken` | Native Circle USDC on Sepolia |
| `destinationCaller` | Zero bytes, so any account can pay gas and relay the mint |
| `maxFee` | Zero for the demo's Standard route, or the displayed Fast Transfer fee cap |
| `minFinalityThreshold` | `2000` for Standard or `1000` for Fast Transfer |

### 3. Find the Circle attestation

The app reads the burn receipt and polls Circle Iris every 15 seconds until the message is ready. You can also inspect the request with `curl` and `jq`. Replace `0xYOUR_BURN_HASH` with your confirmed burn hash.

```bash
BURN_HASH=0xYOUR_BURN_HASH
SOURCE_DOMAIN=0
curl -fsSG "https://iris-api-sandbox.circle.com/v2/messages/$SOURCE_DOMAIN" \
  --data-urlencode "transactionHash=$BURN_HASH" \
  | jq '.messages[] | {status, delayReason, message, attestation}'
```

Set `SOURCE_DOMAIN=29` for a burn that starts on Injective. A missing response while Iris indexes the transaction or a `pending_confirmations` status can be normal. Sepolia Standard Transfer may take several minutes. When status is `complete`, retain both the message bytes and attestation bytes. The [attestation hook](src/hooks/useAttestation.ts) handles one message per burn transaction.

If you closed the app, select the original direction and choose **Resume with a burn transaction hash**. Paste the hash and select **Fetch Attestation**. A successful burn can be resumed without burning again.

For a Fast Transfer, inspect Circle's current route quote with `curl -fsS https://iris-api-sandbox.circle.com/v2/burn/USDC/fees/0/29`. The quote with `finalityThreshold: 1000` gives `minimumFee` in basis points. The finality and fee you request can differ from the finality and fee executed in the attested message. [Circle fee rules](https://developers.circle.com/cctp/concepts/fees).

### 4. Mint on the destination and verify delivery

Switch the wallet to Injective Testnet, then select **Mint USDC on Injective EVM Testnet** and confirm the transaction. The app calls `MessageTransmitterV2.receiveMessage(message, attestation)` with the bytes returned by Iris.

1. Open **Mint TX** and verify that the destination receipt succeeded.
2. In Blockscout, verify the USDC credit to the recipient encoded in the message. Compare its balance with the starting balance you recorded. For a transfer with an executed fee, compare against the burn amount minus that fee.
3. If you used your connected address as the recipient, check its Injective USDC balance on the app's **Dashboard**. That balance is available to Injective native modules through [MTS](https://docs.injective.network/developers-evm/multivm-token-standard).

### 5. Reverse the route

Choose **Start New Transfer**, then select **Injective → Sepolia**. Use the USDC you received on Injective, or fund your wallet from the Circle faucet there. Use INJ for approval and burn gas, and Sepolia ETH for mint gas. The app requests Standard Transfer when Injective is the source, uses destination domain `0` and polls Iris with source domain `29`. Verify the final receipt and recipient balance in Etherscan.

## Troubleshooting

| What you see | What to check |
| --- | --- |
| Approval or burn is unavailable | Switch to the source chain. Confirm the sender has native Circle USDC and source gas. Enter a positive amount with at most six decimal places and a valid destination EVM address. |
| Iris is still pending | Confirm the burn receipt succeeded and check the source domain and hash. If Iris reports `insufficient_fee` for a Fast Transfer, continue checking the original burn for a Standard attestation. |
| Mint fails or the nonce was already used | Check the destination and its gas balance. A relayer may have completed the mint first. Verify the recipient balance and receipt before retrying. For an expired Fast Transfer message, use [Circle troubleshooting and reattestation guidance](https://developers.circle.com/cctp). |

## Local development checks

Run `npm test` to exercise the transfer parameters and mocked Iris responses, and `npm run build` to check the production bundle. The full walkthrough runs on public testnets because Circle Iris must observe and attest the source burn.

For the protocol, finality, and Injective architecture, see the [USDC + CCTP Guide](https://docs.injective.network/developers-defi/usdc-cctp-tutorial).
