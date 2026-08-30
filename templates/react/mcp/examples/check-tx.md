# Example: Check Transaction Status via MCP

## Example Prompts

```
"Check the status of transaction 0xabc123... on Injective testnet"
```

```
"Did this transaction succeed? 0xdef456..."
```

```
"Show me the details of the last USDC payment transaction"
```

## Under the Hood

The MCP server calls `eth_getTransactionReceipt` on Injective's EVM RPC and returns structured data that your AI assistant parses and explains.

## Useful Injective Links

- Testnet Explorer: https://testnet.explorer.injective.network/
- Mainnet Explorer: https://explorer.injective.network/
- Testnet Faucet: https://testnet.faucet.injective.network/
