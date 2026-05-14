const YMD = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 86400000;

/**
 * Calendar YYYY-MM-DD or Date → local calendar date at 00:00 (no UTC shift from `new Date('YYYY-MM-DD')`).
 * For non-YMD strings, falls back like the old code then normalizes to the local calendar day.
 */
export function parseLocalYmdInput(input: string | Date): Date {
    if (input instanceof Date) {
        return new Date(input.getFullYear(), input.getMonth(), input.getDate());
    }
    const s = String(input).trim();
    if (YMD.test(s)) {
        const [y, m, d] = s.split('-').map(Number);
        return new Date(y, m - 1, d);
    }
    const t = new Date(s);
    if (Number.isNaN(t.getTime())) return t;
    return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}

function formatYmd(d: Date): string {
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${mo}-${day}`;
}

/** Pure calendar-day distance for two YYYY-MM-DD strings (UTC on components — stable across TZ). */
export function differenceCalendarDaysBetweenYmd(startYmd: string, endYmd: string): number | null {
    const s = startYmd.trim();
    const e = endYmd.trim();
    if (!YMD.test(s) || !YMD.test(e)) return null;
    const [y1, m1, d1] = s.split('-').map(Number);
    const [y2, m2, d2] = e.split('-').map(Number);
    const t1 = Date.UTC(y1, m1 - 1, d1);
    const t2 = Date.UTC(y2, m2 - 1, d2);
    const days = Math.round((t2 - t1) / MS_PER_DAY);
    return Number.isFinite(days) ? days : null;
}

/** Same rule as legacy `calculateStayDates`: checkout = departure local day + `nights` via `setDate`. */
export function endYmdAfterNights(departureYmd: string, nights: number): string {
    const start = parseLocalYmdInput(departureYmd);
    const end = new Date(start);
    end.setDate(start.getDate() + nights);
    return formatYmd(end);
}

/** Package search date block: single departure day + computed return (legacy field set). */
export function stayRangeFromDeparture(departure: string | Date, nightCount: number) {
    const start = parseLocalYmdInput(departure);
    const sd = formatYmd(start);
    const end = new Date(start);
    end.setDate(start.getDate() + nightCount);
    return {
        start_date: sd,
        start_date_from: sd,
        start_date_till: sd,
        end_date_till: formatYmd(end),
    };
}
