/**
 * Test Suite 1: CCTP Transfer Parameter Validation
 */

import { describe, it, expect } from 'vitest'
import { parseUnits, formatUnits, padHex, isAddress, isHex } from 'viem'
import { CONTRACTS, SEPOLIA_CONTRACTS, INJECTIVE_SOURCE_DOMAIN, SEPOLIA_DESTINATION_DOMAIN } from '../wagmi'

function prepareDepositForBurnArgs(
  amountStr: string,
  recipientAddress: string,
  destinationDomain: number,
) {
  if (!isAddress(recipientAddress)) throw new Error(`Invalid recipient address: ${recipientAddress}`)
  if (Number(amountStr) <= 0) throw new Error('Amount must be greater than 0')
  const amount = parseUnits(amountStr, 6)
  const mintRecipient = padHex(recipientAddress as `0x${string}`, { size: 32 })
  const burnToken = CONTRACTS.USDC
  return { amount, destinationDomain, mintRecipient, burnToken }
}

describe('CCTP Parameter Preparation', () => {
  describe('USDC Amount Parsing (6 decimals)', () => {
    it('converts "1.00" USDC to 1_000_000n', () => expect(parseUnits('1.00', 6)).toBe(1_000_000n))
    it('converts "0.5" USDC to 500_000n', () => expect(parseUnits('0.5', 6)).toBe(500_000n))
    it('converts "100" USDC to 100_000_000n', () => expect(parseUnits('100', 6)).toBe(100_000_000n))
    it('round-trips correctly', () => expect(formatUnits(parseUnits('42.5', 6), 6)).toBe('42.5'))
  })

  describe('mintRecipient bytes32 Padding', () => {
    const RECIPIENT = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
    it('pads to 32-byte hex string', () => expect(padHex(RECIPIENT as `0x${string}`, { size: 32 }).length).toBe(66))
    it('is valid hex', () => expect(isHex(padHex(RECIPIENT as `0x${string}`, { size: 32 }))).toBe(true))
    it('leading zeros present', () => expect(padHex(RECIPIENT as `0x${string}`, { size: 32 }).slice(2, 26)).toBe('000000000000000000000000'))
    it('preserves address in last 20 bytes', () => {
      const padded = padHex(RECIPIENT as `0x${string}`, { size: 32 })
      expect(('0x' + padded.slice(-40)).toLowerCase()).toBe(RECIPIENT.toLowerCase())
    })
  })

  describe('prepareDepositForBurnArgs()', () => {
    const VALID_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
    it('returns correct args', () => {
      const args = prepareDepositForBurnArgs('10.00', VALID_ADDRESS, 0)
      expect(args.amount).toBe(10_000_000n)
      expect(args.destinationDomain).toBe(0)
      expect(args.burnToken).toBe(CONTRACTS.USDC)
      expect(args.mintRecipient.length).toBe(66)
    })
    it('throws on invalid address', () => expect(() => prepareDepositForBurnArgs('1.00', 'bad', 0)).toThrow('Invalid recipient address'))
    it('throws on zero amount', () => expect(() => prepareDepositForBurnArgs('0', VALID_ADDRESS, 0)).toThrow('Amount must be greater than 0'))
  })

  describe('Contract Addresses', () => {
    it('USDC (source) is valid address', () => expect(isAddress(CONTRACTS.USDC)).toBe(true))
    it('TokenMessengerV2 is valid address', () => expect(isAddress(CONTRACTS.TOKEN_MESSENGER_V2)).toBe(true))
    it('Sepolia MessageTransmitterV2 is valid address', () => expect(isAddress(SEPOLIA_CONTRACTS.MESSAGE_TRANSMITTER_V2)).toBe(true))
    it('Injective source domain is 29', () => expect(INJECTIVE_SOURCE_DOMAIN).toBe(29))
    it('Sepolia destination domain is 0', () => expect(SEPOLIA_DESTINATION_DOMAIN).toBe(0))
  })
})
