'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ProctorConfig, ViolationType } from '@/types'

interface UseProctorOptions {
  sessionId: string
  config: ProctorConfig
  initialViolationCount: number
  onViolationCountChange: (count: number) => void
  onAutoSubmit: () => void
  onError: (message: string) => void
}

interface ViolationResult {
  violationCount: number
  shouldSubmit: boolean
}

export function useProctor({
  sessionId,
  config,
  initialViolationCount,
  onViolationCountChange,
  onAutoSubmit,
  onError,
}: UseProctorOptions) {
  const [violationCount, setViolationCount] = useState(initialViolationCount)
  const [latestType, setLatestType] = useState<ViolationType | null>(null)
  const recordingRef = useRef(false)
  const eventCooldownRef = useRef<Record<ViolationType, number>>({
    FULLSCREEN_EXIT: 0,
    TAB_SWITCH: 0,
  })

  const recordViolation = useCallback(async (type: ViolationType) => {
    const now = Date.now()
    if (recordingRef.current || now - eventCooldownRef.current[type] < 750) return
    eventCooldownRef.current[type] = now
    recordingRef.current = true

    try {
      const response = await fetch(`/api/exam-sessions/${sessionId}/violations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'Gagal mencatat pelanggaran.')

      const violation = result.data as ViolationResult
      setViolationCount(violation.violationCount)
      setLatestType(type)
      onViolationCountChange(violation.violationCount)
      if (violation.shouldSubmit) onAutoSubmit()
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Gagal mencatat pelanggaran.')
    } finally {
      recordingRef.current = false
    }
  }, [onAutoSubmit, onError, onViolationCountChange, sessionId])

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (config.fullscreenEnabled && document.fullscreenElement === null) {
        void recordViolation('FULLSCREEN_EXIT')
      }
    }
    const handleVisibilityChange = () => {
      if (config.tabSwitchDetection && document.visibilityState === 'hidden') {
        void recordViolation('TAB_SWITCH')
      }
    }
    const handleWindowBlur = () => {
      if (config.tabSwitchDetection && document.visibilityState !== 'hidden') {
        void recordViolation('TAB_SWITCH')
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleWindowBlur)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleWindowBlur)
    }
  }, [config.fullscreenEnabled, config.tabSwitchDetection, recordViolation])

  return { violationCount, latestType }
}
