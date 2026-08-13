import { useEffect } from 'react'
import { useRouter } from 'next/router'

/** Dedicated /ai page is disabled — chat lives in GlobalAiChat on all site pages. */
export default function AiPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/')
  }, [router])

  return null
}
