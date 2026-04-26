import argon2 from 'argon2';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';

const ARGON2_OPTS: argon2.Options = {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1,
};

export async function hashPassword(plaintext: string): Promise<string> {
    return argon2.hash(plaintext, ARGON2_OPTS);
}

export async function verifyPassword(hash: string, plaintext: string): Promise<boolean> {
    try {
        return await argon2.verify(hash, plaintext);
    } catch {
        return false;
    }
}

export function generateRefreshToken(): string {
    // 32 bytes → 43-char base64url. Plenty of entropy, URL-safe.
    return randomBytes(32).toString('base64url');
}

export function hashRefreshToken(token: string): string {
    // SHA-256 is appropriate here: refresh tokens are high-entropy random strings,
    // not user-chosen secrets, so we don't need argon2's slow KDF — we just need
    // a deterministic one-way mapping for storage so a DB leak can't replay tokens.
    return createHash('sha256').update(token).digest('hex');
}

export function safeCompareHex(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}
