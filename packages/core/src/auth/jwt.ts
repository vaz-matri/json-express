import jwt from 'jsonwebtoken';

/**
 * Verifies a Bearer JWT and returns the decoded payload as a JSON string —
 * matching the shape `middleware-auth` writes to `req.headers['x-user-payload']`.
 *
 * Returns `null` on any failure: missing/non-Bearer header, invalid signature,
 * expired token, or malformed JSON. Callers that need to distinguish between
 * "no token" and "bad token" should check the header themselves first.
 */
export function verifyJwt(
    authHeader: unknown,
    secret: string
): string | null {
    if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) return null;

    try {
        const decoded = jwt.verify(token, secret);
        return JSON.stringify(decoded);
    } catch {
        return null;
    }
}
