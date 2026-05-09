import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import os from 'os';
import path from 'path';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'fs';
import { loadSchemasAndData } from '../src/schema-loader';

let tmp: string;
let modelsDir: string;

beforeEach(() => {
    tmp = mkdtempSync(path.join(os.tmpdir(), 'jex-schema-loader-'));
    modelsDir = path.join(tmp, 'models');
    mkdirSync(modelsDir);
});

afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
});

describe('schema-loader — name resolution', () => {

    it('falls back to the filename when no name is supplied', async () => {
        writeFileSync(path.join(modelsDir, 'tracks.ts'), `
            import { defineModel, types } from '${path.resolve(__dirname, '../src/schema')}';
            export default defineModel({ fields: { id: types.id() } });
        `);

        const { schemas } = await loadSchemasAndData(tmp);
        expect(schemas.find(s => s.name === 'tracks')).toBeDefined();
    });

    it('preserves a user-supplied name from defineModel', async () => {
        // Filename is `user-profile.ts` but the model declares itself as `profiles`.
        writeFileSync(path.join(modelsDir, 'user-profile.ts'), `
            import { defineModel, types } from '${path.resolve(__dirname, '../src/schema')}';
            export default defineModel({
                name: 'profiles',
                fields: { id: types.id() }
            });
        `);

        const { schemas } = await loadSchemasAndData(tmp);
        expect(schemas.map(s => s.name)).toContain('profiles');
        expect(schemas.map(s => s.name)).not.toContain('user-profile');
    });

    it('replaces the UNNAMED_MODEL placeholder with the filename', async () => {
        // defineModel sets `name: 'UNNAMED_MODEL'` when none is supplied; the loader
        // must treat this placeholder as "no name" and fall back to the filename.
        writeFileSync(path.join(modelsDir, 'genres.ts'), `
            import { defineModel, types } from '${path.resolve(__dirname, '../src/schema')}';
            export default defineModel({ fields: { id: types.id() } });
        `);

        const { schemas } = await loadSchemasAndData(tmp);
        const genres = schemas.find(s => s.name === 'genres');
        expect(genres).toBeDefined();
        expect(genres!.name).not.toBe('UNNAMED_MODEL');
    });
});
