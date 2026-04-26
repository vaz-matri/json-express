import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import jwt from 'jsonwebtoken';
import { createServer, type Server } from 'http';
import { generateKeyPairSync, randomUUID, type KeyObject } from 'crypto';
import type { AddressInfo } from 'net';
import { createJwtVerifier } from '../src/auth/jwt';

const HMAC_SECRET = 'phase-c-bis-hmac-secret';

describe('createJwtVerifier — config validation', () => {
    it('throws when both secret and jwksUri are set', () => {
        expect(() =>
            createJwtVerifier({ secret: 'x', jwksUri: 'https://example.test/jwks' })
        ).toThrow(/both/i);
    });

    it('throws when neither secret nor jwksUri is set', () => {
        expect(() => createJwtVerifier({})).toThrow(/neither/i);
    });

    it('throws on empty-string secret (treated as unset)', () => {
        expect(() => createJwtVerifier({ secret: '' })).toThrow(/neither/i);
    });
});

describe('createJwtVerifier — symmetric (HS256)', () => {
    it('verifies a valid Bearer token', async () => {
        const verify = createJwtVerifier({ secret: HMAC_SECRET });
        const token = jwt.sign({ sub: 'u-1', role: 'admin' }, HMAC_SECRET);
        const result = await verify(`Bearer ${token}`);
        expect(result).not.toBeNull();
        const decoded = JSON.parse(result!);
        expect(decoded.sub).toBe('u-1');
        expect(decoded.role).toBe('admin');
    });

    it('returns null when header is missing', async () => {
        const verify = createJwtVerifier({ secret: HMAC_SECRET });
        expect(await verify(undefined)).toBeNull();
    });

    it('returns null when scheme is not Bearer', async () => {
        const verify = createJwtVerifier({ secret: HMAC_SECRET });
        const token = jwt.sign({ sub: 'u-1' }, HMAC_SECRET);
        expect(await verify(`Basic ${token}`)).toBeNull();
    });

    it('returns null on garbage token', async () => {
        const verify = createJwtVerifier({ secret: HMAC_SECRET });
        expect(await verify('Bearer not-a-jwt')).toBeNull();
    });

    it('returns null when signed with a different secret', async () => {
        const verify = createJwtVerifier({ secret: HMAC_SECRET });
        const token = jwt.sign({ sub: 'u-1' }, 'wrong-secret');
        expect(await verify(`Bearer ${token}`)).toBeNull();
    });

    it('returns null on expired token', async () => {
        const verify = createJwtVerifier({ secret: HMAC_SECRET });
        const token = jwt.sign({ sub: 'u-1' }, HMAC_SECRET, { expiresIn: '-1s' });
        expect(await verify(`Bearer ${token}`)).toBeNull();
    });

    it('rejects an asymmetric token even when HS-secret is set (algorithm pinning)', async () => {
        const verify = createJwtVerifier({ secret: HMAC_SECRET });
        const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
        const token = jwt.sign({ sub: 'u-1' }, privateKey, { algorithm: 'RS256' });
        expect(await verify(`Bearer ${token}`)).toBeNull();
    });

    it('validates audience when set', async () => {
        const verify = createJwtVerifier({ secret: HMAC_SECRET, audience: 'my-api' });
        const ok = jwt.sign({ sub: 'u-1' }, HMAC_SECRET, { audience: 'my-api' });
        const bad = jwt.sign({ sub: 'u-1' }, HMAC_SECRET, { audience: 'other-api' });
        expect(await verify(`Bearer ${ok}`)).not.toBeNull();
        expect(await verify(`Bearer ${bad}`)).toBeNull();
    });

    it('validates issuer when set', async () => {
        const verify = createJwtVerifier({ secret: HMAC_SECRET, issuer: 'https://my.iss/' });
        const ok = jwt.sign({ sub: 'u-1' }, HMAC_SECRET, { issuer: 'https://my.iss/' });
        const bad = jwt.sign({ sub: 'u-1' }, HMAC_SECRET, { issuer: 'https://other/' });
        expect(await verify(`Bearer ${ok}`)).not.toBeNull();
        expect(await verify(`Bearer ${bad}`)).toBeNull();
    });
});

