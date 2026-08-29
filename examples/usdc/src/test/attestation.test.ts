/**
 * Test Suite 2: Circle Attestation Hook (useAttestation)
 *
 * Tests the attestation state machine by mocking the Circle Iris API.
 * Covers:
 *   - idle initial state
 *   - successful attestation (status: complete)
 *   - pending confirmations response
 *   - API error handling
 *   - reset functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAttestation } from '../hooks/useAttestation'

// ─────────────────────────────────────────────────────────────
// Mock fetch globally
// ─────────────────────────────────────────────────────────────
const MOCK_TX_HASH = '0xabc123def456abc123def456abc123def456abc123def456abc123def4560000'
const MOCK_MESSAGE = '0x000000000000000000000024'
const MOCK_ATTESTATION = '0xsignature000000000000000000000000'

function mockFetchOnce(responseBody: unknown, status = 200) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValueOnce({
      ok: status >= 200 && status < 300,
      status,
      statusText: status === 200 ? 'OK' : 'Error',
      json: async () => responseBody,
    } as Response),
  )
}

// ─────────────────────────────────────────────────────────────
describe('useAttestation Hook', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetAllMocks()
  })

  // ── 1. Initial state ────────────────────────────────────────
  it('starts with idle status', () => {
    const { result } = renderHook(() => useAttestation())
    expect(result.current.status).toBe('idle')
    expect(result.current.message).toBeUndefined()
    expect(result.current.attestation).toBeUndefined()
    expect(result.current.error).toBeUndefined()
  })

  // ── 2. Successful attestation ───────────────────────────────
  it('transitions to "complete" when Circle API returns a signed attestation', async () => {
    mockFetchOnce({
      messages: [
        {
          status: 'complete',
          message: MOCK_MESSAGE,
          attestation: MOCK_ATTESTATION,
        },
      ],
    })

    const { result } = renderHook(() => useAttestation())

    await act(async () => {
      await result.current.fetchAttestation(MOCK_TX_HASH)
    })

    await waitFor(() => expect(result.current.status).toBe('complete'))
    expect(result.current.message).toBe(MOCK_MESSAGE)
    expect(result.current.attestation).toBe(MOCK_ATTESTATION)
    expect(result.current.error).toBeUndefined()
  })

  // ── 3. Pending confirmations ────────────────────────────────
  it('transitions to "pending_confirmations" when API returns empty messages array', async () => {
    mockFetchOnce({ messages: [] })

    const { result } = renderHook(() => useAttestation())

    await act(async () => {
      await result.current.fetchAttestation(MOCK_TX_HASH)
    })

    await waitFor(() =>
      expect(result.current.status).toBe('pending_confirmations'),
    )
    expect(result.current.message).toBeUndefined()
    expect(result.current.attestation).toBeUndefined()
  })

  it('transitions to "pending_confirmations" when message status is not "complete"', async () => {
    mockFetchOnce({
      messages: [
        { status: 'pending_confirmations', message: null, attestation: null },
      ],
    })

    const { result } = renderHook(() => useAttestation())

    await act(async () => {
      await result.current.fetchAttestation(MOCK_TX_HASH)
    })

    await waitFor(() =>
      expect(result.current.status).toBe('pending_confirmations'),
    )
  })

  // ── 4. API error ────────────────────────────────────────────
  it('transitions to "error" when fetch throws a network error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValueOnce(new Error('Network failure')),
    )

    const { result } = renderHook(() => useAttestation())

    await act(async () => {
      await result.current.fetchAttestation(MOCK_TX_HASH)
    })

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.error).toBe('Network failure')
  })

  it('transitions to "error" when API returns a non-2xx status', async () => {
    mockFetchOnce({ error: 'not found' }, 404)

    const { result } = renderHook(() => useAttestation())

    await act(async () => {
      await result.current.fetchAttestation(MOCK_TX_HASH)
    })

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.error).toMatch(/404/)
  })

  // ── 5. Reset ────────────────────────────────────────────────
  it('resets back to idle state after reset() is called', async () => {
    mockFetchOnce({
      messages: [
        {
          status: 'complete',
          message: MOCK_MESSAGE,
          attestation: MOCK_ATTESTATION,
        },
      ],
    })

    const { result } = renderHook(() => useAttestation())

    await act(async () => {
      await result.current.fetchAttestation(MOCK_TX_HASH)
    })
    await waitFor(() => expect(result.current.status).toBe('complete'))

    act(() => {
      result.current.reset()
    })

    expect(result.current.status).toBe('idle')
    expect(result.current.message).toBeUndefined()
    expect(result.current.attestation).toBeUndefined()
  })
})
