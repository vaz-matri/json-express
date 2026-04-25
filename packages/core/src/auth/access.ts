import type { AccessRule, AuthRules } from '../schema/model';

export type AccessOp = 'create' | 'read' | 'update' | 'delete';

export type AccessVerdict =
    | { allowed: true; user: Record<string, any> | null }
    | { allowed: false; code: 'UNAUTHENTICATED' | 'FORBIDDEN'; reason: string };

function decodePayload(header: string | string[] | undefined): Record<string, any> | null {
    if (header == null) return null;
    const raw = Array.isArray(header) ? header[0] : header;
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
        return null;
    }
}

function rolesOf(payload: Record<string, any>): string[] {
    const r = payload.role;
    if (Array.isArray(r)) return r.filter((v) => typeof v === 'string');
    if (typeof r === 'string') return [r];
    return [];
}

export function evaluateAccess(
    rule: AccessRule | undefined,
    userPayloadHeader: string | string[] | undefined
): AccessVerdict {
    // Backwards compat: no rule declared → allow (auth middleware decides authentication separately).
    if (rule === undefined) {
        return { allowed: true, user: decodePayload(userPayloadHeader) };
    }

    if (rule === 'public') {
        return { allowed: true, user: decodePayload(userPayloadHeader) };
    }

    if (rule === 'owner') {
        // Authentication is required to resolve ownership; the per-record check
        // is performed by the caller via ownsRecord() after fetching the row.
        const user = decodePayload(userPayloadHeader);
        if (!user) {
            return { allowed: false, code: 'UNAUTHENTICATED', reason: 'Authentication required' };
        }
        return { allowed: true, user };
    }

    const user = decodePayload(userPayloadHeader);
    if (!user) {
        return { allowed: false, code: 'UNAUTHENTICATED', reason: 'Authentication required' };
    }

    const allowedRoles = Array.isArray(rule) ? rule : [rule];
    const userRoles = rolesOf(user);
    const matched = userRoles.some((r) => allowedRoles.includes(r));

    if (!matched) {
        return {
            allowed: false,
            code: 'FORBIDDEN',
            reason: `Role required: ${allowedRoles.join(' | ')}`,
        };
    }

    return { allowed: true, user };
}

export function needsOwnerCheck(rule: AccessRule | undefined): boolean {
    return rule === 'owner';
}

export function resolveOwnerField(access: AuthRules | undefined): string {
    return access?.ownerField ?? 'ownerId';
}

/**
 * Resolves a user identifier from a JWT-shaped payload, with a pragmatic fallback
 * across common claim names: `sub` (RFC 7519 standard) → `id` → `userId`.
 */
export function resolveUserId(user: Record<string, any> | null | undefined): string | null {
    if (!user) return null;
    const id = user.sub ?? user.id ?? user.userId;
    return id != null ? String(id) : null;
}

export function ownsRecord(
    record: any,
    ownerField: string,
    user: Record<string, any> | null | undefined
): boolean {
    if (!record || !user) return false;
    const userId = resolveUserId(user);
    if (userId == null) return false;
    return String(record[ownerField]) === userId;
}

/**
 * Returns the field-level rule for a given (fieldName, op), or `undefined` if
 * no field-level override is declared. The caller treats `undefined` as
 * "field is governed by the op-level rule" (i.e. unrestricted at the field level).
 */
export function getFieldRule(
    access: AuthRules | undefined,
    fieldName: string,
    op: 'read' | 'create' | 'update'
): AccessRule | undefined {
    return access?.fields?.[fieldName]?.[op];
}

function isFieldAllowed(
    rule: AccessRule | undefined,
    record: any,
    access: AuthRules | undefined,
    user: Record<string, any> | null
): boolean {
    if (rule === undefined) return true;
    if (rule === 'public') return true;
    if (rule === 'owner') {
        // Field-level owner rule defers to the parent record's ownership.
        return ownsRecord(record, resolveOwnerField(access), user);
    }
    if (!user) return false;
    const allowedRoles = Array.isArray(rule) ? rule : [rule];
    const userRoles = Array.isArray(user.role)
        ? user.role.filter((v: any) => typeof v === 'string')
        : typeof user.role === 'string'
        ? [user.role]
        : [];
    return userRoles.some((r: string) => allowedRoles.includes(r));
}

/**
 * Returns a shallow copy of `record` with read-denied keys omitted. Pass-through
 * when `access.fields` is absent.
 */
export function stripDeniedReadFields<T extends Record<string, any>>(
    record: T,
    access: AuthRules | undefined,
    user: Record<string, any> | null
): Partial<T> {
    if (!record || !access?.fields) return record;
    const out: Record<string, any> = {};
    for (const key of Object.keys(record)) {
        const rule = access.fields[key]?.read;
        if (isFieldAllowed(rule, record, access, user)) out[key] = record[key];
    }
    return out as Partial<T>;
}

/**
 * Returns a shallow copy of `body` with create/update-denied keys silently dropped.
 * No-op when `access.fields` is absent.
 *
 * Note: write-side rules are evaluated without a record context (records don't
 * exist yet on create, and on update the strip happens before mutation). Owner-
 * scoped *write* field rules therefore degrade to "deny non-owner" only after
 * the caller has passed the op-level owner check — which it must, since this
 * helper runs after the op-level access verdict.
 */
export function stripDeniedWriteFields<T extends Record<string, any>>(
    body: T,
    access: AuthRules | undefined,
    user: Record<string, any> | null,
    op: 'create' | 'update'
): Partial<T> {
    if (!body || typeof body !== 'object' || !access?.fields) return body;
    const out: Record<string, any> = {};
    for (const key of Object.keys(body)) {
        const rule = access.fields[key]?.[op];
        // For write ops we don't have a record to check ownership against;
        // pass `null` so 'owner' field rules collapse to "allow if caller has reached this point".
        // The op-level rule already enforced who can write at all.
        if (rule === 'owner') {
            out[key] = (body as any)[key];
            continue;
        }
        if (isFieldAllowed(rule, null, access, user)) out[key] = (body as any)[key];
    }
    return out as Partial<T>;
}
