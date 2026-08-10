import Head from 'next/head'
import { AiAssistantProvider, AiHomePage } from '@tosmedia/ai-assistant'
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
        shell="page"
        apiBase={getAiApiBase()}
        wsUrl={getAiWsUrl()}
        homePath="/ai"
        tourBasePath="/ai/tours"
      >
        <AiHomePage autoOpenChat={false} />
      </AiAssistantProvider>
    </>
  )
}
