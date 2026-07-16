const SEARCH_LIST_STATE_KEY = 'kedam_search_list_state';
const RESTORE_SEARCH_FLAG = 'kedam_restore_search_list';

export type SearchListAppliedFilters = {
  filter_instant_confirm?: boolean;
  filter_stars?: string;
  filter_meals?: string;
  filter_hotel_type?: string;
  filter_regions?: string;
  filter_line?: string;
  filter_operators?: string;
  filter_price_min?: number;
  filter_price_max?: number;
  sort_by?: string;
};

export type SearchListState = {
  autoSearchKey: string;
  requestId?: string | null;
  filters?: SearchListAppliedFilters;
};

export function readSearchListState(): SearchListState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SEARCH_LIST_STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SearchListState;
  } catch {
    return null;
  }
}

export function writeSearchListState(patch: Partial<SearchListState> & { autoSearchKey?: string }) {
  if (typeof window === 'undefined') return;
  try {
    const prev = readSearchListState() ?? { autoSearchKey: '' };
    const next: SearchListState = {
      ...prev,
      ...patch,
      autoSearchKey: patch.autoSearchKey ?? prev.autoSearchKey,
      filters:
        patch.filters !== undefined
          ? { ...prev.filters, ...patch.filters }
          : prev.filters,
    };
    sessionStorage.setItem(SEARCH_LIST_STATE_KEY, JSON.stringify(next));
  } catch {
    // ignore quota / private mode
  }
}

/** Replace filters entirely (used when snapshotting before hotel-details navigation). */
export function replaceSearchListFilters(
  filters: SearchListAppliedFilters,
  requestId?: string | null,
) {
  if (typeof window === 'undefined') return;
  try {
    const prev = readSearchListState() ?? { autoSearchKey: '' };
    const next: SearchListState = {
      ...prev,
      requestId: requestId ?? prev.requestId,
      filters: { ...filters },
    };
    sessionStorage.setItem(SEARCH_LIST_STATE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function clearSearchListState() {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(SEARCH_LIST_STATE_KEY);
    sessionStorage.removeItem(RESTORE_SEARCH_FLAG);
  } catch {
    // ignore
  }
}

/** Mark that the next /search mount should restore list state (hotel card → details → back). */
export function markSearchListForRestore() {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(RESTORE_SEARCH_FLAG, '1');
  } catch {
    // ignore
  }
}

export function peekSearchListRestoreFlag(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(RESTORE_SEARCH_FLAG) === '1';
  } catch {
    return false;
  }
}

export function consumeSearchListRestoreFlag(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const value = sessionStorage.getItem(RESTORE_SEARCH_FLAG);
    if (value === '1') {
      sessionStorage.removeItem(RESTORE_SEARCH_FLAG);
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

/** Pick applied listing filters from Redux hotels payload. */
export function pickAppliedFiltersFromHotels(
  hotels: Record<string, unknown> | null | undefined,
): SearchListAppliedFilters {
  if (!hotels) return {};
  const out: SearchListAppliedFilters = {};
  const keys: (keyof SearchListAppliedFilters)[] = [
    'filter_instant_confirm',
    'filter_stars',
    'filter_meals',
    'filter_hotel_type',
    'filter_regions',
    'filter_line',
    'filter_operators',
    'filter_price_min',
    'filter_price_max',
    'sort_by',
  ];
  keys.forEach((key) => {
    const value = hotels[key];
    // Keep empty strings so "cleared" filters survive restore (vs falling back to defaults).
    if (value !== undefined && value !== null) {
      (out as Record<string, unknown>)[key] = value;
    }
  });
  return out;
}

/** True when we should keep session filters instead of package defaults. */
export function shouldRestoreSearchFilters(options: {
  restoreFlag?: boolean;
  hotelsRequestId?: string | null;
  autoSearchKey?: string | null;
}): boolean {
  const saved = readSearchListState();
  if (options.restoreFlag) return true;

  if (
    options.hotelsRequestId &&
    saved?.requestId &&
    String(options.hotelsRequestId) === String(saved.requestId)
  ) {
    return true;
  }

  if (
    options.autoSearchKey &&
    saved?.autoSearchKey &&
    options.autoSearchKey === saved.autoSearchKey &&
    saved.filters &&
    Object.keys(saved.filters).length > 0
  ) {
    return true;
  }

  return false;
}
