import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { AiAssistantProvider, ChatWidget } from '@tosmedia/ai-assistant'
import '@tosmedia/ai-assistant/styles.css'
import { getAiApiBase, getAiWsUrl } from '@/lib/aiConfig'
import useAuth from '@/hooks/useAuth'
import { useSupportCall } from '@/components/support/SupportCallProvider'
import styles from './globalAiChat.module.css'
import MobileMilaChat from './mila/MobileMilaChat'

/** Телефон и планшет — та же граница, что у нижнего меню (mobileBottomBar). */
const MOBILE_QUERY = '(max-width: 1024px)'

/** true на ширине до 1024px; следит за поворотом экрана и изменением окна. */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches,
  )
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY)
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return isMobile
}

/** Полноэкранный чат с поддержкой на телефоне: внизу поле ввода — там кнопку Милы не показываем. */
const HIDE_ON_MOBILE_PATHS = ['/profile/support-chat']

/**
 * Плавающая кнопка Милы — только для авторизованных, после hydrate (без SSR mismatch),
 * и только при доступе в Calling Admin (как вкладка Totus AI в приложении, см. SupportCallProvider).
 */
export default function GlobalAiChat() {
  const { user, token } = useAuth()
  const { pathname } = useRouter()
  const isMobile = useIsMobile()
  const [mounted, setMounted] = useState(false)
  const { milaAllowed } = useSupportCall()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Same JWT as site login → AI API stores chats in MySQL for this user.
  const getAccessToken = useCallback(() => token || null, [token])

  // Same on server + first client paint → no hydration mismatch.
  if (!mounted || !user || !token) return null
  // «Заблок.» в Calling Admin или доступ ещё проверяется — Милы нет.
  if (!milaAllowed) return null

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
      {isMobile ? (
        // Телефон и планшет: чат на весь экран (макет «Мила на телефоне», утверждён 09.10.2026).
        <MobileMilaChat hideFab={HIDE_ON_MOBILE_PATHS.includes(pathname)} />
      ) : (
        // Компьютер: плавающее окно пакета, как раньше. Обёртка — на случай ширины на границе 1024px
        // (правила globalAiChat.module.css только для ширины до 1024px).
        <div className={HIDE_ON_MOBILE_PATHS.includes(pathname) ? `${styles.root} ${styles.hideOnMobile}` : styles.root}>
          <ChatWidget />
        </div>
      )}
    </AiAssistantProvider>
  )
}
