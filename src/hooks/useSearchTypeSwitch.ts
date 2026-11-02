import { useCallback } from 'react';
import { useRouter } from 'next/router';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { runFullSearchFlow, setStartSearch } from '@/store/slices/searchSlice';
import {
    pickAppliedFiltersFromHotels,
    readSearchListState,
    replaceSearchListFilters,
    writeSearchListState,
} from '@/utils/searchListState';
import { normalizeSearchType, planSearchTypeSwitch, type SearchTypeValue } from '@/utils/searchQuery';

/** Фильтры только для тура, отложенные на время режима «Отель» (вкладка браузера). */
const TOUR_ONLY_STASH_KEY = 'kedam_search_tour_only_filters';

function readTourOnlyStash(): Record<string, unknown> | null {
    try {
        const raw = sessionStorage.getItem(TOUR_ONLY_STASH_KEY);
        return raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
    } catch {
        return null;
    }
}

function writeTourOnlyStash(value: Record<string, unknown> | null) {
    try {
        if (value) sessionStorage.setItem(TOUR_ONLY_STASH_KEY, JSON.stringify(value));
        else sessionStorage.removeItem(TOUR_ONLY_STASH_KEY);
    } catch {
        // private mode / quota
    }
}

/**
 * Переключатель «Тур / Отель» на /search (этап 3, вариант A).
 * Новый поиск с тем же направлением, датами, ночами и туристами; фильтры и сортировка — общие (Р2).
 * Поиск запускается здесь же, а форма в шапке по ключу поиска видит, что он уже идёт
 * (ветка «Home popular / form already started this exact search» в searchForm.tsx).
 */
export function useSearchTypeSwitch(): {
    searchType: SearchTypeValue;
    switchSearchType: (next: SearchTypeValue) => void;
} {
    const router = useRouter();
    const dispatch = useDispatch();
    const hotels = useSelector((state: RootState) => state.search.hotels);
    const searchType = normalizeSearchType(router.query.search_type);

    const switchSearchType = useCallback(
        (next: SearchTypeValue) => {
            if (!router.isReady || normalizeSearchType(next) === searchType) return;

            const applied = {
                ...pickAppliedFiltersFromHotels(hotels),
                ...(readSearchListState()?.filters ?? {}),
            };
            const plan = planSearchTypeSwitch({
                query: router.query as Record<string, string | string[] | undefined>,
                nextType: next,
                appliedFilters: applied,
                stashedTourOnly: readTourOnlyStash(),
            });

            if (plan.searchParams.search_type === 'hotel') {
                if (plan.stashTourOnly) writeTourOnlyStash(plan.stashTourOnly);
            } else {
                writeTourOnlyStash(null);
            }

            const {
                page_number: _pn,
                page_limit: _pl,
                ...sessionFilters
            } = plan.filterParams;
            replaceSearchListFilters(sessionFilters as Parameters<typeof replaceSearchListFilters>[0]);
            writeSearchListState({ autoSearchKey: plan.autoSearchKey, requestId: null });

            dispatch(runFullSearchFlow({
                searchParams: plan.searchParams,
                filterParams: plan.filterParams,
            }) as any);
            dispatch(setStartSearch(false));
            router.push({ pathname: router.pathname, query: plan.query });
        },
        [router, dispatch, hotels, searchType],
    );

    return { searchType, switchSearchType };
}