// ─────────────────────────  JWKS round-trip  ─────────────────────────
//
// Spin up a tiny in-process http server that serves a JWKS document for a
// freshly-generated RSA keypair. Sign a JWT with the matching private key and
// verify via createJwtVerifier({ jwksUri }). No network, no flake.

interface TestJwks {
    server: Server;
    url: string;
    privateKey: KeyObject;
    kid: string;
}

async function startJwksServer(): Promise<TestJwks> {
    const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const kid = randomUUID();
    const jwk = {
        ...publicKey.export({ format: 'jwk' }),
        kid,
        alg: 'RS256',
        use: 'sig',
    };

    const server = createServer((req, res) => {
        if (req.url === '/.well-known/jwks.json') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ keys: [jwk] }));
            return;
        }
        res.writeHead(404);
        res.end();
    });

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = (server.address() as AddressInfo).port;

    return {
        server,
        url: `http://127.0.0.1:${port}/.well-known/jwks.json`,
        privateKey,
        kid,
    };
}

describe('createJwtVerifier — asymmetric (JWKS / RS256)', () => {
    let jwks: TestJwks;

    beforeAll(async () => {
        jwks = await startJwksServer();
    });

    afterAll(async () => {
        await new Promise<void>((resolve) => jwks.server.close(() => resolve()));
    });

    it('verifies a token signed with the matching private key', async () => {
        const verify = createJwtVerifier({ jwksUri: jwks.url });
        const token = jwt.sign({ sub: 'u-2', role: 'admin' }, jwks.privateKey, {
            algorithm: 'RS256',
            keyid: jwks.kid,
        });
        const result = await verify(`Bearer ${token}`);
        expect(result).not.toBeNull();
        const decoded = JSON.parse(result!);
        expect(decoded.sub).toBe('u-2');
        expect(decoded.role).toBe('admin');
    });

    it('returns null when token is missing kid', async () => {
        const verify = createJwtVerifier({ jwksUri: jwks.url });
        const token = jwt.sign({ sub: 'u-2' }, jwks.privateKey, { algorithm: 'RS256' });
        expect(await verify(`Bearer ${token}`)).toBeNull();
    });

    it('returns null when kid does not match any JWKS key', async () => {
        const verify = createJwtVerifier({ jwksUri: jwks.url });
        const token = jwt.sign({ sub: 'u-2' }, jwks.privateKey, {
            algorithm: 'RS256',
            keyid: 'nope-kid',
        });
        expect(await verify(`Bearer ${token}`)).toBeNull();
    });

    it('rejects an HS-signed token (algorithm pinning to RS256)', async () => {
        const verify = createJwtVerifier({ jwksUri: jwks.url });
        const token = jwt.sign({ sub: 'u-2' }, HMAC_SECRET);
        expect(await verify(`Bearer ${token}`)).toBeNull();
    });

    it('validates audience when set', async () => {
        const verify = createJwtVerifier({ jwksUri: jwks.url, audience: 'my-api' });
        const ok = jwt.sign({ sub: 'u-2' }, jwks.privateKey, {
            algorithm: 'RS256',
            keyid: jwks.kid,
            audience: 'my-api',
        });
        const bad = jwt.sign({ sub: 'u-2' }, jwks.privateKey, {
            algorithm: 'RS256',
            keyid: jwks.kid,
            audience: 'other-api',
        });
        expect(await verify(`Bearer ${ok}`)).not.toBeNull();
        expect(await verify(`Bearer ${bad}`)).toBeNull();
    });

    it('validates issuer when set', async () => {
        const verify = createJwtVerifier({ jwksUri: jwks.url, issuer: 'https://my.iss/' });
        const ok = jwt.sign({ sub: 'u-2' }, jwks.privateKey, {
            algorithm: 'RS256',
            keyid: jwks.kid,
            issuer: 'https://my.iss/',
        });
        const bad = jwt.sign({ sub: 'u-2' }, jwks.privateKey, {
            algorithm: 'RS256',
            keyid: jwks.kid,
            issuer: 'https://other/',
        });
        expect(await verify(`Bearer ${ok}`)).not.toBeNull();
        expect(await verify(`Bearer ${bad}`)).toBeNull();
    });
});
