'use client'

import { openDB } from 'idb'
import { useCallback, useEffect } from 'react'

export interface PendingAnswer {
  sessionId: string
  examQuestionId: string
  selectedOption: 'A' | 'B' | 'C' | 'D'
  retryCount: number
}

const DATABASE_NAME = 'ujianapp-offline'
const STORE_NAME = 'pendingAnswers'

function getAnswerDatabase() {
  return openDB(DATABASE_NAME, 1, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'examQuestionId' })
      }
    },
  })
}

export function useOfflineSync(sessionId: string) {
  const sendAnswer = useCallback(async (answer: PendingAnswer): Promise<boolean> => {
    const response = await fetch(`/api/exam-sessions/${sessionId}/answers`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        examQuestionId: answer.examQuestionId,
        selectedOption: answer.selectedOption,
      }),
    })
    return response.ok
  }, [sessionId])

  const syncAll = useCallback(async () => {
    const database = await getAnswerDatabase()
    const answers = await database.getAll(STORE_NAME) as PendingAnswer[]
    for (const answer of answers) {
      if (answer.sessionId !== sessionId) continue
      if (await sendAnswer(answer)) {
        await database.delete(STORE_NAME, answer.examQuestionId)
      }
    }
  }, [sendAnswer, sessionId])

  useEffect(() => {
    const handleOnline = () => {
      void syncAll()
    }
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [syncAll])

  const saveAnswer = useCallback(async (
    examQuestionId: string,
    selectedOption: 'A' | 'B' | 'C' | 'D'
  ): Promise<boolean> => {
    const database = await getAnswerDatabase()
    const answer: PendingAnswer = {
      sessionId,
      examQuestionId,
      selectedOption,
      retryCount: 0,
    }
    await database.put(STORE_NAME, answer)

    for (let retryCount = 0; retryCount < 3; retryCount += 1) {
      try {
        if (await sendAnswer(answer)) {
          await database.delete(STORE_NAME, examQuestionId)
          return true
        }
      } catch {
        // Retry below.
      }
      if (retryCount < 2) {
        await new Promise((resolve) => window.setTimeout(resolve, 5_000))
      }
    }
    return false
  }, [sendAnswer, sessionId])

  const syncPendingBeforeSubmit = useCallback(async (): Promise<number> => {
    await syncAll()
    const database = await getAnswerDatabase()
    const pending = await database.getAll(STORE_NAME) as PendingAnswer[]
    return pending.filter((answer) => answer.sessionId === sessionId).length
  }, [sessionId, syncAll])

  return { saveAnswer, syncPendingBeforeSubmit }
}
