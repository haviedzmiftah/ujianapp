'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useProctor } from '@/hooks/useProctor'
import type { ProctorConfig } from '@/types'
import { FullscreenGuard } from './FullscreenGuard'
import { ViolationWarningModal } from './ViolationWarningModal'

interface ProctorServiceProps {
  sessionId: string
  config: ProctorConfig
  initialViolationCount: number
  onViolationCountChange: (count: number) => void
  onAutoSubmit: () => void
  onError: (message: string) => void
  children: ReactNode
}

export function ProctorService({
  sessionId,
  config,
  initialViolationCount,
  onViolationCountChange,
  onAutoSubmit,
  onError,
  children,
}: ProctorServiceProps) {
  const [isWarningOpen, setIsWarningOpen] = useState(false)
  const { violationCount, latestType } = useProctor({
    sessionId,
    config,
    initialViolationCount,
    onViolationCountChange,
    onAutoSubmit,
    onError,
  })

  useEffect(() => {
    if (latestType) setIsWarningOpen(true)
  }, [latestType])

  return (
    <>
      <FullscreenGuard enabled={config.fullscreenEnabled}>
        {children}
      </FullscreenGuard>
      <ViolationWarningModal
        open={isWarningOpen}
        violationCount={violationCount}
        onConfirm={() => setIsWarningOpen(false)}
      />
    </>
  )
}
