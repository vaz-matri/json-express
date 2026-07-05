/**
 * Query-filter sanitization — the security choke point for client-supplied filters.
 *
 * Every filter derived from untrusted input (query strings, GraphQL args) MUST pass
 * through `sanitizeFilter` before it reaches `IDatabaseAdapter.search()`. This is what
 * keeps NoSQL operator injection (`?email[$ne]=x`, `$where`, `$function`) and dotted-key
 * traversal from ever reaching a driver's query language — the adapter receives a flat
 * map of field → scalar (or scalar[]) and nothing else, so a new adapter cannot
 * reintroduce the vulnerability. It sits ABOVE the pluggable adapter layer on purpose.
 *
 * Structured querying (ranges, IN, etc.) is a separate, additive concern: a future
 * framework-owned operator vocabulary (`price_gte`, `status_in`) translated per adapter —
 * never the driver's raw operators. Raw driver operators stay permanently unreachable.
 */

export type FilterScalar = string | number | boolean | null;
export type SafeFilter = Record<string, FilterScalar | FilterScalar[]>;

function isSafeScalar(value: unknown): value is FilterScalar {
    return (
        value === null ||
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
    );
}

/**
 * Strip a raw filter down to safe equality clauses.
 * - Keys beginning with `$` or containing `.` are dropped (operator / traversal syntax).
 * - Values that are not scalars — or arrays of scalars — are dropped (a nested object is
 *   how `{ $ne: ... }` / `{ $where: ... }` arrive, so operator maps disappear entirely).
 * The result is always a plain object safe to hand to any adapter.
 */
export function sanitizeFilter(raw: Record<string, unknown> | null | undefined): SafeFilter {
    const safe: SafeFilter = {};
    if (!raw || typeof raw !== 'object') return safe;

    for (const [key, value] of Object.entries(raw)) {
        if (key.startsWith('$') || key.includes('.')) continue;

        if (isSafeScalar(value)) {
            safe[key] = value;
        } else if (Array.isArray(value) && value.every(isSafeScalar)) {
            safe[key] = value as FilterScalar[];
        }
        // Anything else (nested object, array of objects, function) is intentionally dropped.
    }

    return safe;
}
