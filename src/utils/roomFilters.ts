import { ARLEKINO_OPERATOR_ID_BASE, isArlekinoOperatorId } from './roomOffers';

export type RoomFilterOption = {
    id: string | number | boolean;
    name?: string;
    min_price?: number;
    count?: number;
    selected?: boolean;
    disabled?: boolean;
};

export type HotelRoomFilters = {
    meals?: RoomFilterOption[];
    free_cancel?: RoomFilterOption[];
    confirmability?: RoomFilterOption[];
    operators?: RoomFilterOption[];
    payment_benefits?: RoomFilterOption[] | null;
    travel_benefits?: RoomFilterOption[] | null;
};

export const CONFIRMABILITY_LABELS: Record<number, string> = {
    1: 'Моментальное подтверждение',
    2: 'Быстрое подтверждение',
    3: 'Все туры',
};

export function getConfirmabilityLabel(option: RoomFilterOption): string {
    if (option.name?.trim()) return option.name.trim();
    return CONFIRMABILITY_LABELS[Number(option.id)] ?? `Подтверждение ${option.id}`;
}

export function isConfirmabilityFilterActive(filters: HotelRoomFilters | null): boolean {
    const selected = (filters?.confirmability ?? []).find((item) => item.selected);
    if (!selected) return false;
    return Number(selected.id) !== 3;
}

type OfferConfirmabilityFields = {
    extras?: { instant_confirm?: boolean | number | string } | null;
    confirmability_index?: number | string | null;
};

function readOfferConfirmabilityFields(offer: Record<string, unknown>): {
    extras?: { instant_confirm?: boolean | number | string };
    index: number;
} {
    const extras = (offer.extras ?? offer.lt_extras) as
        | { instant_confirm?: boolean | number | string }
        | undefined;
    const index = Number(offer.confirmability_index);

    return { extras, index };
}

function isInstantConfirmValue(value: unknown): boolean {
    return value === true || value === 1 || value === '1' || value === 'true';
}

/** Map offer fields to the same confirmability bucket ids used in room filters. */
export function getOfferConfirmabilityBucketId(
    offer: OfferConfirmabilityFields | Record<string, unknown>,
): number | null {
    const { extras, index } = readOfferConfirmabilityFields(offer as Record<string, unknown>);

    if (isInstantConfirmValue(extras?.instant_confirm) || index === 1) return 1;
    if (Number.isFinite(index) && index === 2) return 2;
    if (Number.isFinite(index) && index >= 3) return 3;
    if (extras?.instant_confirm === false || extras?.instant_confirm === 0 || extras?.instant_confirm === '0') {
        return 2;
    }

    return null;
}

/** Label on room offer rows — distinct instant vs fast, aligned with filter names. */
export function getOfferConfirmabilityDisplayLabel(
    offer: OfferConfirmabilityFields | Record<string, unknown> | null | undefined,
): string | null {
    if (!offer) return null;

    const { extras, index } = readOfferConfirmabilityFields(offer as Record<string, unknown>);

    if (isInstantConfirmValue(extras?.instant_confirm) || index === 1) {
        return CONFIRMABILITY_LABELS[1];
    }

    if (
        index === 2 ||
        extras?.instant_confirm === false ||
        extras?.instant_confirm === 0 ||
        extras?.instant_confirm === '0'
    ) {
        return CONFIRMABILITY_LABELS[2];
    }

    if (Number.isFinite(index) && index >= 3) {
        return 'Подтверждение по запросу';
    }

    return null;
}

/** @deprecated Prefer getOfferConfirmabilityDisplayLabel */
export function getOfferConfirmabilityLabel(
    offer: OfferConfirmabilityFields | Record<string, unknown> | null | undefined,
): string | null {
    return getOfferConfirmabilityDisplayLabel(offer);
}

export function cloneRoomFilters(filters: HotelRoomFilters | null | undefined): HotelRoomFilters | null {
    if (!filters) return null;
    return JSON.parse(JSON.stringify(filters)) as HotelRoomFilters;
}

function optionIdEquals(a: string | number | boolean, b: string | number | boolean): boolean {
    return String(a) === String(b);
}

