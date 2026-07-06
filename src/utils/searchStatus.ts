export type SearchOperatorStatus =
    | 'completed'
    | 'cached'
    | 'no_results'
    | 'skipped'
    | 'failed'
    | 'all_filtered'
    | 'performing'
    | string;

const SETTLED_SEARCH_STATUSES = new Set<string>([
    'completed',
    'cached',
    'no_results',
    'skipped',
    'failed',
    'all_filtered',
    'performing',
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

export function isAllOperatorsSettled(
    statusMap: Record<string, SearchOperatorStatus>,
): boolean {
    const entries = Object.entries(statusMap);
    if (entries.length === 0) return false;
    return entries.every(([, status]) =>
        SETTLED_SEARCH_STATUSES.has(normalizeStatus(status)),
    );
}

/** Stop when API completeness is 100%, any operator is ready, or every operator is settled. */
export function shouldStopSearchPolling(
    statusMap: Record<string, SearchOperatorStatus>,
    completeness?: number,
): boolean {
    if (Number(completeness) >= 100) return true;
    if (getReadySearchOperators(statusMap).length > 0) return true;
    if (isAllOperatorsSettled(statusMap)) return true;
    return false;
}
