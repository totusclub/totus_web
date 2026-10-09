import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { AiAssistantProvider, ChatWidget } from '@tosmedia/ai-assistant'
import '@tosmedia/ai-assistant/styles.css'
import { getAiApiBase, getAiWsUrl } from '@/lib/aiConfig'
import useAuth from '@/hooks/useAuth'
import styles from './globalAiChat.module.css'

/** Полноэкранный чат с поддержкой на телефоне: внизу поле ввода — там кнопку Милы не показываем. */
const HIDE_ON_MOBILE_PATHS = ['/profile/support-chat']

/** Плавающая кнопка Милы — только для авторизованных, после hydrate (без SSR mismatch). */
export default function GlobalAiChat() {
  const { user, token } = useAuth()
  const { pathname } = useRouter()
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
      {/* Обёртка для мобильной версии: поднимает кнопку над нижним меню (см. globalAiChat.module.css).
          На компьютере не влияет — правила только для ширины до 1024px. */}
      <div className={HIDE_ON_MOBILE_PATHS.includes(pathname) ? `${styles.root} ${styles.hideOnMobile}` : styles.root}>
        <ChatWidget />
      </div>
    </AiAssistantProvider>
  )
}
