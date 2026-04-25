import { describe, it, expect } from 'vitest';
import {
    evaluateAccess,
    needsOwnerCheck,
    resolveOwnerField,
    resolveUserId,
    ownsRecord,
    getFieldRule,
    stripDeniedReadFields,
    stripDeniedWriteFields,
} from '../src/auth/access';
import type { AuthRules } from '../src/schema/model';

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

    it('owner rule with valid payload allows (caller does post-record check)', () => {
        const v = evaluateAccess('owner', adminPayload);
        expect(v.allowed).toBe(true);
        if (v.allowed) expect(v.user).toEqual({ sub: 'u-1', role: 'admin' });
    });

    it('owner rule with no payload returns UNAUTHENTICATED', () => {
        const v = evaluateAccess('owner', undefined);
        expect(v.allowed).toBe(false);
        if (!v.allowed) expect(v.code).toBe('UNAUTHENTICATED');
    });

    it('owner rule with malformed payload returns UNAUTHENTICATED', () => {
        const v = evaluateAccess('owner', 'not-json{');
        expect(v.allowed).toBe(false);
        if (!v.allowed) expect(v.code).toBe('UNAUTHENTICATED');
    });

    it('handles header value that is an array (Express multi-value headers)', () => {
        const v = evaluateAccess('admin', [adminPayload]);
        expect(v.allowed).toBe(true);
    });
});

describe('needsOwnerCheck', () => {
    it('returns true only for the literal owner rule', () => {
        expect(needsOwnerCheck('owner')).toBe(true);
        expect(needsOwnerCheck('public')).toBe(false);
        expect(needsOwnerCheck('admin')).toBe(false);
        expect(needsOwnerCheck(['admin', 'editor'])).toBe(false);
        expect(needsOwnerCheck(undefined)).toBe(false);
    });
});

describe('resolveOwnerField', () => {
    it('defaults to ownerId', () => {
        expect(resolveOwnerField(undefined)).toBe('ownerId');
        expect(resolveOwnerField({})).toBe('ownerId');
        expect(resolveOwnerField({ read: 'owner' })).toBe('ownerId');
    });

    it('honors explicit ownerField override', () => {
        expect(resolveOwnerField({ ownerField: 'authorId' })).toBe('authorId');
    });
});

describe('resolveUserId', () => {
    it('uses sub by default', () => {
        expect(resolveUserId({ sub: 'u-1' })).toBe('u-1');
    });

    it('falls back to id when sub is missing', () => {
        expect(resolveUserId({ id: 'u-2' })).toBe('u-2');
    });

    it('falls back to userId as last resort', () => {
        expect(resolveUserId({ userId: 'u-3' })).toBe('u-3');
    });

    it('prefers sub over id over userId', () => {
        expect(resolveUserId({ sub: 'a', id: 'b', userId: 'c' })).toBe('a');
        expect(resolveUserId({ id: 'b', userId: 'c' })).toBe('b');
    });

    it('coerces non-string ids to string', () => {
        expect(resolveUserId({ sub: 42 })).toBe('42');
    });

    it('returns null on missing payload or no claim', () => {
        expect(resolveUserId(null)).toBeNull();
        expect(resolveUserId({})).toBeNull();
        expect(resolveUserId({ role: 'admin' })).toBeNull();
    });
});

describe('ownsRecord', () => {
    it('returns true when record[ownerField] equals user.sub', () => {
        expect(ownsRecord({ ownerId: 'u-1' }, 'ownerId', { sub: 'u-1' })).toBe(true);
    });

    it('coerces both sides to string for comparison', () => {
        expect(ownsRecord({ ownerId: 1 }, 'ownerId', { sub: '1' })).toBe(true);
        expect(ownsRecord({ ownerId: '1' }, 'ownerId', { sub: 1 })).toBe(true);
    });

    it('returns false when ids do not match', () => {
        expect(ownsRecord({ ownerId: 'u-1' }, 'ownerId', { sub: 'u-2' })).toBe(false);
    });

    it('returns false when record has no ownerField', () => {
        expect(ownsRecord({}, 'ownerId', { sub: 'u-1' })).toBe(false);
    });

    it('returns false when user has no resolvable id', () => {
        expect(ownsRecord({ ownerId: 'u-1' }, 'ownerId', {})).toBe(false);
    });

    it('returns false on null inputs', () => {
        expect(ownsRecord(null, 'ownerId', { sub: 'u-1' })).toBe(false);
        expect(ownsRecord({ ownerId: 'u-1' }, 'ownerId', null)).toBe(false);
    });

    it('honors a custom ownerField', () => {
        expect(ownsRecord({ authorId: 'u-1' }, 'authorId', { sub: 'u-1' })).toBe(true);
        expect(ownsRecord({ authorId: 'u-1' }, 'ownerId', { sub: 'u-1' })).toBe(false);
    });
});

describe('getFieldRule', () => {
    const access: AuthRules = {
        read: 'public',
        update: 'admin',
        fields: {
            email: { read: 'admin', update: 'admin' },
            secret: { read: 'owner' },
        },
    };

    it('returns the declared rule for a (field, op) pair', () => {
        expect(getFieldRule(access, 'email', 'read')).toBe('admin');
        expect(getFieldRule(access, 'email', 'update')).toBe('admin');
        expect(getFieldRule(access, 'secret', 'read')).toBe('owner');
    });

    it('returns undefined when the field has no rule for that op', () => {
        expect(getFieldRule(access, 'email', 'create')).toBeUndefined();
        expect(getFieldRule(access, 'secret', 'update')).toBeUndefined();
    });

    it('returns undefined for fields without any rule', () => {
        expect(getFieldRule(access, 'name', 'read')).toBeUndefined();
    });

    it('returns undefined when access has no fields block', () => {
        expect(getFieldRule({ read: 'public' }, 'email', 'read')).toBeUndefined();
        expect(getFieldRule(undefined, 'email', 'read')).toBeUndefined();
    });
});

