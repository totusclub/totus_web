import { AiAssistantProvider, ChatWidget } from '@tosmedia/ai-assistant'
import '@tosmedia/ai-assistant/styles.css'
import { getAiApiBase, getAiWsUrl } from '@/lib/aiConfig'

/** Плавающая кнопка Милы на всех страницах сайта */
export default function GlobalAiChat() {
  return (
    <AiAssistantProvider
      shell="widget"
      apiBase={getAiApiBase()}
      wsUrl={getAiWsUrl()}
      homePath="/ai"
      tourBasePath="/ai/tours"
    >
      <ChatWidget />
    </AiAssistantProvider>
  )
}
