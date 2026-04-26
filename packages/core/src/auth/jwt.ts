import jwt from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';

/**
 * Configuration for `createJwtVerifier`. Exactly one of `secret` (HMAC) or
 * `jwksUri` (asymmetric / OIDC providers) must be set — passing both, or
 * neither, throws at construction time.
 *
 * `audience` and `issuer` are optional but strictly validated when set.
 * `algorithms` defaults to `['HS256']` for `secret` mode and `['RS256']` for
 * `jwksUri` mode; always pinned to prevent the "alg: none" attack.
 */
export interface JwtVerifierConfig {
    secret?: string;
    jwksUri?: string;
    audience?: string | string[];
    issuer?: string;
    algorithms?: string[];
}

/**
 * Async verifier — resolves to the JSON-stringified decoded payload (matching
 * the shape `middleware-auth` writes to `req.headers['x-user-payload']`), or
 * `null` on any failure: missing/non-Bearer header, invalid signature, expired
 * token, audience/issuer mismatch, or wrong algorithm.
 */
export type JwtVerifier = (authHeader: unknown) => Promise<string | null>;

function extractBearer(authHeader: unknown): string | null {
    if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.slice('Bearer '.length).trim();
    return token || null;
}

/**
 * Builds a reusable JWT verifier function. The JWKS client (when configured)
 * caches signing keys internally — keep the returned verifier alive across
 * requests rather than constructing a new one per call.
 */
export function createJwtVerifier(config: JwtVerifierConfig): JwtVerifier {
    const hasSecret = typeof config.secret === 'string' && config.secret.length > 0;
    const hasJwks = typeof config.jwksUri === 'string' && config.jwksUri.length > 0;

    if (hasSecret && hasJwks) {
        throw new Error(
            "Auth misconfigured: both 'auth.secret' and 'auth.jwksUri' are set. Choose exactly one."
        );
    }
    if (!hasSecret && !hasJwks) {
        throw new Error(
            "Auth misconfigured: neither 'auth.secret' nor 'auth.jwksUri' is set. Provide one to verify tokens."
        );
    }

    const baseOptions: jwt.VerifyOptions = {};
    if (config.audience !== undefined) baseOptions.audience = config.audience;
    if (config.issuer !== undefined) baseOptions.issuer = config.issuer;

    if (hasSecret) {
        const secret = config.secret as string;
        const algorithms = (config.algorithms as jwt.Algorithm[] | undefined) ?? ['HS256'];

        return async (authHeader) => {
            const token = extractBearer(authHeader);
            if (!token) return null;
            try {
                const decoded = jwt.verify(token, secret, { ...baseOptions, algorithms });
                return JSON.stringify(decoded);
            } catch {
                return null;
            }
        };
    }

    // JWKS path
    const client = jwksRsa({
        jwksUri: config.jwksUri as string,
        cache: true,
        rateLimit: true,
    });
    const algorithms = (config.algorithms as jwt.Algorithm[] | undefined) ?? ['RS256'];

    const getKey: jwt.GetPublicKeyOrSecret = (header, callback) => {
        if (!header.kid) {
            callback(new Error('Token missing kid (key id) header'));
            return;
        }
        client.getSigningKey(header.kid, (err, key) => {
            if (err || !key) {
                callback(err ?? new Error('JWKS key not found'));
                return;
            }
            callback(null, key.getPublicKey());
        });
    };

    return (authHeader) =>
        new Promise<string | null>((resolve) => {
            const token = extractBearer(authHeader);
            if (!token) {
                resolve(null);
                return;
            }
            jwt.verify(token, getKey, { ...baseOptions, algorithms }, (err, decoded) => {
                if (err || !decoded) {
                    resolve(null);
                    return;
                }
                resolve(JSON.stringify(decoded));
            });
        });
}