describe('stripDeniedReadFields', () => {
    const access: AuthRules = {
        fields: {
            email: { read: 'admin' },
            secret: { read: 'owner' },
        },
    };

    it('omits role-restricted field for non-matching role', () => {
        const result = stripDeniedReadFields(
            { id: 'r-1', name: 'Alice', email: 'a@b.co' },
            access,
            { sub: 'u-1', role: 'user' }
        );
        expect(result).toEqual({ id: 'r-1', name: 'Alice' });
    });

    it('keeps role-restricted field for matching role', () => {
        const result = stripDeniedReadFields(
            { id: 'r-1', name: 'Alice', email: 'a@b.co' },
            access,
            { sub: 'u-1', role: 'admin' }
        );
        expect(result).toEqual({ id: 'r-1', name: 'Alice', email: 'a@b.co' });
    });

    it('owner-scoped field is visible only to record owner', () => {
        const record = { id: 'r-1', ownerId: 'u-1', secret: 'shh' };
        expect(stripDeniedReadFields(record, access, { sub: 'u-1' })).toEqual(record);
        expect(stripDeniedReadFields(record, access, { sub: 'u-2' })).toEqual({
            id: 'r-1',
            ownerId: 'u-1',
        });
    });

    it('owner-scoped field with no payload is omitted', () => {
        const record = { id: 'r-1', ownerId: 'u-1', secret: 'shh' };
        expect(stripDeniedReadFields(record, access, null)).toEqual({
            id: 'r-1',
            ownerId: 'u-1',
        });
    });

    it('only filters declared fields — undeclared fields pass through', () => {
        const result = stripDeniedReadFields(
            { id: 'r-1', name: 'A', randomField: 'x', email: 'a@b' },
            access,
            { sub: 'u', role: 'user' }
        );
        expect(result).toEqual({ id: 'r-1', name: 'A', randomField: 'x' });
    });

    it('passes through unchanged when access has no fields block', () => {
        const record = { id: 'r-1', email: 'a@b' };
        expect(stripDeniedReadFields(record, { read: 'public' }, null)).toEqual(record);
        expect(stripDeniedReadFields(record, undefined, null)).toEqual(record);
    });

    it('respects a custom ownerField', () => {
        const customAccess: AuthRules = {
            ownerField: 'authorId',
            fields: { secret: { read: 'owner' } },
        };
        const record = { id: 'r-1', authorId: 'u-1', secret: 'shh' };
        expect(stripDeniedReadFields(record, customAccess, { sub: 'u-1' })).toEqual(record);
        expect(stripDeniedReadFields(record, customAccess, { sub: 'u-2' })).toEqual({
            id: 'r-1',
            authorId: 'u-1',
        });
    });
});

describe('stripDeniedWriteFields', () => {
    const access: AuthRules = {
        fields: {
            adminNotes: { update: 'admin', create: 'admin' },
            email: { update: 'admin' },
            ownedField: { update: 'owner' },
        },
    };

    it('strips update-denied fields for non-matching role', () => {
        const result = stripDeniedWriteFields(
            { title: 'T', email: 'new@x', adminNotes: 'private' },
            access,
            { sub: 'u-1', role: 'user' },
            'update'
        );
        expect(result).toEqual({ title: 'T' });
    });

    it('keeps update-denied fields for matching role', () => {
        const result = stripDeniedWriteFields(
            { title: 'T', email: 'new@x', adminNotes: 'private' },
            access,
            { sub: 'u-1', role: 'admin' },
            'update'
        );
        expect(result).toEqual({ title: 'T', email: 'new@x', adminNotes: 'private' });
    });

    it('strips create-denied fields for non-matching role', () => {
        const result = stripDeniedWriteFields(
            { title: 'T', adminNotes: 'private' },
            access,
            { sub: 'u-1', role: 'user' },
            'create'
        );
        expect(result).toEqual({ title: 'T' });
    });

    it('only consults the requested op (update rule does not block create)', () => {
        // email has only `update: 'admin'` — create should pass through
        const result = stripDeniedWriteFields(
            { title: 'T', email: 'new@x' },
            access,
            { sub: 'u-1', role: 'user' },
            'create'
        );
        expect(result).toEqual({ title: 'T', email: 'new@x' });
    });

    it("'owner' write field rule passes through (op-level rule already enforced ownership)", () => {
        // Caller has reached this point so they're presumed to own the record (or be allowed)
        const result = stripDeniedWriteFields(
            { title: 'T', ownedField: 'value' },
            access,
            { sub: 'u-1' },
            'update'
        );
        expect(result).toEqual({ title: 'T', ownedField: 'value' });
    });

    it('passes through unchanged when access has no fields block', () => {
        const body = { title: 'T', email: 'a@b' };
        expect(stripDeniedWriteFields(body, { read: 'public' }, null, 'update')).toEqual(body);
    });
});