function preserveOptionSelections(
    nextOptions: RoomFilterOption[] | undefined,
    previousOptions: RoomFilterOption[] | undefined,
): RoomFilterOption[] | undefined {
    if (!nextOptions) return undefined;

    const merged = nextOptions.map((option) => {
        const previous = previousOptions?.find((item) => optionIdEquals(item.id, option.id));
        if (!previous) return option;
        return { ...option, selected: previous.selected };
    });

    // Keep previously selected options that the API response dropped (e.g. multi meal filter).
    const nextIds = new Set(merged.map((option) => String(option.id).toUpperCase()));
    (previousOptions ?? []).forEach((option) => {
        if (!option.selected) return;
        const id = String(option.id).toUpperCase();
        if (nextIds.has(id)) return;
        merged.push({ ...option, selected: true, disabled: false });
        nextIds.add(id);
    });

    return merged;
}

export function normalizeInitialRoomFilters(filters: HotelRoomFilters): HotelRoomFilters {
    return {
        ...filters,
        free_cancel: filters.free_cancel?.map((item) => ({
            ...item,
            selected: item.id === true ? item.selected : false,
        })),
    };
}

export function preserveFilterSelections(
    next: HotelRoomFilters,
    previous: HotelRoomFilters | null | undefined,
): HotelRoomFilters {
    if (!previous) return normalizeInitialRoomFilters(next);

    return normalizeInitialRoomFilters({
        ...next,
        meals: preserveOptionSelections(next.meals, previous.meals),
        free_cancel: preserveOptionSelections(next.free_cancel, previous.free_cancel),
        confirmability: preserveOptionSelections(next.confirmability, previous.confirmability),
        operators: preserveOptionSelections(next.operators, previous.operators),
    });
}

type RoomOffer = {
    operator_id?: number | string;
    operator_name?: string;
    analytics_price?: number;
    price?: number;
    confirmability_index?: number | string;
    extras?: {
        instant_confirm?: boolean;
        cancellation_policy?: { kind?: string } | null;
    };
};

export function buildOperatorsFilterFromRooms(
    rooms: unknown[] | null | undefined,
    previousOperators?: RoomFilterOption[] | null,
): RoomFilterOption[] {
    if (!rooms?.length) {
        return (previousOperators ?? []).map((operator) => ({ ...operator }));
    }

    const selectedIds = new Set(
        (previousOperators ?? [])
            .filter((operator) => operator.selected)
            .map((operator) => Number(operator.id)),
    );

    const operators = new Map<number, { id: number; name: string; min_price: number; count: number }>();

    rooms.forEach((room) => {
        const offers = (room as { offers?: Record<string, RoomOffer[]> })?.offers ?? {};
        Object.values(offers).forEach((offerList) => {
            if (!Array.isArray(offerList)) return;

            offerList.forEach((offer) => {
                const rawId = Number(offer.operator_id);
                if (!Number.isFinite(rawId)) return;
                // Room Type v3: у каждой нашей Room Type свой operator_id (990000 + id) с одним
                // именем «Arlekino» — в фильтре показываем один пункт (id 990000), не дедуплицируя offers.
                const id = isArlekinoOperatorId(rawId) ? ARLEKINO_OPERATOR_ID_BASE : rawId;

                const price = Number(offer.analytics_price ?? offer.price);
                const safePrice = Number.isFinite(price) ? price : Number.POSITIVE_INFINITY;
                const existing = operators.get(id);

                if (!existing) {
                    operators.set(id, {
                        id,
                        name: String(offer.operator_name || id),
                        min_price: safePrice,
                        count: 1,
                    });
                    return;
                }

                existing.count += 1;
                if (safePrice < existing.min_price) {
                    existing.min_price = safePrice;
                }
            });
        });
    });

    (previousOperators ?? []).forEach((previous) => {
        const id = Number(previous.id);
        if (!Number.isFinite(id) || operators.has(id)) return;

        operators.set(id, {
            id,
            name: String(previous.name || id),
            min_price: Number(previous.min_price) || 0,
            count: 0,
        });
    });

    return Array.from(operators.values())
        .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
        .map((operator) => ({
            id: operator.id,
            name: operator.name,
            min_price: Number.isFinite(operator.min_price) ? operator.min_price : 0,
            count: operator.count,
            selected: selectedIds.has(operator.id),
            disabled: false,
        }));
}

