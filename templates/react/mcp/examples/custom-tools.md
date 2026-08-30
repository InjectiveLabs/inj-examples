# Extending the Injective MCP Server

## Adding Custom Tools

You can extend the Injective MCP server to add custom tools for your dApp's contracts.

### Step 1: Fork the MCP Server

```bash
git clone https://github.com/InjectiveLabs/mcp-server my-injective-mcp
cd my-injective-mcp
```

### Step 2: Add a Custom Tool

Edit `src/mcp/tools/` and add a new tool file. Example — querying your USDCPaymentProcessor:

```typescript
// src/mcp/tools/payment-processor.ts
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { ethers } from "ethers";

const PAYMENT_PROCESSOR_ADDRESS = "0xYOUR_CONTRACT_ADDRESS";
const ABI = [
  "function getBalance() view returns (uint256)",
  "function totalCollected() view returns (uint256)",
  "function getTotalPaymentCount() view returns (uint256)",
];

export const paymentProcessorTool: Tool = {
  name: "get_payment_stats",
  description: "Get stats from the USDCPaymentProcessor contract on Injective",
  inputSchema: {
    type: "object",
    properties: {},
    required: [],
  },
  handler: async () => {
    const provider = new ethers.JsonRpcProvider("https://testnet.svm.injective.network/");
    const contract = new ethers.Contract(PAYMENT_PROCESSOR_ADDRESS, ABI, provider);

    const [balance, total, count] = await Promise.all([
      contract.getBalance(),
      contract.totalCollected(),
      contract.getTotalPaymentCount(),
    ]);

    return {
      currentBalance: ethers.formatUnits(balance, 6) + " USDC",
      totalCollected: ethers.formatUnits(total, 6) + " USDC",
      paymentCount: count.toString(),
    };
  },
};
```

### Step 3: Register the Tool

Add it to `src/mcp/server.ts`:

```typescript
import { paymentProcessorTool } from "./tools/payment-processor.js";

// In your tool registration:
server.registerTool(paymentProcessorTool);
```

### Step 4: Rebuild

```bash
npm run build
```

Now your AI assistant can ask: *"How much USDC has been collected by the payment processor?"*
