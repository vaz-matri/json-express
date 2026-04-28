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

async function deliverAdminResetEmail(
    flow: 'create' | 'update',
    target: { id: any; email: string },
    token: string,
    ctx: HookContext,
): Promise<void> {
    const userId = String(target.id);

    if (!ctx.kvStore) {
        ctx.logger.error('Admin-flow reset email skipped — kvStore missing from HookContext', { userId, flow });
        return;
    }

    await ctx.kvStore.set(
        `prt:${hashRandomToken(token)}`,
        { userId },
        { ttlMs: DEFAULT_RESET_TTL_MS },
    );

    if (ctx.queue) {
        await ctx.queue.enqueue('emails', 'sendPasswordReset', {
            email: target.email,
            token,
            userId,
        });
        ctx.logger.info(`Queued admin-${flow === 'create' ? 'provisioned' : 'triggered'} reset email`, { userId });
        return;
    }

    if (ctx.email) {
        // No queue installed: fall back to a synchronous send so the flow still works in dev.
        try {
            await ctx.email.send(passwordResetEmail({
                appName: DEFAULT_APP_NAME,
                to: target.email,
                actionUrl: DEFAULT_RESET_URL,
                token,
            }));
            ctx.logger.info(`Sent admin-${flow === 'create' ? 'provisioned' : 'triggered'} reset email (sync fallback)`, { userId });
        } catch (e: any) {
            ctx.logger.error('Failed to send admin-flow reset email', { userId, error: e?.message });
        }
        return;
    }

    ctx.logger.warn('Admin flipped requirePasswordReset, but no queue or email provider — token stored, no email sent', { userId });
}

export async function userAfterCreate(data: any, ctx: HookContext): Promise<void> {
    if (data.requirePasswordReset !== true) return;
    const token = generateRandomToken();
    await deliverAdminResetEmail('create', { id: data.id, email: data.email }, token, ctx);
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
    await deliverAdminResetEmail('update', { id: updated.id, email: updated.email }, token, ctx);
}
