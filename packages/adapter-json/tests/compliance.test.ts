import { it } from 'vitest';
import os from 'os';
import path from 'path';
import { mkdtempSync, rmSync } from 'fs';
import { runAdapterComplianceTests } from '@json-express/core';
import type { ILogger } from '@json-express/core';
import { JsonFileDatabaseAdapter } from '../src/index';

const silentLogger: ILogger = (() => {
    const noop = () => {};
    const l: ILogger = { info: noop, warn: noop, error: noop, debug: noop, child: () => l };
    return l;
})();

it('@json-express/adapter-json passes the IDatabaseAdapter conformance suite', async () => {
    // adapter-json reads/writes `<cwd>/data/`, so isolate the test by chdir'ing into a temp dir.
    const originalCwd = process.cwd();
    const tmp = mkdtempSync(path.join(os.tmpdir(), 'jex-adapter-json-compliance-'));
    process.chdir(tmp);

    try {
        await runAdapterComplianceTests(
            () => new JsonFileDatabaseAdapter({ logger: silentLogger })
        );
    } finally {
        process.chdir(originalCwd);
        rmSync(tmp, { recursive: true, force: true });
    }
});
