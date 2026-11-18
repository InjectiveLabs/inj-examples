# IBC precompile demo

Send an ICS-20 transfer from an EVM wallet or contract and receive a transfer with a Solidity hook. This walkthrough uses Injective Testnet and a counterparty testnet with an active relayer. See the [IBC precompile reference](https://docs.injective.network/developers-evm/ibc-precompile) for the ABI, token resolution, and acknowledgement behavior.

## What will you verify?

- **Which channel should I use?** Identify the channel on the sending chain, find its counterpart, and confirm that a relayer serves the route.
- **Whose balance funds the transfer?** Send INJ from a wallet and then from a Solidity contract. Identify which account is debited and where a refund would go.
- **How do I know the transfer arrived?** Find the packet sequence on Injective, then check the acknowledgement and recipient balance on the destination chain.
- **How can Solidity react to an incoming transfer?** Deploy a receiver contract, trigger its hook with a packet memo, and observe what happens when the hook succeeds or reverts.

## Prerequisites

- Clone the full [inj-examples repository](https://github.com/InjectiveLabs/inj-examples) and open `examples/ibc-precompile`. Install [Foundry](https://getfoundry.sh/introduction/installation/), `curl`, and `jq`. Run `forge build`. The example imports the [vendored IBC interface](../precompiles/vendor/injective/IBC.sol).
- Fund a dedicated testnet EVM account with test INJ for the transfer and gas. Set `ACCOUNT` to its Foundry keystore name. Find the faucet and explorers in the [testnet portal](https://chain.injective.network/testnet).
- Prepare a receiver address and a way to fund gas on the counterparty testnet. A local EVM simulation cannot execute Injective’s native precompiles.

### Find a testnet route

List open ICS-20 transfer channels on Injective Testnet. Check the [Cosmos Chain Registry entry](https://github.com/cosmos/chain-registry/tree/master/testnets/_IBC) to search for a counterparty channel. An open channel can still have an expired client.

```bash
LCD=https://testnet.sentry.lcd.injective.network
CHANNEL_API=/ibc/core/channel/v1/channels
PAGE_KEY=

page=$(curl -fsSG "$LCD$CHANNEL_API" \
  --data-urlencode 'pagination.limit=100' \
  --data-urlencode "pagination.key=$PAGE_KEY")
jq -r '.channels[]
  | select(.state == "STATE_OPEN" and .version == "ics20-1"
      and .port_id == "transfer" and .counterparty.port_id == "transfer")
  | [.channel_id, .counterparty.channel_id] | @tsv' <<< "$page"
PAGE_KEY=$(jq -r '.pagination.next_key // empty' <<< "$page")
```

The columns are the Injective channel and its counterparty channel. To get the next page, rerun from `page=$(...)` with the updated `PAGE_KEY`. An empty `PAGE_KEY` after the query means you reached the last page.

### Validate both clients

Set `CHANNEL` to a candidate on Injective. The channel’s client state gives you the local client ID and, for a Tendermint client, the chain ID it tracks.

```bash
CHANNEL=channel-N
CLIENT_API=/ibc/core/client/v1/client_status
client=$(curl -fsS "$LCD$CHANNEL_API/$CHANNEL/ports/transfer/client_state")
jq '.identified_client_state | {client_id, chain_id: .client_state.chain_id}' <<< "$client"
INJ_CLIENT=$(jq -er '.identified_client_state.client_id' <<< "$client")
curl -fsS "$LCD$CLIENT_API/$INJ_CLIENT" | jq -r '.status'
```

If the status is `Active`, find a public REST endpoint for the reported testnet. Set `DESTINATION_LCD` to that endpoint and `DESTINATION_CHANNEL` to the second column from discovery.

```bash
DESTINATION_LCD=https://your-counterparty-testnet-lcd
DESTINATION_CHANNEL=channel-M

curl -fsS "$DESTINATION_LCD/cosmos/base/tendermint/v1beta1/node_info" \
  | jq -r '.default_node_info.network'
curl -fsS "$LCD$CHANNEL_API/$CHANNEL/ports/transfer" \
  | jq '.channel | {state, version, counterparty}'
curl -fsS "$DESTINATION_LCD$CHANNEL_API/$DESTINATION_CHANNEL/ports/transfer" \
  | jq '.channel | {state, version, counterparty}'

client=$(curl -fsS "$DESTINATION_LCD$CHANNEL_API/$DESTINATION_CHANNEL/ports/transfer/client_state")
jq '.identified_client_state | {client_id, chain_id: .client_state.chain_id}' <<< "$client"
DESTINATION_CLIENT=$(jq -er '.identified_client_state.client_id' <<< "$client")
curl -fsS "$DESTINATION_LCD$CLIENT_API/$DESTINATION_CLIENT" | jq -r '.status'
```

The destination LCD should report the chain ID tracked by the Injective client. The destination client should track `injective-888`. Both channels should report `STATE_OPEN` and `ics20-1` and point back to each other on the `transfer` port. Both client statuses must be `Active`. If either client is `Expired` or `Frozen`, choose another route.

Check the explorers for recent successful transfers on these exact channels, ideally in both directions. A destination `write_acknowledgement` event and a source `acknowledge_packet` event for the same successful packet confirm that both the transfer and its acknowledgement were relayed. If recent activity is unavailable, confirm relay coverage with the operator or start with a small wallet transfer and [verify delivery](#verify-delivery) before testing the hook.

## 1. Check your Injective EVM endpoint

Keep `CHANNEL`, `DESTINATION_CHANNEL`, `LCD`, and `DESTINATION_LCD` from the prerequisites.

```bash
RPC_URL=https://k8s.testnet.json-rpc.injective.network/
IBC=0x0000000000000000000000000000000000000069
NATIVE_INJ=0x0000000000000000000000000000000000000000
AMOUNT=100000000000000000 # 0.1 INJ in base units.

cast chain-id --rpc-url "$RPC_URL" # Expect 1439.
```

## 2. Send from your wallet

Set `RECEIVER` to the recipient’s address on the counterparty chain. Use a timeout of ten minutes expressed in Unix nanoseconds. The zero token address selects native INJ and `(0,0)` disables the height timeout.

```bash
TIMEOUT_NS="$(( $(date +%s) + 600 ))000000000"
cast send "$IBC" 'transfer(string,string,address,uint256,(uint64,uint64),uint64,string)' \
  "$CHANNEL" "$RECEIVER" "$NATIVE_INJ" "$AMOUNT" '(0,0)' "$TIMEOUT_NS" '' \
  --account "$ACCOUNT" --rpc-url "$RPC_URL"
```

The precompile debits the caller’s bank balance. Keep transaction value at zero. To send another asset, pass the registered MTS token pair address or the address of its native MTS contract on the EVM. Express the amount in the token’s smallest units.

### Verify delivery

Check the EVM receipt for successful execution. Find the native transaction in the chain explorer and read its `send_packet` event for the packet sequence and destination channel. A successful source transaction confirms dispatch. Verify the destination balance and acknowledgement to confirm delivery.

Set `SEQUENCE` from the event, then use the destination LCD and channel from the prerequisites.

```bash
curl -fsS "$DESTINATION_LCD/ibc/core/channel/v1/channels/$DESTINATION_CHANNEL/ports/transfer/packet_acks/$SEQUENCE" \
  | jq -r '.acknowledgement' | base64 -d
```

For a timeout or error acknowledgement, check the original sender’s bank balance after the outcome is relayed to Injective.

## 3. Send from a Solidity contract

Deploy [`IBCForwarder`](src/IBCForwarder.sol) and set `FORWARDER` to its deployed address:

```bash
forge create src/IBCForwarder.sol:IBCForwarder \
  --account "$ACCOUNT" --rpc-url "$RPC_URL" --broadcast
```

Fund the forwarder, then call it from the same account used to deploy it:

```bash
cast send "$FORWARDER" --value "$AMOUNT" --account "$ACCOUNT" --rpc-url "$RPC_URL"
cast send "$FORWARDER" 'forward(string,string,address,uint256)' \
  "$CHANNEL" "$RECEIVER" "$NATIVE_INJ" "$AMOUNT" --account "$ACCOUNT" --rpc-url "$RPC_URL"
```

The `PacketDispatched` event gives you the packet sequence. The forwarder holds the input funds and receives any refund. Use small test balances. A production forwarder needs to track pending packets and make refunds available to the appropriate users.

## 4. Receive a transfer with a Solidity hook

Deploy [`IBCReceiver`](src/IBCReceiver.sol) on Injective Testnet:

```bash
forge create src/IBCReceiver.sol:IBCReceiver \
  --account "$ACCOUNT" --rpc-url "$RPC_URL" --broadcast
```

Set `HOOK` to the deployed address. On the counterparty chain, send an ICS-20 packet over its channel back to Injective. Use INJ returning to its source chain or a token whose received denom already resolves through MTS on Injective. If you want the hook contract to receive the funds, set the packet receiver to the Injective bech32 form of `HOOK`. Use [Injective’s address conversion guide](https://docs.injective.network/developers/convert-addresses) if needed.

Generate the **packet memo** for the sending chain:

```bash
jq -cn --arg contract "$HOOK" \
  '{evm: {contract: $contract, payload: "0x0102", gas_limit: 500000}}'
```

After relay, verify the recipient’s balance, the hook’s `Received` event, and the success acknowledgement. Look for `injective.evm.v1.EventIBCHookCall` in the native relay transaction if your RPC gateway lacks synthetic EVM hook receipts.

Repeat with `payload: "0x"` to trigger the demo’s revert. Verify that the destination produces an error acknowledgement, the transfer credit is rolled back, and the counterparty refunds the sender after processing the acknowledgement.