function offerMatchesOperator(offer: Record<string, unknown>, selectedOperatorIds: number[]): boolean {
    if (!selectedOperatorIds.length) return true;
    const operatorId = Number(offer.operator_id);
    if (isArlekinoOperatorId(operatorId)) {
        // Единый пункт «Arlekino» в фильтре покрывает все наши operator_id (≥ 990000).
        return selectedOperatorIds.some(isArlekinoOperatorId);
    }
    return selectedOperatorIds.includes(operatorId);
}

function offerMatchesFreeCancel(offer: Record<string, unknown>, requireFreeCancel: boolean): boolean {
    if (!requireFreeCancel) return true;

    const extras = offer.extras as { cancellation_policy?: { kind?: string } } | undefined;
    const policy = extras?.cancellation_policy;
    if (!policy) return false;
    return policy.kind === 'flexible' || policy.kind === 'moderate';
}

function offerMatchesConfirmabilityId(offer: Record<string, unknown>, id: number): boolean {
    const bucketId = getOfferConfirmabilityBucketId(offer);
    if (!bucketId) return false;
    if (id === 1) return bucketId === 1;
    if (id === 2) return bucketId === 1 || bucketId === 2;
    if (id === 3) return true;
    return false;
}

function offerMatchesConfirmability(offer: Record<string, unknown>, selectedIds: number[]): boolean {
    if (!selectedIds.length) return true;
    if (selectedIds.length === 1 && selectedIds[0] === 3) return true;
    return selectedIds.some((id) => offerMatchesConfirmabilityId(offer, id));
}

function countOffersInRooms(rooms: unknown[]): number {
    return rooms.reduce((total, room) => {
        const offers = (room as { offers?: Record<string, unknown[]> })?.offers ?? {};
        return (
            total +
            Object.values(offers).reduce(
                (groupTotal, offerList) => groupTotal + (Array.isArray(offerList) ? offerList.length : 0),
                0,
            )
        );
    }, 0);
}

function isSelectedFilterOption(option: RoomFilterOption): boolean {
    return Boolean(option.selected);
}

export function filterRoomsByFilters(rooms: unknown[] | null | undefined, filters: HotelRoomFilters | null): unknown[] {
    if (!rooms?.length) return [];
    if (!filters) return rooms;

    const selectedMeals = (filters.meals ?? [])
        .filter(isSelectedFilterOption)
        .map((meal) => String(meal.id).toUpperCase());

    const requireFreeCancel = (filters.free_cancel ?? []).some(
        (item) => isSelectedFilterOption(item) && item.id === true,
    );

    const selectedConfirmability = (filters.confirmability ?? [])
        .filter(isSelectedFilterOption)
        .map((item) => Number(item.id))
        .filter((id) => Number.isFinite(id));

    const selectedOperators = (filters.operators ?? [])
        .filter(isSelectedFilterOption)
        .map((item) => Number(item.id))
        .filter((id) => Number.isFinite(id));

    return rooms
        .map((room) => {
            const roomRecord = room as { offers?: Record<string, unknown[]> };
            const filteredOffers: Record<string, unknown[]> = {};

            Object.entries(roomRecord.offers ?? {}).forEach(([mealType, offerList]) => {
                if (selectedMeals.length > 0 && !selectedMeals.includes(mealType.toUpperCase())) return;

                const offers = (offerList ?? []).filter((offer) => {
                    const offerRecord = offer as Record<string, unknown>;
                    return (
                        offerMatchesFreeCancel(offerRecord, requireFreeCancel) &&
                        offerMatchesConfirmability(offerRecord, selectedConfirmability) &&
                        offerMatchesOperator(offerRecord, selectedOperators)
                    );
                });

                if (offers.length > 0) {
                    filteredOffers[mealType] = offers;
                }
            });

            if (Object.keys(filteredOffers).length === 0) return null;
            return { ...roomRecord, offers: filteredOffers };
        })
        .filter(Boolean);
}

function withGroupSelection(
    filters: HotelRoomFilters,
    group: 'meals' | 'free_cancel' | 'confirmability' | 'operators',
    optionId: string | number | boolean,
    selected: boolean,
): HotelRoomFilters {
    const mapGroup = (options: RoomFilterOption[] | undefined) =>
        options?.map((option) => ({
            ...option,
            selected: optionIdEquals(option.id, optionId) ? selected : option.selected,
        }));

    if (group === 'meals') return { ...filters, meals: mapGroup(filters.meals) };
    if (group === 'free_cancel') {
        return {
            ...filters,
            free_cancel: filters.free_cancel?.map((option) => ({
                ...option,
                selected: optionIdEquals(option.id, optionId) ? selected : false,
            })),
        };
    }
    if (group === 'confirmability') return { ...filters, confirmability: mapGroup(filters.confirmability) };
    return { ...filters, operators: mapGroup(filters.operators) };
}

