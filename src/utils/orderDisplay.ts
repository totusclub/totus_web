import { API_BASE_URL } from '@/config/api';
import { getLtOrderPackage } from '@/utils/orderPayment';

export type OrderDocument = { name: string; url: string };

function isLocalApiHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

function isLevelTravelDocumentUrl(url: string): boolean {
  return /level\.travel/i.test(url) && !url.includes('/uploads/');
}

export function resolveDocumentUrl(url: string | undefined | null): string {
  if (!url) return '';
  const value = String(url).trim();
  if (!value) return '';

  if (isLevelTravelDocumentUrl(value)) return '';

  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value);
      if (parsed.pathname.startsWith('/uploads/') && isLocalApiHost(parsed.hostname)) {
        return `${API_BASE_URL}${parsed.pathname}${parsed.search}`;
      }
    } catch {
      return value;
    }
    return value;
  }

  if (value.startsWith('//')) {
    const protocolRelative = `https:${value}`;
    return isLevelTravelDocumentUrl(protocolRelative) ? '' : protocolRelative;
  }

  const path = value.startsWith('/') ? value : `/${value}`;
  return `${API_BASE_URL}${path}`;
}

export function getDocumentName(url: string, providedName?: string): string {
  if (providedName?.trim()) return providedName.trim();

  try {
    const fileName = url.split('/').pop()?.split('?')[0] || '';
    if (fileName.includes('agreement.pdf') || url.includes('agreement.pdf')) {
      return 'Договор оферты.pdf';
    }
    if (fileName.includes('license_agreement') || url.includes('license_agreement')) {
      return 'Лицензионный договор.pdf';
    }
    if (/voucher|ваучер/i.test(url) || /voucher/i.test(fileName)) {
      return 'Ваучер на отель.pdf';
    }
    if (/ticket|билет/i.test(url) || /ticket/i.test(fileName)) {
      return 'Авиабилет.pdf';
    }
    return fileName || 'Документ.pdf';
  } catch {
    return 'Документ.pdf';
  }
}

function pushDocument(
  docs: OrderDocument[],
  seen: Set<string>,
  url: string | undefined | null,
  name?: string,
) {
  if (!url) return;
  const resolved = resolveDocumentUrl(url);
  if (!resolved || seen.has(resolved)) return;
  seen.add(resolved);
  docs.push({ name: getDocumentName(url, name), url: resolved });
}

export function collectOrderDocuments(
  order: any,
  apiDocuments: Array<{
    title?: string;
    public_url?: string;
    source_url?: string;
    url?: string;
  }> = [],
): OrderDocument[] {
  if (!order) return [];

  const docs: OrderDocument[] = [];
  const seen = new Set<string>();

  const lt = getLtOrderPackage(order);
  const packageData = order?.package ?? {};
  const nestedPackage = packageData?.package ?? {};

  const sources = [order, packageData, nestedPackage, lt].filter(Boolean);

  for (const src of sources) {
    pushDocument(docs, seen, src?.agreement_doc, 'Договор оферты.pdf');
    pushDocument(docs, seen, src?.agreement_license, 'Лицензионный договор.pdf');
    pushDocument(docs, seen, src?.voucher, 'Ваучер на отель.pdf');
    pushDocument(docs, seen, src?.ticket, 'Авиабилет.pdf');
  }

  const attachmentLists = [
    packageData?.attachments,
    nestedPackage?.attachments,
    lt?.attachments,
    packageData?.saved_documents,
    lt?.saved_documents,
  ];

  for (const list of attachmentLists) {
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      pushDocument(docs, seen, item?.public_url ?? item?.url, item?.title);
    }
  }

  for (const item of apiDocuments) {
    pushDocument(docs, seen, item?.public_url ?? item?.url, item?.title);
  }

  return docs;
}

