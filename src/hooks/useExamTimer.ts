'use client'

import { useEffect, useRef, useState } from 'react'

interface UseExamTimerOptions {
  initialRemainingSeconds: number
  sessionId: string
  onTimeUp: () => void
}

export function useExamTimer({
  initialRemainingSeconds,
  sessionId,
  onTimeUp,
}: UseExamTimerOptions) {
  const [remainingSeconds, setRemainingSeconds] = useState(initialRemainingSeconds)
  const onTimeUpRef = useRef(onTimeUp)
  const didTimeUpRef = useRef(false)

  useEffect(() => {
    onTimeUpRef.current = onTimeUp
  }, [onTimeUp])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setRemainingSeconds((current) => Math.max(0, current - 1))
    }, 1000)
    return () => window.clearInterval(intervalId)
  }, [])

  useEffect(() => {
    if (remainingSeconds !== 0) return
    if (didTimeUpRef.current) return
    didTimeUpRef.current = true
    onTimeUpRef.current()
  }, [remainingSeconds])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void fetch(`/api/exam-sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remainingSeconds }),
      })
    }, 30_000)
    return () => window.clearInterval(intervalId)
  }, [remainingSeconds, sessionId])

  return { remainingSeconds }
}
