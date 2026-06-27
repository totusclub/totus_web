/** Override via NEXT_PUBLIC_API_BASE_URL in .env.local for local dev (e.g. http://localhost:3001) */
export const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.totus.club';
