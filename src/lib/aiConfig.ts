/** Totus AI (Мила) connection — used by /ai pages. */

const fallbackApi = 'https://apiv2.totus.club/api'
const fallbackWs = 'wss://apiv2.totus.club/ws/assistant'

export function getAiApiBase(): string {
  if (process.env.NEXT_PUBLIC_AI_API_URL) return process.env.NEXT_PUBLIC_AI_API_URL
  const server = process.env.NEXT_PUBLIC_AI_SERVER_URL?.replace(/\/$/, '')
  if (server) return `${server}/api`
  return fallbackApi
}

export function getAiWsUrl(): string {
  if (process.env.NEXT_PUBLIC_AI_WS_URL) return process.env.NEXT_PUBLIC_AI_WS_URL
  const server = process.env.NEXT_PUBLIC_AI_SERVER_URL?.replace(/\/$/, '')
  if (server) {
    return `${server.replace(/^http/, 'ws')}/ws/assistant`
  }
  return fallbackWs
}
