/** Override via NEXT_PUBLIC_API_BASE_URL in .env.local for local dev (e.g. http://localhost:3001) */
export const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.totus.club';

/** calling_api_v2 (voip): чат с поддержкой, socket.io. Override via NEXT_PUBLIC_VOIP_BASE_URL */
export const VOIP_BASE_URL =
    process.env.NEXT_PUBLIC_VOIP_BASE_URL || 'https://voip.totus.club';