function countOffersForOption(
    rooms: unknown[],
    filters: HotelRoomFilters,
    group: 'meals' | 'free_cancel' | 'confirmability' | 'operators',
    option: RoomFilterOption,
): number {
    const isSelected = Boolean(option.selected);

    if (isSelected && group !== 'free_cancel' && group !== 'confirmability') {
        return countOffersInRooms(filterRoomsByFilters(rooms, filters) as unknown[]);
    }

    if (group === 'confirmability') {
        const optionId = Number(option.id);
        const testFilters: HotelRoomFilters = {
            ...filters,
            confirmability: (filters.confirmability ?? []).map((item) => ({
                ...item,
                selected: Number(item.id) === optionId && optionId !== 3,
            })),
        };

        return countOffersInRooms(filterRoomsByFilters(rooms, testFilters) as unknown[]);
    }

    if (group === 'meals' || group === 'operators') {
        const groupKey = group;
        const options = filters[groupKey] ?? [];
        const selectedIds = new Set(
            options
                .filter(isSelectedFilterOption)
                .map((item) => String(item.id)),
        );
        const optionId = String(option.id);

        if (selectedIds.has(optionId)) {
            selectedIds.delete(optionId);
        } else {
            selectedIds.add(optionId);
        }

        const testFilters: HotelRoomFilters = {
            ...filters,
            [groupKey]: options.map((item) => ({
                ...item,
                selected: selectedIds.has(String(item.id)),
            })),
        };

        return countOffersInRooms(filterRoomsByFilters(rooms, testFilters) as unknown[]);
    }

    const testFilters = withGroupSelection(filters, group, option.id, true);
    return countOffersInRooms(filterRoomsByFilters(rooms, testFilters) as unknown[]);
}

export function enrichRoomFilterOptions(
    rooms: unknown[] | null | undefined,
    filters: HotelRoomFilters | null,
): HotelRoomFilters | null {
    if (!filters || !rooms?.length) return filters;

    const enrich = (
        group: 'meals' | 'free_cancel' | 'confirmability' | 'operators',
        options: RoomFilterOption[] | undefined,
    ) =>
        options?.map((option) => {
            const count = countOffersForOption(rooms, filters, group, option);
            return {
                ...option,
                count,
                disabled: count === 0 && !option.selected,
            };
        });

    return {
        ...filters,
        meals: enrich('meals', filters.meals),
        free_cancel: enrich('free_cancel', filters.free_cancel),
        confirmability: enrich('confirmability', filters.confirmability),
        operators: enrich('operators', filters.operators),
    };
}

export function toggleMealFilter(filters: HotelRoomFilters, mealId: string): HotelRoomFilters {
    const normalizedId = mealId.toUpperCase();

    return {
        ...filters,
        meals: filters.meals?.map((meal) =>
            String(meal.id).toUpperCase() === normalizedId
                ? { ...meal, selected: !meal.selected, disabled: false }
                : meal,
        ),
    };
}

export function toggleFreeCancelFilter(filters: HotelRoomFilters, id: boolean): HotelRoomFilters {
    const isAlreadySelected = filters.free_cancel?.some(
        (item) => item.selected && optionIdEquals(item.id, id),
    );

    if (isAlreadySelected) {
        return {
            ...filters,
            free_cancel: filters.free_cancel?.map((item) => ({ ...item, selected: false })),
        };
    }

    return {
        ...filters,
        free_cancel: filters.free_cancel?.map((item) => ({
            ...item,
            selected: optionIdEquals(item.id, id),
        })),
    };
}

/** Single-select confirmability (radio): one bucket at a time; deselect = all tours. */
export function selectConfirmabilityFilter(filters: HotelRoomFilters, id: number): HotelRoomFilters {
    const current = filters.confirmability?.find((item) => item.selected);
    const isSame = current != null && Number(current.id) === id;

    if (id === 3) {
        return {
            ...filters,
            confirmability: filters.confirmability?.map((item) => ({
                ...item,
                selected: isSame ? false : Number(item.id) === 3,
            })),
        };
    }

    return {
        ...filters,
        confirmability: filters.confirmability?.map((item) => ({
            ...item,
            selected: isSame ? false : Number(item.id) === id,
        })),
    };
}

