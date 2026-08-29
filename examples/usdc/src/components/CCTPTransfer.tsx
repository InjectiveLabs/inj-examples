import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain, useChainId,
} from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { parseUnits, padHex, isAddress } from 'viem'
import {
  CONTRACTS, SEPOLIA_CONTRACTS,
  SEPOLIA_DOMAIN, INJECTIVE_DOMAIN,
  injectiveEVMTestnet,
} from '../wagmi'
import { erc20Abi } from '../abis/erc20'
import { tokenMessengerAbi } from '../abis/tokenMessenger'
import { messageTransmitterAbi } from '../abis/messageTransmitter'
import { useUSDCBalance, useUSDCAllowance, type TransferDirection } from '../hooks/useUSDCBalance'
import { useAttestation } from '../hooks/useAttestation'

type Step = 1 | 2 | 3

// ─── Motion animation props (inline to avoid framer-motion Variants type issues)
const CARD_INITIAL = { opacity: 0, y: 16 }
const CARD_ANIMATE = { opacity: 1, y: 0 }
const CARD_EXIT    = { opacity: 0, y: -12 }
const CARD_TRANSITION = { duration: 0.38, ease: 'easeOut' as const }

const STEP_INITIAL = { opacity: 0, x: 24 }
const STEP_ANIMATE = { opacity: 1, x: 0 }
const STEP_EXIT    = { opacity: 0, x: -24 }
const STEP_TRANSITION = { duration: 0.36, ease: 'easeOut' as const }
const STEP_EXIT_TRANSITION = { duration: 0.2 }

