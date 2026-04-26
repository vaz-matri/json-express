import { describe, it, expect } from 'vitest';
import {
    hashPassword,
    verifyPassword,
    generateRefreshToken,
    hashRefreshToken,
} from '../src/crypto';

describe('crypto — password hashing (argon2)', () => {
    it('round-trips a password', async () => {
        const hash = await hashPassword('correct horse battery staple');
        expect(hash).toMatch(/^\$argon2/);
        expect(await verifyPassword(hash, 'correct horse battery staple')).toBe(true);
    });

    it('rejects a wrong password', async () => {
        const hash = await hashPassword('hunter2');
        expect(await verifyPassword(hash, 'hunter3')).toBe(false);
    });

    it('verifyPassword returns false on a malformed hash (does not throw)', async () => {
        expect(await verifyPassword('not-a-real-hash', 'whatever')).toBe(false);
    });

    it('produces different hashes for the same plaintext (salt)', async () => {
        const a = await hashPassword('same');
        const b = await hashPassword('same');
        expect(a).not.toBe(b);
        expect(await verifyPassword(a, 'same')).toBe(true);
        expect(await verifyPassword(b, 'same')).toBe(true);
    });
});

describe('crypto — refresh tokens', () => {
    it('generateRefreshToken yields high-entropy URL-safe strings', () => {
        const t1 = generateRefreshToken();
        const t2 = generateRefreshToken();
        expect(t1).not.toBe(t2);
        expect(t1).toMatch(/^[A-Za-z0-9_-]+$/);
        expect(t1.length).toBeGreaterThanOrEqual(40);
    });

    it('hashRefreshToken is deterministic', () => {
        const t = generateRefreshToken();
        expect(hashRefreshToken(t)).toBe(hashRefreshToken(t));
    });

    it('hashRefreshToken differs for different tokens', () => {
        expect(hashRefreshToken('a')).not.toBe(hashRefreshToken('b'));
    });
});
