import { describe, it, expect } from 'vitest';
import { signAccessToken } from '../src/jwt-issuer';
import { createJwtVerifier } from '@json-express/core';

const SECRET = 'plugin-identity-test-secret';

describe('jwt-issuer — signAccessToken', () => {
    it('issues a token that the core verifier accepts', async () => {
        const token = signAccessToken(
            { sub: 'u-1', role: 'admin', email: 'a@b.c' },
            { secret: SECRET, ttl: '1h' }
        );
        const verify = createJwtVerifier({ secret: SECRET });
        const result = await verify(`Bearer ${token}`);
        expect(result).not.toBeNull();
        const payload = JSON.parse(result!);
        expect(payload.sub).toBe('u-1');
        expect(payload.role).toBe('admin');
        expect(payload.email).toBe('a@b.c');
        expect(typeof payload.exp).toBe('number');
    });

    it('respects issuer/audience when configured', async () => {
        const token = signAccessToken(
            { sub: 'u-1', role: 'admin', email: 'a@b.c' },
            { secret: SECRET, ttl: '1h', issuer: 'https://my.iss/', audience: 'my-api' }
        );
        const ok = createJwtVerifier({ secret: SECRET, issuer: 'https://my.iss/', audience: 'my-api' });
        expect(await ok(`Bearer ${token}`)).not.toBeNull();

        const wrongAud = createJwtVerifier({ secret: SECRET, audience: 'other-api' });
        expect(await wrongAud(`Bearer ${token}`)).toBeNull();
    });

    it('an issued token expires per ttl', async () => {
        const token = signAccessToken(
            { sub: 'u-1', role: 'user', email: 'a@b.c' },
            { secret: SECRET, ttl: '-1s' }
        );
        const verify = createJwtVerifier({ secret: SECRET });
        expect(await verify(`Bearer ${token}`)).toBeNull();
    });
});
