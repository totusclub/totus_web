const COOKIE_CONSENT_KEY = 'cookie_consent';

export function hasCookieConsent(): boolean {
    if (typeof window === 'undefined') return true;
    try {
        return localStorage.getItem(COOKIE_CONSENT_KEY) === 'accepted';
    } catch {
        return true;
    }
}

export function acceptCookieConsent(): void {
    try {
        localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    } catch {
        // localStorage might not be available
    }
}
