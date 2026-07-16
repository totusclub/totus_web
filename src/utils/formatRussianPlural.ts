/** Russian plural: 1 взрослый, 2–4 взрослых, 5+ взрослых (with 11–14 exceptions). */
export function pluralizeRu(
  count: number,
  forms: [one: string, few: string, many: string],
): string {
  const abs = Math.abs(Math.trunc(count));
  const mod10 = abs % 10;
  const mod100 = abs % 100;

  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
  return forms[2];
}

export function formatAdultsCount(count: number | string | null | undefined): string {
  const n = Number(count);
  if (!Number.isFinite(n) || n < 0) return '';
  const word = pluralizeRu(n, ['взрослый', 'взрослых', 'взрослых']);
  return `${n} ${word}`;
}

export function formatNightsCount(count: number | string | null | undefined): string {
  const n = Number(count);
  if (!Number.isFinite(n) || n < 0) return '';
  const word = pluralizeRu(n, ['ночь', 'ночи', 'ночей']);
  return `${n} ${word}`;
}

function parseDateValue(value?: string | null): Date | null {
  if (!value || typeof value !== 'string') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateRangeRu(start?: string | null, end?: string | null): string {
  const startDate = parseDateValue(start);
  const endDate = parseDateValue(end);
  if (!startDate || !endDate) return '';

  const formatter = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
  });

  return `${formatter.format(startDate)} – ${formatter.format(endDate)}`;
}

type TourGuestsDatesInput = {
  adults_count?: number | string | null;
  nights_count?: number | string | null;
  dates_info?: {
    start_date?: string | null;
    end_date?: string | null;
    check_in?: string | null;
    check_out?: string | null;
    nights_count?: number | string | null;
  } | null;
  start_date?: string | null;
  end_date?: string | null;
};

/** e.g. "2 взрослых · 16 июня – 23 июня, 7 ночей" */
export function formatAdultsCountWithDates(
  pkg: TourGuestsDatesInput | null | undefined,
): string {
  if (!pkg) return '';

  const adults = formatAdultsCount(pkg.adults_count);
  const start =
    pkg.dates_info?.start_date ||
    pkg.dates_info?.check_in ||
    pkg.start_date ||
    null;
  const end =
    pkg.dates_info?.end_date ||
    pkg.dates_info?.check_out ||
    pkg.end_date ||
    null;
  const dateRange = formatDateRangeRu(start, end);

  const nightsRaw =
    pkg.dates_info?.nights_count ?? pkg.nights_count ?? null;
  let nights = formatNightsCount(nightsRaw);
  if (!nights && start && end) {
    const startDate = parseDateValue(start);
    const endDate = parseDateValue(end);
    if (startDate && endDate) {
      const diffMs = endDate.getTime() - startDate.getTime();
      const diffNights = Math.round(diffMs / (1000 * 60 * 60 * 24));
      nights = formatNightsCount(diffNights);
    }
  }

  const parts = [adults, dateRange].filter(Boolean);
  if (!parts.length && !nights) return '';
  if (dateRange && nights) {
    return `${parts.join(' · ')}, ${nights}`;
  }
  return [...parts, nights].filter(Boolean).join(' · ');
}
