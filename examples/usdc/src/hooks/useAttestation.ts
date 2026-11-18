import { useState, useCallback, useRef } from 'react'
import { isHex, type Hex } from 'viem'
import { CIRCLE_ATTESTATION_API, INJECTIVE_DOMAIN } from '../wagmi'

type AttestationResult =
  | { status: 'idle' | 'fetching' }
  | { status: 'pending_confirmations'; delayReason?: string }
  | { status: 'complete'; message: Hex; attestation: Hex }
  | { status: 'error'; error: string }

function isMessageBytes(value: unknown): value is Hex {
  return typeof value === 'string' && isHex(value) && value.length > 2 && value.length % 2 === 0
}

export function useAttestation(sourceDomain = INJECTIVE_DOMAIN) {
  const [result, setResult] = useState<AttestationResult>({ status: 'idle' })
  const inFlight = useRef<AbortController>()

  const fetchAttestation = useCallback(async (txHash: string) => {
    if (inFlight.current) return
    const request = new AbortController()
    inFlight.current = request
    const timeout = setTimeout(() => request.abort(), 12_000)
    const update = (next: AttestationResult) => {
      if (inFlight.current === request) setResult(next)
    }
    setResult(previous => previous.status === 'pending_confirmations' ? previous : { status: 'fetching' })

    try {
      const url = `${CIRCLE_ATTESTATION_API}/${sourceDomain}?transactionHash=${encodeURIComponent(txHash)}`
      const response = await fetch(url, { signal: request.signal })

      if (response.status === 404 || response.status === 429) {
        update({ status: 'pending_confirmations', delayReason: response.status === 429 ? 'rate limit' : undefined })
        return
      }
      if (!response.ok) throw new Error(`Circle attestation API returned HTTP ${response.status}`)

      const { messages } = await response.json()
      if (!Array.isArray(messages)) throw new Error('Circle response is missing the messages array')
      if (messages.length > 1) throw new Error('Use a burn transaction containing one CCTP message')

      const message = messages[0]
      if (message?.status === 'complete') {
        if (!isMessageBytes(message.message) || !isMessageBytes(message.attestation)) {
          throw new Error('Circle response is missing the signed message bytes')
        }
        update({ status: 'complete', message: message.message, attestation: message.attestation })
      } else {
        update({
          status: 'pending_confirmations',
          delayReason: typeof message?.delayReason === 'string' ? message.delayReason : undefined,
        })
      }
    } catch (error) {
      update({ status: 'error', error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      clearTimeout(timeout)
      if (inFlight.current === request) inFlight.current = undefined
    }
  }, [sourceDomain])

  const reset = useCallback(() => {
    inFlight.current?.abort()
    inFlight.current = undefined
    setResult({ status: 'idle' })
  }, [])

  return {
    status: result.status,
    message: result.status === 'complete' ? result.message : undefined,
    attestation: result.status === 'complete' ? result.attestation : undefined,
    delayReason: result.status === 'pending_confirmations' ? result.delayReason : undefined,
    error: result.status === 'error' ? result.error : undefined,
    fetchAttestation,
    reset,
  }
}
