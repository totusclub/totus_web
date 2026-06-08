/** Local backend default — set PORT=3001 when running kedam_API, or override via .env.local */
export const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
