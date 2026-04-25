import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import { verifyJwt } from '../src/auth/jwt';

const SECRET = 'phase-b-test-secret';

describe('verifyJwt', () => {
    it('returns stringified payload on a valid Bearer token', () => {
        const token = jwt.sign({ sub: 'u-1', role: 'admin' }, SECRET);
        const result = verifyJwt(`Bearer ${token}`, SECRET);
        expect(result).not.toBeNull();
        const decoded = JSON.parse(result!);
        expect(decoded.sub).toBe('u-1');
        expect(decoded.role).toBe('admin');
    });

    it('returns null when header is missing', () => {
        expect(verifyJwt(undefined, SECRET)).toBeNull();
    });

    it('returns null when header is not a string', () => {
        expect(verifyJwt(['Bearer x'] as any, SECRET)).toBeNull();
    });

    it('returns null when scheme is not Bearer', () => {
        const token = jwt.sign({ sub: 'u-1' }, SECRET);
        expect(verifyJwt(`Basic ${token}`, SECRET)).toBeNull();
        expect(verifyJwt(token, SECRET)).toBeNull();
    });

    it('returns null when token portion is empty', () => {
        expect(verifyJwt('Bearer ', SECRET)).toBeNull();
    });

    it('returns null on garbage token', () => {
        expect(verifyJwt('Bearer not-a-jwt', SECRET)).toBeNull();
    });

    it('returns null when signed with a different secret', () => {
        const token = jwt.sign({ sub: 'u-1' }, 'other-secret');
        expect(verifyJwt(`Bearer ${token}`, SECRET)).toBeNull();
    });

    it('returns null on expired token', () => {
        const token = jwt.sign({ sub: 'u-1' }, SECRET, { expiresIn: '-1s' });
        expect(verifyJwt(`Bearer ${token}`, SECRET)).toBeNull();
    });
});
