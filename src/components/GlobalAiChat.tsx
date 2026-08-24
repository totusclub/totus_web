import { useCallback, useEffect, useState } from 'react'
import { AiAssistantProvider, ChatWidget } from '@tosmedia/ai-assistant'
import '@tosmedia/ai-assistant/styles.css'
import { getAiApiBase, getAiWsUrl } from '@/lib/aiConfig'
import useAuth from '@/hooks/useAuth'

/** Плавающая кнопка Милы — только для авторизованных, после hydrate (без SSR mismatch). */
export default function GlobalAiChat() {
  const { user, token } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Same JWT as site login → AI API stores chats in MySQL for this user.
  const getAccessToken = useCallback(() => token || null, [token])

  // Same on server + first client paint → no hydration mismatch.
  if (!mounted || !user || !token) return null

  return (
    <AiAssistantProvider
      shell="widget"
      apiBase={getAiApiBase()}
      wsUrl={getAiWsUrl()}
      homePath="/"
      tourBasePath="/ai/tours"
      getAccessToken={getAccessToken}
      historyMode="auto"
    >
      <ChatWidget />
    </AiAssistantProvider>
  )
}