/** @deprecated Use selectConfirmabilityFilter for radio behaviour. */
export function toggleConfirmabilityFilter(filters: HotelRoomFilters, id: number): HotelRoomFilters {
    return selectConfirmabilityFilter(filters, id);
}

export function toggleOperatorFilter(filters: HotelRoomFilters, id: number): HotelRoomFilters {
    return {
        ...filters,
        operators: filters.operators?.map((operator) =>
            Number(operator.id) === id ? { ...operator, selected: !operator.selected } : operator,
        ),
    };
}

export function clearRoomFilters(filters: HotelRoomFilters): HotelRoomFilters {
    const clearGroup = (options: RoomFilterOption[] | undefined) =>
        options?.map((option) => ({ ...option, selected: false }));

    return {
        ...filters,
        meals: clearGroup(filters.meals),
        free_cancel: clearGroup(filters.free_cancel),
        confirmability: clearGroup(filters.confirmability),
        operators: clearGroup(filters.operators),
    };
}

export function buildMealsFilterFromRooms(
    rooms: unknown[] | null | undefined,
    previousMeals?: RoomFilterOption[] | null,
): RoomFilterOption[] {
    const selectedIds = new Set(
        (previousMeals ?? [])
            .filter((meal) => meal.selected)
            .map((meal) => String(meal.id).toUpperCase()),
    );

    const meals = new Map<string, RoomFilterOption>();

    (previousMeals ?? []).forEach((meal) => {
        const id = String(meal.id);
        meals.set(id.toUpperCase(), {
            ...meal,
            id: meal.id,
            selected: selectedIds.has(id.toUpperCase()),
        });
    });

    rooms?.forEach((room) => {
        const offers = (room as { offers?: Record<string, unknown[]> })?.offers ?? {};
        Object.keys(offers).forEach((mealType) => {
            const key = String(mealType).toUpperCase();
            if (!key || meals.has(key)) return;
            meals.set(key, {
                id: key,
                name: key,
                selected: selectedIds.has(key),
            });
        });
    });

    return Array.from(meals.values());
}

export function mergeRoomFiltersWithOperators(
    filters: HotelRoomFilters | null | undefined,
    rooms: unknown[] | null | undefined,
    previous?: HotelRoomFilters | null,
    operatorListRooms?: unknown[] | null | undefined,
): HotelRoomFilters | null {
    // Prefer API filters; if missing, keep previous or synthesize from rooms so URL meal picks can apply.
    const base: HotelRoomFilters | null = filters
        ? preserveFilterSelections(cloneRoomFilters(filters)!, previous)
        : previous
          ? cloneRoomFilters(previous)
          : rooms?.length
            ? { meals: [], operators: [], free_cancel: [], confirmability: [] }
            : null;

    if (!base) return null;

    const operatorSource = operatorListRooms ?? rooms;
    const previousOperators = previous?.operators ?? base.operators;
    const previousMeals = previous?.meals ?? base.meals;

    const mealsFromRooms = buildMealsFilterFromRooms(rooms, previousMeals);
    const meals =
        (base.meals?.length ? preserveOptionSelections(base.meals, previousMeals) : null) ??
        mealsFromRooms;

    // Ensure every meal code present in rooms exists as a filter option (for URL pick).
    const mealIds = new Set(meals.map((meal) => String(meal.id).toUpperCase()));
    mealsFromRooms.forEach((meal) => {
        const id = String(meal.id).toUpperCase();
        if (!mealIds.has(id)) {
            meals.push(meal);
            mealIds.add(id);
        }
    });

    // Keep previously selected meals even if filtered API omitted them.
    (previousMeals ?? []).forEach((meal) => {
        if (!meal.selected) return;
        const id = String(meal.id).toUpperCase();
        if (mealIds.has(id)) return;
        meals.push({ ...meal, selected: true, disabled: false });
        mealIds.add(id);
    });

    return {
        ...base,
        meals,
        operators: buildOperatorsFilterFromRooms(operatorSource, previousOperators),
    };
}

