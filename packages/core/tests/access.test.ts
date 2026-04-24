import { describe, it, expect } from 'vitest';
import { evaluateAccess } from '../src/auth/access';

const adminPayload = JSON.stringify({ sub: 'u-1', role: 'admin' });
const userPayload = JSON.stringify({ sub: 'u-2', role: 'user' });
const multiRolePayload = JSON.stringify({ sub: 'u-3', role: ['user', 'editor'] });
const noRolePayload = JSON.stringify({ sub: 'u-4' });

describe('evaluateAccess', () => {
    it('allows when rule is undefined (backwards compat)', () => {
        const v = evaluateAccess(undefined, undefined);
        expect(v.allowed).toBe(true);
        if (v.allowed) expect(v.user).toBeNull();
    });

    it('allows when rule is undefined and decodes payload if present', () => {
        const v = evaluateAccess(undefined, adminPayload);
        expect(v.allowed).toBe(true);
        if (v.allowed) expect(v.user).toEqual({ sub: 'u-1', role: 'admin' });
    });

    it('allows public regardless of payload', () => {
        expect(evaluateAccess('public', undefined).allowed).toBe(true);
        expect(evaluateAccess('public', userPayload).allowed).toBe(true);
    });

    it('returns UNAUTHENTICATED when role rule is set but no payload', () => {
        const v = evaluateAccess('admin', undefined);
        expect(v.allowed).toBe(false);
        if (!v.allowed) expect(v.code).toBe('UNAUTHENTICATED');
    });

    it('returns UNAUTHENTICATED on malformed JSON payload', () => {
        const v = evaluateAccess('admin', 'not-json{');
        expect(v.allowed).toBe(false);
        if (!v.allowed) expect(v.code).toBe('UNAUTHENTICATED');
    });

    it('returns UNAUTHENTICATED when payload is empty string', () => {
        const v = evaluateAccess('admin', '');
        expect(v.allowed).toBe(false);
        if (!v.allowed) expect(v.code).toBe('UNAUTHENTICATED');
    });

    it('allows when string role rule matches user.role', () => {
        const v = evaluateAccess('admin', adminPayload);
        expect(v.allowed).toBe(true);
    });

    it('allows when array role rule contains user.role', () => {
        const v = evaluateAccess(['admin', 'editor'], userPayload);
        expect(v.allowed).toBe(false); // user has 'user', not in list
        const v2 = evaluateAccess(['admin', 'user'], userPayload);
        expect(v2.allowed).toBe(true);
    });

    it('allows when payload.role is array and intersects rule', () => {
        const v = evaluateAccess('editor', multiRolePayload);
        expect(v.allowed).toBe(true);
        const v2 = evaluateAccess(['admin', 'user'], multiRolePayload);
        expect(v2.allowed).toBe(true);
    });

    it('returns FORBIDDEN when payload role does not match', () => {
        const v = evaluateAccess('admin', userPayload);
        expect(v.allowed).toBe(false);
        if (!v.allowed) expect(v.code).toBe('FORBIDDEN');
    });

    it('returns FORBIDDEN when payload has no role field', () => {
        const v = evaluateAccess('admin', noRolePayload);
        expect(v.allowed).toBe(false);
        if (!v.allowed) expect(v.code).toBe('FORBIDDEN');
    });

    it('throws on owner rule (Phase B feature)', () => {
        expect(() => evaluateAccess('owner', adminPayload)).toThrow(/owner/i);
    });

    it('handles header value that is an array (Express multi-value headers)', () => {
        const v = evaluateAccess('admin', [adminPayload]);
        expect(v.allowed).toBe(true);
    });
});
