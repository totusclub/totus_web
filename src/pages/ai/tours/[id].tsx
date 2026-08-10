import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  AiAssistantProvider,
  AiTourDetailPage,
  ChatWidget,
} from '@tosmedia/ai-assistant'
import '@tosmedia/ai-assistant/styles.css'
import { getAiApiBase, getAiWsUrl } from '@/lib/aiConfig'

export default function AiTourPage() {
  const router = useRouter()
  const tourId = typeof router.query.id === 'string' ? router.query.id : ''
  const selectedRoom =
    typeof router.query.room === 'string' ? router.query.room : null

  return (
    <>
      <Head>
        <title>Тур · Мила · Тотус клуб</title>
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
          <Link href="/ai" style={{ color: '#fe732e', fontSize: 14, fontWeight: 600 }}>
            К ассистенту
          </Link>
        </div>
        {tourId ? (
          <AiTourDetailPage tourId={tourId} selectedRoom={selectedRoom} />
        ) : (
          <div style={{ padding: 24 }}>Загрузка…</div>
        )}
        <ChatWidget />
      </AiAssistantProvider>
    </>
  )
}