export type HotelRoomsQueryParams = {
    meals?: string;
    confirmability?: string;
    free_cancel?: boolean;
    operators?: string;
};

export function buildHotelRoomsQueryParams(
    filters: HotelRoomFilters | null | undefined,
): HotelRoomsQueryParams {
    if (!filters) return {};

    const meals = (filters.meals ?? [])
        .filter(isSelectedFilterOption)
        .map((meal) => String(meal.id));

    const confirmability = (filters.confirmability ?? [])
        .filter(isSelectedFilterOption)
        .map((item) => String(item.id))
        .filter((id) => id !== '3');

    // Room Type v3: оператор «Arlekino» (id ≥ 990000) существует только в наших предложениях —
    // в запрос /hotels-rooms его не передаём (LT его не знает), фильтруем на клиенте.
    const operators = (filters.operators ?? [])
        .filter(isSelectedFilterOption)
        .filter((operator) => !isArlekinoOperatorId(operator.id))
        .map((operator) => String(operator.id));

    const requireFreeCancel = (filters.free_cancel ?? []).some(
        (item) => isSelectedFilterOption(item) && item.id === true,
    );

    const params: HotelRoomsQueryParams = {};

    if (meals.length) params.meals = meals.join(',');
    if (confirmability.length) params.confirmability = confirmability.join(',');
    if (operators.length) params.operators = operators.join(',');
    if (requireFreeCancel) params.free_cancel = true;

    return params;
}

export function hasHotelRoomsQueryParams(params: HotelRoomsQueryParams): boolean {
    return Object.keys(params).length > 0;
}

type DateNightsMatcher = (
    offer: { start_date?: string; nights_count?: number | string | null },
    searchNights: number | null,
) => boolean;

export function filterRoomsBySelectedDate(
    rooms: unknown[] | null | undefined,
    selectedDate: string | null | undefined,
    searchNights: number | null,
    matchesSearchNights: DateNightsMatcher,
): unknown[] {
    if (!rooms?.length) return [];
    if (!selectedDate) return rooms;

    return rooms
        .map((room) => {
            const roomRecord = room as { offers?: Record<string, unknown[]> };
            const filteredOffers: Record<string, unknown[]> = {};

            Object.entries(roomRecord.offers ?? {}).forEach(([mealType, offerList]) => {
                const offers = (offerList ?? []).filter((offer) => {
                    const record = offer as { start_date?: string; nights_count?: number | string | null };
                    return (
                        record.start_date === selectedDate &&
                        matchesSearchNights(record, searchNights)
                    );
                });

                if (offers.length > 0) {
                    filteredOffers[mealType] = offers;
                }
            });

            if (Object.keys(filteredOffers).length === 0) return null;
            return { ...roomRecord, offers: filteredOffers };
        })
        .filter(Boolean);
}

/** Apply user-selected filters to the canonical room list from the initial API load. */
export function applyRoomFilters(
    baseRooms: unknown[] | null | undefined,
    filters: HotelRoomFilters | null,
): unknown[] {
    if (!baseRooms?.length) return [];
    if (!filters || !hasActiveRoomFilters(filters)) return baseRooms;
    return filterRoomsByFilters(baseRooms, filters);
}

export function resolveDisplayRooms(
    baseRooms: unknown[] | null | undefined,
    filters: HotelRoomFilters | null,
    selectedDate?: string | null,
    searchNights?: number | null,
    matchesSearchNights?: DateNightsMatcher,
): unknown[] {
    const filteredByOptions = applyRoomFilters(baseRooms, filters);

    if (!selectedDate || !matchesSearchNights) {
        return filteredByOptions;
    }

    return filterRoomsBySelectedDate(
        filteredByOptions,
        selectedDate,
        searchNights ?? null,
        matchesSearchNights,
    );
}

export function hasActiveRoomFilters(filters: HotelRoomFilters | null): boolean {
    if (!filters) return false;

    const hasMeals = (filters.meals ?? []).some((meal) => meal.selected);
    const hasFreeCancel = (filters.free_cancel ?? []).some((item) => item.selected && item.id === true);
    const hasConfirmability = isConfirmabilityFilterActive(filters);
    const hasOperators = (filters.operators ?? []).some((operator) => operator.selected);

    return hasMeals || hasFreeCancel || hasConfirmability || hasOperators;
}
