import type { NextRouter } from 'next/router';

export type SearchTypeValue = 'package' | 'hotel';

/** Logical step in the booking funnel (same ids for tour and hotel flows). */
export type BookingFlowStepId = 'search' | 'hotel' | 'flights' | 'booking' | 'checkout';

export interface FlowStepConfig {
  id: BookingFlowStepId;
  label: string;
}

/** Tour: 5 steps. Hotel-only: 4 steps (no flight selection). */
export function getFlowSteps(searchType: SearchTypeValue): FlowStepConfig[] {
  if (searchType === 'hotel') {
    return [
      { id: 'search', label: 'Выбор отелей' },
      { id: 'hotel', label: 'Выбор отеля и размещения' },
      { id: 'booking', label: 'Бронирование' },
      { id: 'checkout', label: 'Создание и оплата' },
    ];
  }
  return [
    { id: 'search', label: 'Выбор туров' },
    { id: 'hotel', label: 'Выбор отеля и размещения' },
    { id: 'flights', label: 'Выбор перелёта' },
    { id: 'booking', label: 'Бронирование' },
    { id: 'checkout', label: 'Создание и оплата' },
  ];
}

/** 0-based index of the current step in the flow (for highlighting completed + current steps). */
export function getActiveStepIndex(
  steps: FlowStepConfig[],
  activeStepId: BookingFlowStepId
): number {
  const idx = steps.findIndex((s) => s.id === activeStepId);
  return idx >= 0 ? idx : 0;
}

export function isHotelOnlySearch(searchType: string | undefined | null): boolean {
  return searchType === 'hotel';
}

export function getSearchTypeFromQuery(
  query: Record<string, string | string[] | undefined>
): SearchTypeValue {
  const raw = Array.isArray(query.search_type) ? query.search_type[0] : query.search_type;
  return raw === 'hotel' ? 'hotel' : 'package';
}

export function getOfferPriceSubtitle(searchType: string | undefined | null): string {
  return isHotelOnlySearch(searchType) ? 'за проживание' : 'тур с перелётом';
}

export function getOfferPriceTitle(searchType: string | undefined | null): string {
  return isHotelOnlySearch(searchType) ? 'Цена за проживание' : 'Цена за тур с перелётом';
}

/** After package_details: tours → flights; hotel-only → booking (no tickets step). */
export function navigateAfterPackageCreate(
  router: NextRouter,
  packageId: string | number,
  searchType?: string | null
): void {
  const id = String(packageId);
  if (isHotelOnlySearch(searchType ?? undefined)) {
    router.push({
      pathname: '/booking',
      query: { package: id, search_type: 'hotel' },
    });
    return;
  }
  router.push(`/tickets?package=${id}`);
}
