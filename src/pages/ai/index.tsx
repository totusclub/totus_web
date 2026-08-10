import Head from 'next/head'
import Link from 'next/link'
import {
  AiAssistantProvider,
  AiHomePage,
  ChatWidget,
} from '@tosmedia/ai-assistant'
import '@tosmedia/ai-assistant/styles.css'
import { getAiApiBase, getAiWsUrl } from '@/lib/aiConfig'

export default function AiPage() {
  return (
    <>
      <Head>
        <title>Мила — подбор туров · Тотус клуб</title>
        <meta
          name="description"
          content="Мила — виртуальный турагент Тотус клуба: подбор туров в диалоге"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </Head>

      <AiAssistantProvider
        apiBase={getAiApiBase()}
        wsUrl={getAiWsUrl()}
        homePath="/ai"
        tourBasePath="/ai/tours"
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '12px 16px',
            borderBottom: '1px solid #e6e8eb',
            background: '#fff',
          }}
        >
          <Link href="/" style={{ color: '#35a8e0', fontSize: 14, fontWeight: 600 }}>
            ← На сайт Тотус клуб
          </Link>
          <span style={{ color: '#9ca3af', fontSize: 12 }}>AI подбор туров</span>
        </div>
        <AiHomePage />
        <ChatWidget />
      </AiAssistantProvider>
    </>
  )
}
