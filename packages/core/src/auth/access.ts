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
