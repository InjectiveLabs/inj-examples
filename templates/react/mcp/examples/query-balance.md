# Example: Query INJ Balance via MCP

Once the Injective MCP server is connected to your AI assistant, you can ask natural language questions:

## Example Prompts

```
"What's the INJ balance of address 0x1234...abcd on Injective testnet?"
```

```
"Check the USDC balance of my wallet on Injective"
```

```
"Query the latest block on Injective testnet"
```

## What Happens Under the Hood

The AI translates your request → calls the MCP tool `get_balance` → returns the result in natural language.

No code needed. The MCP server handles the RPC calls to Injective.

## Available Balance Tools (from Injective MCP)

| Tool | Description |
|------|-------------|
| `get_balance` | Get native INJ balance for an address |
| `get_bank_balances` | Get all token balances |
| `get_erc20_balance` | Get ERC20 token balance (e.g., USDC) |
