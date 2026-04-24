import type { AccessRule } from '../schema/model';

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
        throw new Error("'owner' access rule requires Phase B row-level security — not implemented");
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
