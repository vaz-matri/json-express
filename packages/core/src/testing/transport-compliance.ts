import assert from 'assert';
import net from 'net';
import type { ITransport, ILogger, IConfigProvider } from '../types';

/**
 * A no-op logger that satisfies ILogger — keeps test output clean while still letting
 * transport implementations call .info / .error / .child during boot.
 */
function silentLogger(): ILogger {
    const noop = () => {};
    const logger: ILogger = {
        info: noop,
        warn: noop,
        error: noop,
        debug: noop,
        child: () => logger,
    };
    return logger;
}

function nullConfigProvider(): IConfigProvider {
    return {
        get: <T = any>(_key: string, fallback?: T) => fallback as T,
        has: () => false,
        getAll: () => ({}),
    } as unknown as IConfigProvider;
}

/** Pick an arbitrary free port by binding :0 then immediately releasing it. */
async function pickFreePort(): Promise<number> {
    return new Promise((resolve, reject) => {
        const probe = net.createServer();
        probe.unref();
        probe.once('error', reject);
        // Bind with no host = default wildcard, so the picked port is free across all interfaces.
        probe.listen(0, () => {
            const addr = probe.address();
            probe.close(() => {
                if (addr && typeof addr === 'object') resolve(addr.port);
                else reject(new Error('Could not resolve probe port'));
            });
        });
    });
}

export interface TransportFactoryArgs {
    logger: ILogger;
    configProvider: IConfigProvider;
}

export type TransportFactory = (args: TransportFactoryArgs) => ITransport;

/**
 * Conformance suite that every `transport-*` plugin MUST pass.
 *
 * Designed to be invocable from any test runner: drop a single `it('passes the
 * transport conformance suite', () => runTransportComplianceTests(name, factory))`
 * into the transport's vitest spec.
 *
 * Add new contract requirements here — every transport gains them automatically.
 */
export async function runTransportComplianceTests(
    name: string,
    factory: TransportFactory
): Promise<void> {
    console.log(`--- Running ITransport compliance for ${name} ---`);

    const cleanups: Array<() => Promise<void>> = [];
    const make = () => {
        const t = factory({ logger: silentLogger(), configProvider: nullConfigProvider() });
        cleanups.push(() => t.stop().catch(() => {}));
        return t;
    };

    try {
        // Contract 1: start() resolves on a free port.
        {
            const port = await pickFreePort();
            const t = make();
            await t.start(port);
        }

        // Contract 2: start() rejects with EADDRINUSE when the port is busy.
        // The deployment platform owns the port contract — silently auto-picking
        // another port would break load balancers, health checks, and meshes.
        {
            const port = await pickFreePort();
            const squatter = net.createServer();
            // Bind on the wildcard so any host the transport uses (`::`, `0.0.0.0`, `127.0.0.1`)
            // overlaps and the OS rejects with EADDRINUSE. macOS in particular won't conflict
            // an IPv4-only bind with an IPv6-only bind, so we have to be wildcard-vs-wildcard.
            await new Promise<void>((resolve, reject) => {
                squatter.once('error', reject);
                squatter.listen(port, () => resolve());
            });
            cleanups.push(() => new Promise<void>((res) => squatter.close(() => res())));

            const t = make();
            let rejected = false;
            let observedCode: string | undefined;
            try {
                await t.start(port);
            } catch (err: any) {
                rejected = true;
                observedCode = err?.code;
            }
            assert(rejected, `${name}.start() must reject when the port is already in use, but it resolved.`);
            assert(
                observedCode === 'EADDRINUSE',
                `${name}.start() rejection must carry code 'EADDRINUSE' so operators can diagnose the conflict; got ${observedCode}.`
            );
        }

        // Contract 3: stop() resolves cleanly after a successful start.
        {
            const port = await pickFreePort();
            const t = factory({ logger: silentLogger(), configProvider: nullConfigProvider() });
            await t.start(port);
            await t.stop();
        }

        console.log(`✅ ${name} passed all transport compliance checks.`);
    } finally {
        while (cleanups.length) {
            const fn = cleanups.pop();
            try { await fn?.(); } catch { /* best-effort */ }
        }
    }
}
