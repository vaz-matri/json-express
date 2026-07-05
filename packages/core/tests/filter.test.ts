import { describe, it, expect } from 'vitest';
import { sanitizeFilter } from '../src/filter';

describe('sanitizeFilter', () => {
    it('keeps flat scalar equality filters', () => {
        expect(sanitizeFilter({ status: 'active', age: 30, verified: true }))
            .toEqual({ status: 'active', age: 30, verified: true });
    });

    it('keeps arrays of scalars (for future IN-style matching)', () => {
        expect(sanitizeFilter({ id: ['a', 'b'] })).toEqual({ id: ['a', 'b'] });
    });

    it('drops operator keys beginning with $', () => {
        expect(sanitizeFilter({ $where: 'sleep(1000)' })).toEqual({});
    });

    it('drops dotted traversal keys', () => {
        expect(sanitizeFilter({ 'profile.role': 'admin' })).toEqual({});
    });

    it('collapses a nested operator object to nothing (NoSQL injection vector)', () => {
        // ?email[$ne]=x arrives as { email: { $ne: 'x' } } — must not survive.
        expect(sanitizeFilter({ email: { $ne: 'x' } })).toEqual({});
    });

    it('drops arrays that contain non-scalars', () => {
        expect(sanitizeFilter({ tags: [{ $ne: 1 }] })).toEqual({});
    });

    it('preserves safe fields while stripping unsafe siblings', () => {
        expect(sanitizeFilter({ status: 'active', email: { $ne: 'x' }, $where: '1' }))
            .toEqual({ status: 'active' });
    });

    it('returns an empty object for null/undefined/non-object input', () => {
        expect(sanitizeFilter(null)).toEqual({});
        expect(sanitizeFilter(undefined)).toEqual({});
    });
});
