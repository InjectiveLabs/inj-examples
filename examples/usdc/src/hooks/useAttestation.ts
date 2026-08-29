import { useState, useCallback } from 'react'
import { CIRCLE_ATTESTATION_API, INJECTIVE_DOMAIN } from '../wagmi'

export type AttestationStatus = 'idle' | 'fetching' | 'pending_confirmations' | 'complete' | 'error'

export interface AttestationResult {
  status: AttestationStatus
  message?: string
  attestation?: string
  error?: string
}

/**
 * Hook to fetch a CCTP attestation from Circle's Iris API.
 * @param sourceDomain - The CCTP source domain ID (default: INJECTIVE_DOMAIN = 29)
 */
export function useAttestation(sourceDomain: number = INJECTIVE_DOMAIN) {
  const [result, setResult] = useState<AttestationResult>({ status: 'idle' })

  const fetchAttestation = useCallback(async (txHash: string) => {
    setResult({ status: 'fetching' })

    try {
      const url = `${CIRCLE_ATTESTATION_API}/${sourceDomain}?transactionHash=${txHash}`
      const res = await fetch(url)
      const data = await res.json()

      if (!res.ok) {
        const apiMsg = data?.error ?? data?.message ?? res.statusText
        throw new Error(`API error ${res.status}: ${apiMsg}`)
      }

      // Circle API v2 response shape
      const msgs = data?.messages ?? []
      if (!msgs.length) {
        setResult({ status: 'pending_confirmations' })
        return
      }

      const msg = msgs[0]
      if (msg.status === 'complete') {
        setResult({
          status: 'complete',
          message: msg.message,
          attestation: msg.attestation,
        })
      } else {
        setResult({ status: 'pending_confirmations' })
      }
    } catch (err) {
      setResult({
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }, [sourceDomain])

  const reset = useCallback(() => {
    setResult({ status: 'idle' })
  }, [])

  return { ...result, fetchAttestation, reset }
}
