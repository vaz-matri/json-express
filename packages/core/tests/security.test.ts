import { describe, it, expect } from 'vitest';
import { shouldMaskErrors, securityHeadersEnabled, buildSecurityHeaders } from '../src/security';
import type { IConfigProvider } from '../src/types';

function cfg(values: Record<string, any>): IConfigProvider {
    return {
        get: (k: string, d?: any) => (k in values ? values[k] : d),
        has: (k: string) => k in values,
        set: () => {},
    };
}

describe('shouldMaskErrors', () => {
    it('masks in production by default', () => {
        expect(shouldMaskErrors(cfg({ mode: 'production' }))).toBe(true);
    });

    it('does not mask in development', () => {
        expect(shouldMaskErrors(cfg({ mode: 'development' }))).toBe(false);
    });

    it('errors.verbose=true forces verbose even in production', () => {
        expect(shouldMaskErrors(cfg({ mode: 'production', 'errors.verbose': true }))).toBe(false);
    });

    it('errors.verbose=false forces masking even in development', () => {
        expect(shouldMaskErrors(cfg({ mode: 'development', 'errors.verbose': false }))).toBe(true);
    });

    it('is safe (unmasked) with no config', () => {
        expect(shouldMaskErrors(undefined)).toBe(false);
    });
});

describe('securityHeadersEnabled', () => {
    it('defaults on', () => {
        expect(securityHeadersEnabled(cfg({}))).toBe(true);
    });
    it('opts out with security.headers=false', () => {
        expect(securityHeadersEnabled(cfg({ 'security.headers': false }))).toBe(false);
        expect(securityHeadersEnabled(cfg({ 'security.headers': 'false' }))).toBe(false);
    });
});

describe('buildSecurityHeaders', () => {
    it('sets baseline headers, HSTS only over https', () => {
        const http = buildSecurityHeaders({ https: false });
        expect(http['X-Content-Type-Options']).toBe('nosniff');
        expect(http['X-Frame-Options']).toBe('SAMEORIGIN');
        expect(http['Strict-Transport-Security']).toBeUndefined();

        const https = buildSecurityHeaders({ https: true });
        expect(https['Strict-Transport-Security']).toContain('max-age=');
    });
});
