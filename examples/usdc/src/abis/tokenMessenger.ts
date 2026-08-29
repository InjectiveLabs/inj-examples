/**
 * TokenMessengerV2 ABI (CCTP v2)
 * Contract: 0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA (Injective EVM Testnet)
 *
 * CCTP v2 depositForBurn signature differs from v1:
 *   v1 (4 params): depositForBurn(uint256,uint32,bytes32,address)          → selector 0x6fd3504e
 *   v2 (7 params): depositForBurn(uint256,uint32,bytes32,address,bytes32,uint256,uint32) → selector 0x8e0250ee
 *
 * New params in v2:
 *   destinationCaller  bytes32  — set to bytes32(0) to allow anyone to call receiveMessage()
 *   maxFee             uint256  — max fee in burnToken units; must be >= amount*minFee/1e7 and < amount
 *                                 (minFee is 0 on testnet, so maxFee=0 is valid)
 *   minFinalityThreshold uint32 — 500=min, 1000=confirmed, 2000=finalized (FINALITY_THRESHOLD_FINALIZED)
 */
export const tokenMessengerAbi = [
  {
    type: 'function',
    name: 'depositForBurn',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amount',                type: 'uint256' },
      { name: 'destinationDomain',     type: 'uint32'  },
      { name: 'mintRecipient',         type: 'bytes32' },
      { name: 'burnToken',             type: 'address' },
      { name: 'destinationCaller',     type: 'bytes32' },  // bytes32(0) = anyone can relay
      { name: 'maxFee',                type: 'uint256' },  // 0 is valid when minFee == 0
      { name: 'minFinalityThreshold',  type: 'uint32'  },  // 2000 = FINALITY_THRESHOLD_FINALIZED
    ],
    outputs: [{ name: 'nonce', type: 'uint64' }],
  },
  {
    type: 'function',
    name: 'depositForBurnWithCaller',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amount',               type: 'uint256' },
      { name: 'destinationDomain',    type: 'uint32'  },
      { name: 'mintRecipient',        type: 'bytes32' },
      { name: 'burnToken',            type: 'address' },
      { name: 'destinationCaller',    type: 'bytes32' },
    ],
    outputs: [{ name: 'nonce', type: 'uint64' }],
  },
  {
    type: 'event',
    name: 'DepositForBurn',
    inputs: [
      { name: 'burnToken',                    type: 'address', indexed: true  },
      { name: 'amount',                       type: 'uint256', indexed: false },
      { name: 'depositor',                    type: 'address', indexed: true  },
      { name: 'mintRecipient',                type: 'bytes32', indexed: false },
      { name: 'destinationDomain',            type: 'uint32',  indexed: false },
      { name: 'destinationTokenMessenger',    type: 'bytes32', indexed: false },
      { name: 'destinationCaller',            type: 'bytes32', indexed: false },
      { name: 'maxFee',                       type: 'uint256', indexed: false },
      { name: 'minFinalityThreshold',         type: 'uint32',  indexed: true  },
      { name: 'hookData',                     type: 'bytes',   indexed: false },
    ],
  },
] as const
