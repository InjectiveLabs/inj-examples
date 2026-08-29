/**
 * MessageTransmitter ABI
 * Contract: 0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275 (same address all chains via CREATE2)
 *
 * Investigation result (2025-04-30):
 *   - receiveMessage(bytes,bytes)          → returns true ✅  (USE THIS)
 *   - receiveFinalizedMessage(bytes,bytes) → reverts ❌
 *
 * Despite the burn using CCTP v2 (TokenMessengerV2 with minFinalityThreshold=2000),
 * the destination MessageTransmitter on Sepolia only exposes the v1-style
 * receiveMessage() which also handles v2-formatted messages transparently.
 */
export const messageTransmitterAbi = [
  {
    type: 'function',
    name: 'receiveMessage',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'message',     type: 'bytes' },
      { name: 'attestation', type: 'bytes' },
    ],
    outputs: [{ name: 'success', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'localDomain',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint32' }],
  },
] as const
