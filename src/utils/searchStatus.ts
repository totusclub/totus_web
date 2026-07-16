export type SearchOperatorStatus =
    | 'completed'
    | 'cached'
    | 'no_results'
    | 'skipped'
    | 'failed'
    | 'all_filtered'
    | 'performing'
    | 'pending'
    | string;

/** Terminal statuses — search will not progress further for that operator. */
const TERMINAL_SEARCH_STATUSES = new Set<string>([
    'completed',
    'cached',
    'no_results',
    'skipped',
    'failed',
    'all_filtered',
]);

function normalizeStatus(status: SearchOperatorStatus): string {
    return String(status).trim().toLowerCase();
}

export function getReadySearchOperators(
    statusMap: Record<string, SearchOperatorStatus>,
): string[] {
    return Object.entries(statusMap)
        .filter(([, status]) => {
            const s = normalizeStatus(status);
            return s === 'completed' || s === 'cached';
        })
        .map(([id]) => id);
}

export function isAllOperatorsTerminal(
    statusMap: Record<string, SearchOperatorStatus>,
): boolean {
    const entries = Object.entries(statusMap);
    if (entries.length === 0) return false;
    return entries.every(([, status]) =>
        TERMINAL_SEARCH_STATUSES.has(normalizeStatus(status)),
    );
}

/**
 * Stop polling when:
 * - API completeness is 100%,
 * - at least one operator is ready (completed/cached), or
 * - every operator reached a terminal status (not performing/pending).
 *
 * Matches mobile app: `performing` alone does NOT stop polling.
 * Used by search listing (progressive results).
 */
export function shouldStopSearchPolling(
    statusMap: Record<string, SearchOperatorStatus>,
    completeness?: number,
): boolean {
    if (Number(completeness) >= 100) return true;
    if (getReadySearchOperators(statusMap).length > 0) return true;
    if (isAllOperatorsTerminal(statusMap)) return true;
    return false;
}

/**
 * True only when the search will not receive more operator results.
 * Use for hotel-details rooms so pending operators are not skipped.
 */
export function isSearchFullyComplete(
    statusMap: Record<string, SearchOperatorStatus>,
    completeness?: number,
): boolean {
    if (Number(completeness) >= 100) return true;
    return isAllOperatorsTerminal(statusMap);
}

/** @deprecated Use isAllOperatorsTerminal — performing is not settled. */
export function isAllOperatorsSettled(
    statusMap: Record<string, SearchOperatorStatus>,
): boolean {
    return isAllOperatorsTerminal(statusMap);
}