export function resolveStatusKey(pkg: any, order: any): 'pending' | 'approved' | 'cancel' {
  const lt = getLtOrderPackage(order) ?? pkg;
  const state = String(
    lt?.state ?? order?.order_state ?? order?.state ?? '',
  ).toLowerCase();

  if (state.includes('cancel')) return 'cancel';
  if (
    state.includes('approve') ||
    state.includes('confirm') ||
    state === 'documents_sent' ||
    state === 'completed'
  ) {
    return 'approved';
  }
  return 'pending';
}

export function getStatusCssKey(pkg: any, order: any): 'pending' | 'confirm' | 'cancel' {
  const key = resolveStatusKey(pkg, order);
  if (key === 'approved') return 'confirm';
  if (key === 'cancel') return 'cancel';
  return 'pending';
}

export function getStatusColor(pkg: any, order: any): string {
  const key = resolveStatusKey(pkg, order);
  if (key === 'cancel') return 'var(--bgTertiary)';
  if (key === 'approved') return 'var(--primary_green)';
  return 'var(--primary_blue)';
}

export function getStatusLabel(order: any, pkg?: any): string {
  const lt = getLtOrderPackage(order) ?? pkg;
  return (
    lt?.status_for_client ??
    order?.package?.status_for_client ??
    (resolveStatusKey(lt, order) === 'cancel'
      ? 'Отменено'
      : resolveStatusKey(lt, order) === 'approved'
        ? 'Подтверждено'
        : 'В обработке')
  );
}

export function getOrderCreatedAt(order: any): Date | null {
  const raw =
    order?.c_date ??
    order?.created_at ??
    order?.createdAt ??
    order?.package?.c_date ??
    order?.package?.created_at ??
    order?.package?.createdAt;

  if (raw == null || raw === '') return null;

  if (typeof raw === 'number') {
    const date = new Date(raw > 1e12 ? raw : raw * 1000);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function sortOrdersByNewest(orders: any[]): any[] {
  if (!Array.isArray(orders)) return [];

  return [...orders].sort((a, b) => {
    const dateA = getOrderCreatedAt(a)?.getTime() ?? 0;
    const dateB = getOrderCreatedAt(b)?.getTime() ?? 0;
    if (dateA !== dateB) return dateB - dateA;

    const idA = Number(a?.order_id ?? a?.id ?? 0);
    const idB = Number(b?.order_id ?? b?.id ?? 0);
    return idB - idA;
  });
}

export function formatOrderStartLabel(order: any): string {
  const created = getOrderCreatedAt(order);
  if (!created) return '';

  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(created);
}

export function formatTravelPeriod(pkg: any): string {
  const start = pkg?.dates_info?.start_date;
  const end = pkg?.dates_info?.end_date;
  if (!start || !end) return '—';

  const formatter = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
  });
  const weekdayFormatter = new Intl.DateTimeFormat('ru-RU', {
    weekday: 'short',
  });

  const startDate = new Date(start);
  const endDate = new Date(end);

  return `${formatter.format(startDate)}, ${weekdayFormatter.format(startDate)} – ${formatter.format(endDate)}, ${weekdayFormatter.format(endDate)}`;
}

export function formatDepartureLine(pkg: any): string {
  const departureDate = pkg?.dates_info?.start_date;
  const city =
    pkg?.departure?.name_ru ||
    pkg?.departure?.name_en ||
    pkg?.departure?.name ||
    '';

  if (!departureDate && !city) return '';

  const formatter = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
  });

  const datePart = departureDate
    ? formatter.format(new Date(departureDate))
    : '';

  return `Вылет: ${city || '—'}${datePart ? `, ${datePart}` : ''}`;
}

export function formatOrderPrice(order: any): string {
  const lt = getLtOrderPackage(order);
  const amount = lt?.price ?? lt?.full_price ?? 0;
  if (amount == null) return '—';
  return `${Number(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F')} ₽`;
}

export function getNestedPackage(order: any) {
  if (!order) return null;
  const lt = getLtOrderPackage(order);
  if (lt?.package?.hotel || lt?.package?.dates_info) {
    return lt.package;
  }
  if (lt?.hotel || lt?.dates_info) {
    return lt;
  }
  return null;
}