// ─── Chain metadata ───────────────────────────────────────────────────────────
const CHAIN_META = {
  injective: {
    name: 'Injective',
    shortName: 'INJ',
    domain: INJECTIVE_DOMAIN,
    color: '#00BFFE',
    bg: 'rgba(0,191,254,0.08)',
    border: 'rgba(0,191,254,0.2)',
    emoji: '🔵',
  },
  sepolia: {
    name: 'Ethereum Sepolia',
    shortName: 'ETH',
    domain: SEPOLIA_DOMAIN,
    color: '#627EEA',
    bg: 'rgba(98,126,234,0.08)',
    border: 'rgba(98,126,234,0.2)',
    emoji: '🔷',
  },
}

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepIndicator({ current, step, label, total }: {
  current: Step; step: Step; label: string; total: number
}) {
  const done   = current > step
  const active = current === step
  return (
    <div className="flex items-center gap-2.5">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
        done   ? 'bg-green-500/20 text-green-400 border border-green-500/30'
               : active ? 'bg-[#6C63FF]/20 text-[#A78BFA] border border-[#6C63FF]/40 animate-pulse-glow'
               : 'bg-[rgba(108,99,255,0.05)] text-[#A0A0B8] border border-[rgba(108,99,255,0.12)]'
      }`}>
        {done ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="animate-draw-check">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : step}
      </div>
      <span className={`text-sm font-medium hidden sm:block ${active ? 'text-white' : done ? 'text-green-400' : 'text-[#A0A0B8]'}`}>
        {label}
      </span>
      {/* step number on mobile */}
      <span className={`text-xs font-medium sm:hidden ${active ? 'text-white' : done ? 'text-green-400' : 'text-[#A0A0B8]'}`}>
        {step}/{total}
      </span>
    </div>
  )
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ step }: { step: Step }) {
  const pct = ((step - 1) / 2) * 100
  return (
    <div className="w-full h-1 rounded-full mt-3 overflow-hidden" style={{ background: 'rgba(108,99,255,0.1)' }}>
      <div
        className="h-full rounded-full progress-bar-fill"
        style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #6C63FF, #A78BFA)' }}
      />
    </div>
  )
}

// ─── Tx hash link ─────────────────────────────────────────────────────────────
function TxHashLink({ hash, label, chainId }: { hash: string; label: string; chainId?: number }) {
  const explorer = chainId === sepolia.id
    ? `https://sepolia.etherscan.io/tx/${hash}`
    : `${injectiveEVMTestnet.blockExplorers.default.url}/tx/${hash}`
  return (
    <a href={explorer} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-xs text-[#A78BFA] hover:text-white transition-colors font-mono">
      {label}: {hash.slice(0, 10)}…{hash.slice(-8)}
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15,3 21,3 21,9" /><line x1="10" y1="14" x2="21" y2="3" />
      </svg>
    </a>
  )
}

// ─── Poll countdown ───────────────────────────────────────────────────────────
function PollCountdown({ key: k }: { key: string | number }) {
  return (
    <div className="mt-2">
      <div className="text-xs text-[#A0A0B8] mb-1">Next poll in 15s</div>
      <div className="w-full h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(108,99,255,0.12)' }}>
        <div key={k} className="poll-countdown" />
      </div>
    </div>
  )
}

// ─── Direction selector ───────────────────────────────────────────────────────
function DirectionToggle({
  direction, onChange,
}: { direction: TransferDirection; onChange: (d: TransferDirection) => void }) {
  const isInjToSep = direction === 'inj→sep'
  const src  = isInjToSep ? CHAIN_META.injective : CHAIN_META.sepolia
  const dest = isInjToSep ? CHAIN_META.sepolia   : CHAIN_META.injective

  return (
    <div className="card p-4">
      <div className="text-xs font-semibold text-[#A0A0B8] uppercase tracking-wider mb-3">Transfer Direction</div>

      {/* Direction display */}
      <div className="flex items-center gap-3">
        {/* Source chain */}
        <motion.div
          layout
          className="flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
          style={{ background: src.bg, border: `1px solid ${src.border}` }}
        >
          <span className="text-lg">{src.emoji}</span>
          <div>
            <div className="text-xs text-[#A0A0B8]">From</div>
            <div className="text-sm font-semibold text-white">{src.name}</div>
            <div className="text-xs" style={{ color: src.color }}>Domain {src.domain}</div>
          </div>
        </motion.div>

        {/* Arrow with flow effect */}
        <div className="relative flex flex-col items-center gap-1.5">
          {/* Flow arrow */}
          <div className="relative w-10 h-7 rounded-lg flex items-center justify-center overflow-hidden"
            style={{ background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.2)' }}>
            <div className="flow-particle" />
            <svg width="18" height="12" viewBox="0 0 18 12" fill="none" className="relative z-10">
              <path d="M1 6h14M10 1l5 5-5 5" stroke="#A78BFA" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          {/* Swap button */}
          <motion.button
            whileTap={{ rotate: 180, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            onClick={() => onChange(isInjToSep ? 'sep→inj' : 'inj→sep')}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            style={{ background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.25)' }}
            title="Flip direction"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/>
            </svg>
          </motion.button>
        </div>

        {/* Destination chain */}
        <motion.div
          layout
          className="flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
          style={{ background: dest.bg, border: `1px solid ${dest.border}` }}
        >
          <span className="text-lg">{dest.emoji}</span>
          <div>
            <div className="text-xs text-[#A0A0B8]">To</div>
            <div className="text-sm font-semibold text-white">{dest.name}</div>
            <div className="text-xs" style={{ color: dest.color }}>Domain {dest.domain}</div>
          </div>
        </motion.div>
      </div>

      {/* Quick-select pills */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => onChange('inj→sep')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all ${
            isInjToSep
              ? 'bg-[rgba(108,99,255,0.2)] text-[#A78BFA] border border-[rgba(108,99,255,0.35)]'
              : 'text-[#A0A0B8] border border-transparent hover:border-[rgba(108,99,255,0.2)] hover:text-white'
          }`}
        >
          🔵 INJ → ETH
        </button>
        <button
          onClick={() => onChange('sep→inj')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all ${
            !isInjToSep
              ? 'bg-[rgba(108,99,255,0.2)] text-[#A78BFA] border border-[rgba(108,99,255,0.35)]'
              : 'text-[#A0A0B8] border border-transparent hover:border-[rgba(108,99,255,0.2)] hover:text-white'
          }`}
        >
          🔷 ETH → INJ
        </button>
      </div>
    </div>
  )
}

// ─── Network guard banner ─────────────────────────────────────────────────────
function NetworkGuard({
  requiredChainId, requiredName, isSwitching, onSwitch,
}: {
  requiredChainId: number
  requiredName: string
  isSwitching: boolean
  onSwitch: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 p-3 rounded-xl"
      style={{ background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.2)' }}
    >
      <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse flex-shrink-0" />
      <span className="text-sm text-yellow-300 flex-1">
        Please switch to <strong>{requiredName}</strong> to continue
      </span>
      <button className="btn-secondary text-xs py-1.5 px-3" onClick={onSwitch} disabled={isSwitching}>
        {isSwitching
          ? <><span className="w-3 h-3 border-2 border-[#A78BFA]/30 border-t-[#A78BFA] rounded-full animate-spin-smooth" /> Switching…</>
          : 'Switch'}
      </button>
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export function CCTPTransfer() {
  const { address } = useAccount()
  const chainId = useChainId()
  const { switchChain, isPending: isSwitching } = useSwitchChain()

  const [direction, setDirection] = useState<TransferDirection>('inj→sep')
  const [step, setStep]           = useState<Step>(1)

  // Form state
  const [amount, setAmount]           = useState('')
  const [destAddress, setDestAddress] = useState('')
  const [burnTxHash, setBurnTxHash]   = useState('')
  const [isPolling, setIsPolling]     = useState(false)
  const [pollTick, setPollTick]       = useState(0)

  // Direction-derived constants
  const isInjToSep     = direction === 'inj→sep'
  const srcChainId     = isInjToSep ? injectiveEVMTestnet.id : sepolia.id
  const dstChainId     = isInjToSep ? sepolia.id : injectiveEVMTestnet.id
  const srcChainName   = isInjToSep ? 'Injective EVM Testnet' : 'Ethereum Sepolia'
  const dstChainName   = isInjToSep ? 'Ethereum Sepolia' : 'Injective EVM Testnet'
  const destDomain     = isInjToSep ? SEPOLIA_DOMAIN : INJECTIVE_DOMAIN
  const attSourceDomain = isInjToSep ? INJECTIVE_DOMAIN : SEPOLIA_DOMAIN
  const isOnSrcChain   = chainId === srcChainId
  const isOnDstChain   = chainId === dstChainId

  const usdcContract   = isInjToSep ? CONTRACTS.USDC : SEPOLIA_CONTRACTS.USDC
  const messengerAddr  = isInjToSep ? CONTRACTS.TOKEN_MESSENGER_V2 : SEPOLIA_CONTRACTS.TOKEN_MESSENGER_V2
  const transmitterAddr = isInjToSep ? SEPOLIA_CONTRACTS.MESSAGE_TRANSMITTER_V2 : CONTRACTS.MESSAGE_TRANSMITTER_V2

  // ── Write contracts ────────────────────────────────────────────────────────
  const { writeContract: writeApprove, data: approveTxHash, isPending: approvePending } = useWriteContract()
  const { writeContract: writeBurn,    data: burnTxHashData, isPending: burnPending }    = useWriteContract()
  const { writeContract: writeMint,    data: mintTxHash,    isPending: mintPending }     = useWriteContract()

  const { isLoading: approveConfirming, isSuccess: approveConfirmed } =
    useWaitForTransactionReceipt({ hash: approveTxHash })
  const { isLoading: burnConfirming, isSuccess: burnConfirmed } =
    useWaitForTransactionReceipt({ hash: burnTxHashData })
  const { isLoading: mintConfirming, isSuccess: mintConfirmed } =
    useWaitForTransactionReceipt({ hash: mintTxHash, chainId: dstChainId })

  const { formatted: usdcBalance }  = useUSDCBalance(address, direction)
  const { allowance } = useUSDCAllowance(address, messengerAddr, direction)

  const {
    status: attStatus, message: attMessage, attestation,
    error: attError, fetchAttestation, reset: resetAtt,
  } = useAttestation(attSourceDomain)

  const amountParsed       = amount ? parseUnits(amount, 6) : 0n
  const hasEnoughAllowance = allowance !== undefined && allowance >= amountParsed && amountParsed > 0n

  // ── Reset on direction change ──────────────────────────────────────────────
  const handleDirectionChange = (d: TransferDirection) => {
    setDirection(d)
    setStep(1)
    setAmount('')
    setDestAddress('')
    setBurnTxHash('')
    setIsPolling(false)
    resetAtt()
  }

  // ── Step labels ────────────────────────────────────────────────────────────
  const stepLabels: [string, string, string] = isInjToSep
    ? ['Burn on Injective', 'Get Attestation', 'Mint on Sepolia']
    : ['Burn on Sepolia',   'Get Attestation', 'Mint on Injective']

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleApprove = () => {
    if (!amountParsed) return
    writeApprove({
      address: usdcContract, abi: erc20Abi, functionName: 'approve',
      args: [messengerAddr, amountParsed],
      chainId: srcChainId,
    })
  }

  const handleBurn = () => {
    if (!amountParsed || !destAddress || !isAddress(destAddress)) return
    // CCTP v2 finality + fee strategy:
    //
    // INJ source (fast chain ~3s): use FINALITY_THRESHOLD_FINALIZED (2000)
    //   → standard mode, Circle waits for Injective finality (~few seconds), maxFee = 0 OK
    //
    // ETH Sepolia source: FINALITY_THRESHOLD_FINALIZED (2000) = ~13-15 min L1 finality wait
    //   → use minFinalityThreshold=1 (fast mode) BUT fast mode requires maxFee > 0
    //   → maxFee = 1000 (0.001 USDC) to pay the Circle relayer — deducted from minted amount
    const minFinalityThreshold = isInjToSep ? 2000 : 1
    const maxFee = isInjToSep ? 0n : 1000n   // 0.001 USDC relay fee for Sepolia fast mode

    writeBurn({
      address: messengerAddr, abi: tokenMessengerAbi, functionName: 'depositForBurn',
      args: [
        amountParsed,
        destDomain,
        padHex(destAddress as `0x${string}`, { size: 32 }),
        usdcContract,
        '0x0000000000000000000000000000000000000000000000000000000000000000',
        maxFee,
        minFinalityThreshold,
      ],
      chainId: srcChainId,
    })
  }

  const handleMint = () => {
    if (!attMessage || !attestation) return
    writeMint({
      address: transmitterAddr,
      abi: messageTransmitterAbi,
      functionName: 'receiveMessage',
      args: [attMessage as `0x${string}`, attestation as `0x${string}`],
      chainId: dstChainId,
    })
  }

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (burnConfirmed && burnTxHashData && step === 1) {
      setBurnTxHash(burnTxHashData)
      setStep(2)
    }
  }, [burnConfirmed, burnTxHashData, step])

  const doFetch = useCallback(() => {
    const hash = burnTxHash || burnTxHashData || ''
    if (hash) {
      fetchAttestation(hash)
      setPollTick(t => t + 1)
    }
  }, [burnTxHash, burnTxHashData, fetchAttestation])

  useEffect(() => {
    if (!isPolling) return
    doFetch()
    const interval = setInterval(doFetch, 15_000)
    return () => clearInterval(interval)
  }, [isPolling, doFetch])

  useEffect(() => {
    if (attStatus === 'complete' || attStatus === 'error') setIsPolling(false)
  }, [attStatus])

  useEffect(() => {
    if (attStatus === 'complete' && step === 2) setStep(3)
  }, [attStatus, step])

  const isFormValid = amount && Number(amount) > 0 && destAddress && isAddress(destAddress)

  const resetAll = () => {
    setStep(1); setAmount(''); setDestAddress(''); setBurnTxHash('')
    setIsPolling(false); resetAtt()
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-5"
    >
      {/* Direction selector */}
      <AnimatePresence mode="wait">
        <motion.div key="dir-selector" initial={CARD_INITIAL} animate={CARD_ANIMATE} exit={CARD_EXIT} transition={CARD_TRANSITION}>
          <DirectionToggle direction={direction} onChange={handleDirectionChange} />
        </motion.div>
      </AnimatePresence>

      {/* Step navigator + progress */}
      <div className="card p-5">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 sm:items-center justify-between">
          <StepIndicator current={step} step={1} label={stepLabels[0]} total={3} />
          <div className="hidden sm:block h-px flex-1 mx-3" style={{ background: 'linear-gradient(to right, rgba(108,99,255,0.25), rgba(108,99,255,0.08))' }} />
          <StepIndicator current={step} step={2} label={stepLabels[1]} total={3} />
          <div className="hidden sm:block h-px flex-1 mx-3" style={{ background: 'linear-gradient(to right, rgba(108,99,255,0.08), rgba(108,99,255,0.25))' }} />
          <StepIndicator current={step} step={3} label={stepLabels[2]} total={3} />
        </div>
        <ProgressBar step={step} />
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">

        {/* ── Step 1: Burn ─────────────────────────────────────────────────── */}
        {step === 1 && (
          <motion.div key="step-1" initial={STEP_INITIAL} animate={STEP_ANIMATE} exit={STEP_EXIT} transition={STEP_TRANSITION} className="card p-6 space-y-5">
            <div>
              <h3 className="text-base font-semibold mb-1">
                Step 1 — Burn USDC on {isInjToSep ? 'Injective' : 'Ethereum Sepolia'}
              </h3>
              <p className="text-[#A0A0B8] text-sm">
                Approve the TokenMessenger to spend your USDC, then initiate the cross-chain burn to {dstChainName}.
              </p>
            </div>

            {/* Network guard */}
            {!isOnSrcChain && (
              <NetworkGuard
                requiredChainId={srcChainId}
                requiredName={srcChainName}
                isSwitching={isSwitching}
                onSwitch={() => switchChain({ chainId: srcChainId })}
              />
            )}

            {/* Destination info */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: 'rgba(108,99,255,0.06)', border: '1px solid rgba(108,99,255,0.15)' }}>
              <div className="text-xl">🎯</div>
              <div>
                <div className="text-xs font-medium text-[#A78BFA]">Destination Chain</div>
                <div className="text-sm font-semibold text-white">{dstChainName}</div>
                <div className="text-xs text-[#A0A0B8]">CCTP domain {destDomain}</div>
              </div>
              <div className="ml-auto text-right">
                <div className="text-xs text-[#A0A0B8]">TokenMessengerV2</div>
                <div className="text-xs font-mono text-[#A78BFA]">{messengerAddr.slice(0, 10)}…</div>
              </div>
            </div>

            {/* ETH→INJ fast mode fee notice */}
            {!isInjToSep && (
              <motion.div
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl"
                style={{ background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.15)' }}
              >
                <span className="text-base mt-0.5">⚡</span>
                <div className="text-xs text-[#A0A0B8]">
                  <span className="text-yellow-300 font-medium">Fast finality mode</span> — Circle relayer confirms in ~1 min.
                  A relay fee of <span className="text-white font-mono">0.001 USDC</span> will be deducted from the minted amount on Injective.
                </div>
              </motion.div>
            )}

            {/* Amount */}
            <div>
              <label className="block text-xs font-medium text-[#A0A0B8] mb-2">Amount (USDC)</label>
              <div className="relative">
                <input className="input-field pr-24" placeholder="0.00" type="number" min="0"
                  value={amount} onChange={e => setAmount(e.target.value)} />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#A78BFA] font-medium hover:text-white transition-colors"
                  onClick={() => usdcBalance && setAmount(usdcBalance)}>MAX</button>
              </div>
              <div className="text-xs text-[#A0A0B8] mt-1">
                Balance on {srcChainName}: <span className="text-white">{usdcBalance ?? '—'} USDC</span>
              </div>
            </div>

            {/* Recipient */}
            <div>
              <label className="block text-xs font-medium text-[#A0A0B8] mb-2">
                Recipient Address <span className="text-[#6C63FF]">(on {dstChainName})</span>
              </label>
              <input className="input-field" placeholder="0x…" value={destAddress}
                onChange={e => setDestAddress(e.target.value)} />
              {destAddress && !isAddress(destAddress) && (
                <div className="text-xs text-red-400 mt-1">Invalid address</div>
              )}
              <div className="text-xs text-[#A0A0B8] mt-1">
                💡 Tip: use your own address to receive USDC on {dstChainName}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button className="btn-secondary flex-1 justify-center" onClick={handleApprove}
                disabled={!isFormValid || !isOnSrcChain || approvePending || approveConfirming || hasEnoughAllowance}>
                {approvePending || approveConfirming ? (
                  <><span className="w-4 h-4 border-2 border-[#A78BFA]/30 border-t-[#A78BFA] rounded-full animate-spin-smooth" />
                    {approvePending ? 'Approving…' : 'Confirming…'}</>
                ) : hasEnoughAllowance ? (
                  <><span className="text-green-400">✓</span> Approved</>
                ) : <><span>🔓</span> Approve USDC</>}
              </button>
              <button className="btn-primary flex-1 justify-center" onClick={handleBurn}
                disabled={!isFormValid || !isOnSrcChain || !hasEnoughAllowance || burnPending || burnConfirming}>
                {burnPending || burnConfirming ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-smooth" />
                    {burnPending ? 'Burning…' : 'Confirming…'}</>
                ) : <><span>🔥</span> Burn &amp; Send</>}
              </button>
            </div>

            <div className="space-y-1">
              {approveTxHash && <TxHashLink hash={approveTxHash} label="Approve TX" chainId={srcChainId} />}
              {burnTxHashData && <TxHashLink hash={burnTxHashData} label="Burn TX" chainId={srcChainId} />}
            </div>

            {burnConfirmed && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="p-3 rounded-xl"
                style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}
              >
                <p className="text-green-400 text-sm font-medium">✓ Burn confirmed! Proceeding to attestation…</p>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── Step 2: Attestation ───────────────────────────────────────────── */}
        {step === 2 && (
          <motion.div key="step-2" initial={STEP_INITIAL} animate={STEP_ANIMATE} exit={STEP_EXIT} transition={STEP_TRANSITION} className="card p-6 space-y-5">
            <div>
              <h3 className="text-base font-semibold mb-1">Step 2 — Get Circle Attestation</h3>
              <p className="text-[#A0A0B8] text-sm">
                Circle's Iris API signs the burn message once the source chain reaches finality.
                {' '}Source domain: <span className="text-[#A78BFA] font-mono">{attSourceDomain}</span>
              </p>
              {/* Wait-time hint per direction */}
              <div className="mt-2 flex items-start gap-2 px-3 py-2 rounded-lg"
                style={{ background: 'rgba(108,99,255,0.06)', border: '1px solid rgba(108,99,255,0.12)' }}>
                <span className="text-base mt-0.5">⏱</span>
                <div className="text-xs text-[#A0A0B8]">
                  {isInjToSep
                    ? <><span className="text-white font-medium">Injective source:</span> fast finality (~3 s), attestation usually ready in &lt;1 min.</>
                    : <><span className="text-white font-medium">Ethereum Sepolia source:</span> using fast confirmation (1 block, ~15 s). Attestation should arrive within 1–2 min. <span className="text-yellow-400">Previous burns with slow finality (~2000) can take 13–15 min — those will still complete.</span></>
                  }
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#A0A0B8] mb-2">Burn Transaction Hash</label>
              <input className="input-field font-mono" placeholder="0x…" value={burnTxHash}
                onChange={e => setBurnTxHash(e.target.value)} />
            </div>

            <AnimatePresence>
              {attStatus !== 'idle' && (
                <motion.div
                  key="att-status"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className={`p-4 rounded-xl border ${
                    attStatus === 'complete' ? 'border-green-500/20'
                    : attStatus === 'error'  ? 'border-red-500/20'
                    : 'border-[rgba(108,99,255,0.15)]'
                  }`}
                  style={{
                    background: attStatus === 'complete' ? 'rgba(34,197,94,0.06)'
                      : attStatus === 'error' ? 'rgba(239,68,68,0.06)'
                      : 'rgba(108,99,255,0.06)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {(attStatus === 'fetching' || attStatus === 'pending_confirmations') && (
                      <span className="w-4 h-4 border-2 border-[#A78BFA]/30 border-t-[#A78BFA] rounded-full animate-spin-smooth" />
                    )}
                    <span className={`text-sm font-medium ${
                      attStatus === 'complete' ? 'text-green-400'
                      : attStatus === 'error'  ? 'text-red-400' : 'text-[#A78BFA]'
                    }`}>
                      {attStatus === 'fetching'              && 'Fetching attestation…'}
                      {attStatus === 'pending_confirmations' && (
                        isInjToSep
                          ? '⏳ Waiting for Injective finality… (auto-polling every 15 s)'
                          : '⏳ Waiting for Ethereum block confirmation… (auto-polling every 15 s)'
                      )}
                      {attStatus === 'complete'              && '✓ Attestation received! Advancing to Step 3…'}
                      {attStatus === 'error'                 && `Error: ${attError}`}
                    </span>
                  </div>

                  {/* Countdown for polling */}
                  {attStatus === 'pending_confirmations' && isPolling && (
                    <PollCountdown key={pollTick} />
                  )}

                  {attStatus === 'complete' && attMessage && (
                    <div className="space-y-2 mt-3">
                      <div>
                        <div className="text-xs text-[#A0A0B8] mb-1">Message Bytes:</div>
                        <div className="font-mono text-xs text-white bg-[#0A0A0F] p-2 rounded-lg break-all max-h-20 overflow-y-auto border border-[rgba(108,99,255,0.1)]">
                          {attMessage}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-[#A0A0B8] mb-1">Attestation Signature:</div>
                        <div className="font-mono text-xs text-white bg-[#0A0A0F] p-2 rounded-lg break-all max-h-20 overflow-y-auto border border-[rgba(108,99,255,0.1)]">
                          {attestation}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-3">
              <button className="btn-secondary" onClick={() => { resetAtt(); setIsPolling(false); setStep(1) }}>
                ← Back
              </button>
              {attStatus !== 'complete' ? (
                <button className="btn-primary flex-1 justify-center"
                  onClick={() => setIsPolling(true)} disabled={!burnTxHash || isPolling}>
                  {isPolling
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-smooth" /> Polling…</>
                    : <><span>📡</span> Fetch Attestation</>}
                </button>
              ) : (
                <button className="btn-primary flex-1 justify-center" onClick={() => setStep(3)}>
                  Next: Mint on {dstChainName} →
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Step 3: Mint ─────────────────────────────────────────────────── */}
        {step === 3 && (
          <motion.div key="step-3" initial={STEP_INITIAL} animate={STEP_ANIMATE} exit={STEP_EXIT} transition={STEP_TRANSITION} className="card p-6 space-y-5">
            <div>
              <h3 className="text-base font-semibold mb-1">
                Step 3 — Mint USDC on {dstChainName}
              </h3>
              <p className="text-[#A0A0B8] text-sm">
                Switch to {dstChainName} and call{' '}
                <code className="text-[#A78BFA] font-mono bg-[rgba(108,99,255,0.1)] px-1 rounded">receiveMessage()</code>{' '}
                on Circle's MessageTransmitterV2 to mint your USDC.
              </p>
            </div>

            {/* Contract info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl" style={{ background: 'rgba(108,99,255,0.06)', border: '1px solid rgba(108,99,255,0.12)' }}>
                <div className="text-xs text-[#A0A0B8] mb-1">MessageTransmitterV2</div>
                <div className="font-mono text-xs text-[#A78BFA] break-all">{transmitterAddr}</div>
              </div>
              <div className="p-3 rounded-xl" style={{ background: 'rgba(108,99,255,0.06)', border: '1px solid rgba(108,99,255,0.12)' }}>
                <div className="text-xs text-[#A0A0B8] mb-1">Network</div>
                <div className="text-sm font-semibold text-white">{dstChainName}</div>
                <div className="text-xs text-[#A0A0B8]">CCTP domain {destDomain}</div>
              </div>
            </div>

            {/* Attestation preview */}
            {attMessage && (
              <details className="group">
                <summary className="text-xs font-medium text-[#A0A0B8] cursor-pointer hover:text-white transition-colors flex items-center gap-1">
                  <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
                  View attestation data
                </summary>
                <div className="mt-2 space-y-2">
                  <div>
                    <div className="text-xs text-[#A0A0B8] mb-1">message:</div>
                    <div className="font-mono text-xs text-white bg-[#0A0A0F] p-2 rounded-lg break-all border border-[rgba(108,99,255,0.1)]">{attMessage}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[#A0A0B8] mb-1">attestation:</div>
                    <div className="font-mono text-xs text-white bg-[#0A0A0F] p-2 rounded-lg break-all border border-[rgba(108,99,255,0.1)]">{attestation}</div>
                  </div>
                </div>
              </details>
            )}

            {/* Network status */}
            {!isOnDstChain ? (
              <NetworkGuard
                requiredChainId={dstChainId}
                requiredName={dstChainName}
                isSwitching={isSwitching}
                onSwitch={() => switchChain({ chainId: dstChainId })}
              />
            ) : (
              <motion.div
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
                <span className="text-sm text-green-400 font-medium">✓ Connected to {dstChainName} — ready to mint</span>
              </motion.div>
            )}

            {/* Mint success */}
            <AnimatePresence>
              {mintConfirmed && mintTxHash && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="p-4 rounded-xl space-y-2"
                  style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}
                >
                  <p className="text-green-400 font-semibold animate-pop-in">🎉 USDC minted successfully on {dstChainName}!</p>
                  <TxHashLink hash={mintTxHash} label="Mint TX" chainId={dstChainId} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button className="btn-secondary" onClick={() => setStep(2)}>← Back</button>

              {!mintConfirmed ? (
                <button
                  className="btn-primary flex-1 justify-center"
                  onClick={isOnDstChain ? handleMint : () => switchChain({ chainId: dstChainId })}
                  disabled={!attMessage || !attestation || mintPending || mintConfirming || isSwitching}
                >
                  {isSwitching ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-smooth" /> Switching…</>
                  ) : mintPending ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-smooth" /> Sending tx…</>
                  ) : mintConfirming ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-smooth" /> Confirming mint…</>
                  ) : isOnDstChain ? (
                    <><span>✨</span> Mint USDC on {dstChainName}</>
                  ) : (
                    <><span>🔀</span> Switch &amp; Mint</>
                  )}
                </button>
              ) : (
                <button className="btn-primary flex-1 justify-center" onClick={resetAll}>
                  🔄 Start New Transfer
                </button>
              )}
            </div>

            {/* ABI reference */}
            <div className="card p-4">
              <div className="text-xs font-semibold mb-2 text-[#A0A0B8] uppercase tracking-wider">ABI Reference</div>
              <div className="bg-[#0A0A0F] border border-[rgba(108,99,255,0.1)] rounded-xl p-3 font-mono text-xs text-[#A0A0B8] overflow-x-auto">
                <pre>{`// MessageTransmitterV2 (same addr on all chains via CREATE2)
// ${transmitterAddr}
receiveMessage(
  bytes message,      // from Circle Iris API
  bytes attestation   // from Circle Iris API
) → bool success`}</pre>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  )
}
