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
  filter_rating?: string;
  filter_wifi?: string;
  filter_beach_surface?: string;
  filter_beach_type?: string;
  filter_category?: string;
  filter_confirmability?: string;
  filter_adults_only?: boolean;
  filter_direct_flight?: boolean;
  filter_aquapark?: boolean;
  filter_pool?: boolean;
  filter_kids_pool?: boolean;
  filter_heated_pool?: boolean;
  filter_kids_club?: boolean;
  filter_kids_menu?: boolean;
  filter_nanny?: boolean;
  filter_aircon?: boolean;
  filter_parking?: boolean;
  filter_bar?: boolean;
  filter_massage?: boolean;
  filter_thermal_fun?: boolean;
  filter_no_single_men?: boolean;
  sort_by?: string;
};

/** Keys persisted/restored for listing filter state. */
export const SEARCH_LIST_FILTER_KEYS: (keyof SearchListAppliedFilters)[] = [
  'filter_instant_confirm',
  'filter_stars',
  'filter_meals',
  'filter_hotel_type',
  'filter_regions',
  'filter_line',
  'filter_operators',
  'filter_price_min',
  'filter_price_max',
  'filter_rating',
  'filter_wifi',
  'filter_beach_surface',
  'filter_beach_type',
  'filter_category',
  'filter_confirmability',
  'filter_adults_only',
  'filter_direct_flight',
  'filter_aquapark',
  'filter_pool',
  'filter_kids_pool',
  'filter_heated_pool',
  'filter_kids_club',
  'filter_kids_menu',
  'filter_nanny',
  'filter_aircon',
  'filter_parking',
  'filter_bar',
  'filter_massage',
  'filter_thermal_fun',
  'filter_no_single_men',
  'sort_by',
];

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

/**
 * Тип поиска, к которому относится снимок: по autoSearchKey (в нём есть search_type).
 * Пустой или битый ключ (например, «{}» после главной) — тип неизвестен (null).
 */
export function searchTypeOfListState(state: SearchListState | null | undefined): 'package' | 'hotel' | null {
  try {
    const core = JSON.parse(String(state?.autoSearchKey || ''));
    if (!core || typeof core !== 'object' || Object.keys(core).length === 0) return null;
    return core.search_type === 'hotel' ? 'hotel' : 'package';
  } catch {
    return null;
  }
}

/**
 * Снимок выдачи для поиска нужного типа. Фильтры тура не применяются к поиску отелей
 * и наоборот: если снимок от другого типа (или тип неизвестен) — без фильтров.
 */
export function readSearchListStateFor(searchType: unknown): SearchListState | null {
  const state = readSearchListState();
  if (!state) return null;
  const want = searchType === 'hotel' ? 'hotel' : 'package';
  if (searchTypeOfListState(state) === want) return state;
  return { ...state, filters: undefined };
}

export function writeSearchListState(patch: Partial<SearchListState> & { autoSearchKey?: string }) {
  if (typeof window === 'undefined') return;
  try {
    const prev = readSearchListState() ?? { autoSearchKey: '' };
    const next: SearchListState = {
      ...prev,
      ...patch,
      autoSearchKey: patch.autoSearchKey ?? prev.autoSearchKey,
      // Replace filters entirely when provided — merging kept stale amenities
      // (e.g. filter_wifi) from a previous country and zeroed Turkey results.
      filters: patch.filters !== undefined ? { ...patch.filters } : prev.filters,
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
  SEARCH_LIST_FILTER_KEYS.forEach((key) => {
    const value = hotels[key];
    // Keep empty strings so "cleared" filters survive restore (vs falling back to defaults).
    if (value === undefined || value === null) return;
    // Amenity toggles are omit-when-off.
    if (value === false && key !== 'filter_instant_confirm') return;
    (out as Record<string, unknown>)[key] = value;
  });
  return out;
}

/** Strip values that must not be sent / persisted as active filters.
 * Empty strings on filter_* keys are kept so "unchecked" survives restore
 * (and blocks package defaults like stars 3,4,5).
 */
export function sanitizeListingFilterParams(
  params: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  if (!params) return {};
  const out: Record<string, unknown> = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (typeof value === 'string' && value.trim() === '') {
      if (key.startsWith('filter_')) {
        out[key] = '';
      }
      return;
    }
    if (value === false && key !== 'filter_instant_confirm' && key.startsWith('filter_')) return;
    if (Array.isArray(value) && value.length === 0) return;
    out[key] = value;
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

  // Same in-memory / session search result — keep sidebar selection.
  if (
    options.hotelsRequestId &&
    saved?.requestId &&
    String(options.hotelsRequestId) === String(saved.requestId)
  ) {
    return true;
  }

  // Only when caller passes the *current URL* autoSearchKey (not saved.autoSearchKey).
  // Comparing saved key to itself always returned true and re-applied stale filters.
  if (
    options.autoSearchKey &&
    saved?.autoSearchKey &&
    options.autoSearchKey === saved.autoSearchKey &&
    saved.filters &&
    Object.keys(saved.filters).length > 0 &&
    saved.requestId
  ) {
    return true;
  }

  return false;
}
