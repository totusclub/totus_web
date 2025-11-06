/**
 * Formats an ISO date string to Russian time format (HH:mm)
 * @param isoString - ISO date string
 * @returns Formatted time string (e.g., "14:30")
 */
export const formatRussianDateTime = (isoString: string): string => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const timeFormatter = new Intl.DateTimeFormat('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Europe/Moscow',
    });
    return timeFormatter.format(date);
};

/**
 * Formats an ISO date string to Russian date format (day month, weekday)
 * @param isoString - ISO date string
 * @returns Formatted date string (e.g., "7 авг, чт")
 */
export const formatRussianDate = (isoString: string): string => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: 'short',
        weekday: 'short',
        timeZone: 'Europe/Moscow',
    });
    return dateFormatter.format(date);
};

/**
 * Converts seconds to Russian time format (Xч Yм)
 * @param seconds - Number of seconds
 * @returns Formatted time string (e.g., "6ч 15м")
 */
export const secondsToRussianTime = (seconds: number): string => {
    if (!seconds) return '';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const hoursStr = hours > 0 ? `${hours}ч` : '';
    const minutesStr = minutes > 0 ? `${minutes}м` : '';
    return `${hoursStr} ${minutesStr}`.trim();
};

