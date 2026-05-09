import type { EmailMessage } from '@json-express/core';

export interface EmailTemplateContext {
    /** App name surfaced in the subject and body. */
    appName: string;
    /** Recipient email address. */
    to: string;
    /** Optional `From:` override; falls back to the provider's configured default. */
    from?: string;
    /** Base URL the action link points to; the token is appended as `?token=<value>`. */
    actionUrl: string;
    /** The plaintext token that the user will exchange. */
    token: string;
}

function buildLink(actionUrl: string, token: string): string {
    const sep = actionUrl.includes('?') ? '&' : '?';
    return `${actionUrl}${sep}token=${encodeURIComponent(token)}`;
}

export function verificationEmail(ctx: EmailTemplateContext): EmailMessage {
    const link = buildLink(ctx.actionUrl, ctx.token);
    return {
        to: ctx.to,
        from: ctx.from,
        subject: `Verify your email for ${ctx.appName}`,
        text:
            `Welcome to ${ctx.appName}!\n\n` +
            `Please verify your email address by visiting:\n${link}\n\n` +
            `If you didn't sign up, you can safely ignore this email.\n`,
        html:
            `<p>Welcome to <strong>${escapeHtml(ctx.appName)}</strong>!</p>` +
            `<p>Please verify your email address: <a href="${escapeAttr(link)}">${escapeHtml(link)}</a></p>` +
            `<p>If you didn't sign up, you can safely ignore this email.</p>`,
    };
}

export function passwordResetEmail(ctx: EmailTemplateContext): EmailMessage {
    const link = buildLink(ctx.actionUrl, ctx.token);
    return {
        to: ctx.to,
        from: ctx.from,
        subject: `Reset your ${ctx.appName} password`,
        text:
            `Someone (hopefully you) requested a password reset for ${ctx.appName}.\n\n` +
            `If this was you, visit the link below to set a new password:\n${link}\n\n` +
            `The link expires soon. If you didn't request this, you can ignore this email — your password will stay unchanged.\n`,
        html:
            `<p>Someone (hopefully you) requested a password reset for <strong>${escapeHtml(ctx.appName)}</strong>.</p>` +
            `<p>If this was you: <a href="${escapeAttr(link)}">${escapeHtml(link)}</a></p>` +
            `<p>The link expires soon. If you didn't request this, you can ignore this email — your password will stay unchanged.</p>`,
    };
}

function escapeHtml(s: string): string {
    return s.replace(/[&<>"']/g, (c) => (
        c === '&' ? '&amp;' :
        c === '<' ? '&lt;' :
        c === '>' ? '&gt;' :
        c === '"' ? '&quot;' :
        '&#39;'
    ));
}

function escapeAttr(s: string): string {
    return escapeHtml(s);
}
