import { privateKeyToAccount } from 'viem/accounts'
import {
  http,
  getAddress,
  parseUnits,
  formatUnits,
  zeroAddress,
  createWalletClient,
  type Address
} from 'viem'
import {
  SWAP,
  chain,
  client,
  inspect,
  swapAbi,
  tokenAbi,
  MARKET_ID,
  USDC_DENOM,
  USDC_ADDRESS
} from './config.js'

async function readBalances(address: Address, blockNumber: bigint) {
  const [inj, usdc] = await Promise.all([
    client.getBalance({ address, blockNumber }),
    client.readContract({
      address: USDC_ADDRESS,
      abi: tokenAbi,
      functionName: 'balanceOf',
      args: [address],
      blockNumber
    })
  ])

  return { inj, usdc }
}

async function main() {
  const [side, amount, mode = '--quote', ...extraArgs] = process.argv.slice(2)

  if (
    !['buy', 'sell'].includes(side) ||
    !amount ||
    !['--send', '--quote', '--simulate'].includes(mode) ||
    extraArgs.length > 0
  ) {
    throw new Error(
      'Usage: npm run swap -- buy|sell AMOUNT [--quote|--simulate|--send]'
    )
  }

  const buying = side === 'buy'
  const inputDecimals = buying ? 6 : 18
  const outputDecimals = buying ? 18 : 6
  const inputSymbol = buying ? 'USDC' : 'INJ'
  const outputSymbol = buying ? 'INJ' : 'USDC'

  // Reject excess precision before parseUnits can round the input.
  if (
    !/^\d+(\.\d+)?$/.test(amount) ||
    (amount.split('.')[1]?.length ?? 0) > inputDecimals
  ) {
    throw new Error(
      `AMOUNT must be a positive decimal string with at most ${inputDecimals} fractional digits`
    )
  }
  const amountIn = parseUnits(amount, inputDecimals)
  if (amountIn <= 0n) {
    throw new Error('AMOUNT must be positive')
  }

  const slippage = process.env.SLIPPAGE_BPS ?? '50'
  const bps = Number(slippage)
  if (!/^\d+$/.test(slippage) || bps >= 10_000) {
    throw new Error('SLIPPAGE_BPS must be an integer from 0 to 9999')
  }

  const state = await inspect()
  const market = state.market

  if (
    !market ||
    market.status !== 'Active' ||
    market.base_denom !== 'inj' ||
    market.quote_denom !== USDC_DENOM
  ) {
    throw new Error(
      'Expected the active INJ / Circle USDC testnet market; do not select a market by ticker alone.'
    )
  }

  if (
    !state.swap_params.enabled ||
    !(state.swap_params.allowed_markets ?? []).some(
      (id) => id.toLowerCase() === MARKET_ID.toLowerCase()
    )
  ) {
    throw new Error(
      'Swaps disabled or this market is not allowlisted. An exchange admin must update SwapParams.'
    )
  }
  if (state.tokenPair?.bank_denom !== USDC_DENOM) {
    throw new Error(
      'Circle USDC bank denom could not be resolved on this network'
    )
  }

  const usdc = getAddress(state.tokenPair.erc20_address)

  if (usdc !== getAddress(USDC_ADDRESS)) {
    throw new Error('Resolved token is not the expected Circle USDC deployment')
  }

  const decimals = await client.readContract({
    address: usdc,
    abi: tokenAbi,
    functionName: 'decimals'
  })

  if (
    decimals !== 6 ||
    Number(market.quote_decimals) !== 6 ||
    Number(market.base_decimals) !== 18
  ) {
    throw new Error('Unexpected token or market decimals')
  }

  const tokenIn = buying ? usdc : zeroAddress

  const [quotedSpent, quotedOut] = await client.readContract({
    address: SWAP,
    abi: swapAbi,
    functionName: 'quoteExactInputV2',
    args: [tokenIn, MARKET_ID, amountIn]
  })

  const minOut = (quotedOut * BigInt(10_000 - bps)) / 10_000n

  if (quotedSpent <= 0n || quotedOut <= 0n || minOut <= 0n) {
    throw new Error('Quote is too small for a protected swap')
  }

  console.log({
    inputBudget: `${formatUnits(amountIn, inputDecimals)} ${inputSymbol}`,
    estimatedInputSpent: `${formatUnits(quotedSpent, inputDecimals)} ${inputSymbol}`,
    estimatedUnspentInput: `${formatUnits(amountIn - quotedSpent, inputDecimals)} ${inputSymbol}`,
    estimatedOutput: `${formatUnits(quotedOut, outputDecimals)} ${outputSymbol}`,
    minimumOutput: `${formatUnits(minOut, outputDecimals)} ${outputSymbol}`
  })

  if (mode === '--quote') {
    return
  }

  const privateKey = process.env.PRIVATE_KEY
  const configuredSender = process.env.SENDER
  if (mode === '--send' && (!privateKey || !/^0x[0-9a-fA-F]{64}$/.test(privateKey))) {
    throw new Error('Set PRIVATE_KEY to a dedicated testnet account key for --send')
  }
  const signer = mode === '--send'
    ? privateKeyToAccount(privateKey as `0x${string}`)
    : undefined
  const sender = configuredSender ? getAddress(configuredSender) : signer?.address
  if (!sender) {
    throw new Error('Set SENDER to a funded testnet EVM address for --simulate')
  }
  if (signer && signer.address !== sender) {
    throw new Error('SENDER and PRIVATE_KEY identify different accounts')
  }

  const block = await client.getBlock()
  const deadline = block.timestamp + 120n
  const args = [
    tokenIn,
    MARKET_ID,
    amountIn,
    minOut,
    sender,
    deadline
  ] as const

  const call = {
    address: SWAP,
    abi: swapAbi,
    functionName: 'swapExactInputV2' as const,
    args,
    account: sender
  }

  const balances = await readBalances(sender, block.number)
  if ((buying ? balances.usdc : balances.inj) < amountIn) {
    throw new Error('Insufficient input balance for the full input budget')
  }

  const [{ result }, estimate, gasPrice] = await Promise.all([
    client.simulateContract(call),
    client.estimateContractGas(call),
    client.getGasPrice()
  ])
  const gas = (estimate * 120n + 99n) / 100n

  if (balances.inj < gas * gasPrice + (buying ? 0n : amountIn)) {
    throw new Error('Keep enough INJ for the input budget plus gas')
  }

  console.log('Simulation:', {
    estimatedInputSpent: `${formatUnits(result[0], inputDecimals)} ${inputSymbol}`,
    estimatedOutput: `${formatUnits(result[1], outputDecimals)} ${outputSymbol}`,
    gasLimit: gas.toString(),
    maximumGasCost: `${formatUnits(gas * gasPrice, 18)} INJ`,
    deadline: deadline.toString()
  })

  if (!signer) {
    return
  }

  const wallet = createWalletClient({
    chain,
    account: signer,
    transport: http(chain.rpcUrls.default.http[0])
  })
  // No value: the precompile debits the caller's existing bank/MTS balance.
  const hash = await wallet.writeContract({
    ...call,
    account: signer,
    gas,
    gasPrice,
    type: 'legacy'
  })

  console.log('Submitted:', `${chain.blockExplorers.default.url}/tx/${hash}`)

  const receipt = await client.waitForTransactionReceipt({ hash })

  if (receipt.transactionHash !== hash) {
    throw new Error(`Swap transaction ${hash} was replaced by ${receipt.transactionHash}`)
  }
  if (receipt.status !== 'success') {
    throw new Error(`Swap reverted: ${hash}`)
  }

  console.log(`Confirmed in block ${receipt.blockNumber}: ${hash}`)
  const [before, after] = await Promise.all([
    readBalances(sender, receipt.blockNumber - 1n),
    readBalances(sender, receipt.blockNumber)
  ])

  const gasPaid = receipt.gasUsed * receipt.effectiveGasPrice

  console.log('Balance changes across the receipt block:', {
    INJ: formatUnits(after.inj - before.inj, 18),
    USDC: formatUnits(after.usdc - before.usdc, 6),
    gasPaidINJ: formatUnits(gasPaid, 18),
    INJExcludingGas: formatUnits(after.inj - before.inj + gasPaid, 18)
  })
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
