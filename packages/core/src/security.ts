import type { IConfigProvider } from './types';

/** Body message sent to clients for masked 5xx errors — never leak internals. */
export const GENERIC_ERROR_MESSAGE = 'Internal Server Error';

/**
 * Whether server error details should be hidden from clients. Masks in production
 * (jex.mode=production) by default; `jex.errors.verbose` overrides either way, so an
 * operator can force verbose in prod (debugging) or masked in dev.
 */
export function shouldMaskErrors(config?: IConfigProvider): boolean {
    const verbose = config?.get<unknown>('errors.verbose', undefined);
    if (verbose === true || verbose === 'true') return false;
    if (verbose === false || verbose === 'false') return true;
    return config?.get('mode', 'development') === 'production';
}

/** Response security headers are on by default; opt out with jex.security.headers=false. */
export function securityHeadersEnabled(config?: IConfigProvider): boolean {
    const v = config?.get<unknown>('security.headers', true);
    return !(v === false || v === 'false');
}

/**
 * Baseline response security headers. Deliberately conservative — no CSP, since a global
 * CSP would break the docs UIs (Swagger / GraphiQL); HSTS only over https so it can't
 * strand a plain-http deployment.
 */
export function buildSecurityHeaders(opts: { https?: boolean } = {}): Record<string, string> {
    const headers: Record<string, string> = {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        'Referrer-Policy': 'no-referrer',
    };
    if (opts.https) {
        headers['Strict-Transport-Security'] = 'max-age=63072000; includeSubDomains';
    }
    return headers;
}
