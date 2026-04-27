import { randomBytes } from 'crypto';
import type { HookContext } from '@json-express/core';
import { hashPassword, generateRandomToken, hashRandomToken } from './crypto';
import { passwordResetEmail } from './email-templates';

const DEFAULT_RESET_TTL_MS = 30 * 60 * 1000; // 30 minutes
const DEFAULT_APP_NAME = 'JSON Express';
const DEFAULT_RESET_URL = 'http://localhost:3000/auth/password/reset';

const ARGON2_PREFIX = '$argon2';

export async function userBeforeCreate(data: any, _ctx: HookContext): Promise<any> {
    if (typeof data.passwordHash === 'string' && data.passwordHash && !data.passwordHash.startsWith(ARGON2_PREFIX)) {
        data.passwordHash = await hashPassword(data.passwordHash);
        return data;
    }

    if (data.requirePasswordReset === true && !data.passwordHash) {
        const random = randomBytes(24).toString('base64url'); // ~32 chars
        data.passwordHash = await hashPassword(random);
    }

    return data;
}

export async function userAfterCreate(data: any, ctx: HookContext): Promise<void> {
    if (data.requirePasswordReset !== true) return;

    const token = generateRandomToken();
    await ctx.db.create('passwordResetTokens', {
        userId: String(data.id),
        tokenHash: hashRandomToken(token),
        expiresAt: new Date(Date.now() + DEFAULT_RESET_TTL_MS).toISOString(),
        createdAt: new Date().toISOString(),
    });

    if (ctx.email) {
        try {
            await ctx.email.send(passwordResetEmail({
                appName: DEFAULT_APP_NAME,
                to: data.email,
                actionUrl: DEFAULT_RESET_URL,
                token,
            }));
            ctx.logger.info('Sent admin-provisioned reset email', { userId: data.id });
        } catch (e: any) {
            ctx.logger.error('Failed to send admin-provisioned reset email', { userId: data.id, error: e?.message });
        }
    } else {
        ctx.logger.warn('Admin-provisioned user created with requirePasswordReset, but no email provider — token stored, but no email sent', { userId: data.id });
    }
}

export async function userBeforeUpdate(patch: any, _ctx: HookContext): Promise<any> {
    if (typeof patch.passwordHash === 'string'
        && patch.passwordHash
        && !patch.passwordHash.startsWith(ARGON2_PREFIX)) {
        patch.passwordHash = await hashPassword(patch.passwordHash);
    }
    return patch;
}

export async function userAfterUpdate(updated: any, patch: any, ctx: HookContext): Promise<void> {
    // Fire only when *this* patch flips the flag on, so subsequent patches
    // on the same user don't re-send the email while the flag is still true.
    if (patch.requirePasswordReset !== true) return;

    const token = generateRandomToken();
    await ctx.db.create('passwordResetTokens', {
        userId: String(updated.id),
        tokenHash: hashRandomToken(token),
        expiresAt: new Date(Date.now() + DEFAULT_RESET_TTL_MS).toISOString(),
        createdAt: new Date().toISOString(),
    });

    if (ctx.email) {
        try {
            await ctx.email.send(passwordResetEmail({
                appName: DEFAULT_APP_NAME,
                to: updated.email,
                actionUrl: DEFAULT_RESET_URL,
                token,
            }));
            ctx.logger.info('Sent admin-triggered reset email', { userId: updated.id });
        } catch (e: any) {
            ctx.logger.error('Failed to send admin-triggered reset email', { userId: updated.id, error: e?.message });
        }
    } else {
        ctx.logger.warn('Admin flipped requirePasswordReset, but no email provider — token stored, but no email sent', { userId: updated.id });
    }
}
