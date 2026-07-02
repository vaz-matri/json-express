import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import os from 'os';
import path from 'path';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'fs';
import { discoverPluginsRecursively, matchesCategory, selectPluginExport } from '../src/discovery';

describe('matchesCategory — anchored bucket matching', () => {

    it('matches first-party packages by prefix', () => {
        expect(matchesCategory('@json-express/api-rest', 'api')).toBe(true);
        expect(matchesCategory('@json-express/adapter-postgres', 'adapter')).toBe(true);
        expect(matchesCategory('@json-express/kv-redis', 'kv')).toBe(true);
    });

    it('matches community packages, scoped and unscoped', () => {
        expect(matchesCategory('json-express-adapter-foo', 'adapter')).toBe(true);
        expect(matchesCategory('@acme/json-express-kv-foo', 'kv')).toBe(true);
    });

    it('does not bucket by bare substring', () => {
        // the collisions the old includes() matching would have produced:
        expect(matchesCategory('@json-express/openapi-docs', 'api')).toBe(false);
        expect(matchesCategory('@json-express/openapi-docs', 'docs')).toBe(false);
        expect(matchesCategory('@json-express/uuid-v7', 'id')).toBe(false);
        expect(matchesCategory('@json-express/plugin-identity', 'id')).toBe(false);
        expect(matchesCategory('@json-express/docs-swagger', 'api')).toBe(false);
    });
});

describe('selectPluginExport — resolution ladder', () => {
    class Fake { }
    const helper = () => 'not a plugin';

    it('prefers the default export over export order', () => {
        expect(selectPluginExport({ helper, default: Fake }, 'x')).toBe(Fake);
    });

    it('unwraps CJS interop namespaces (default.default)', () => {
        expect(selectPluginExport({ default: { default: Fake } }, 'x')).toBe(Fake);
    });

    it('falls back to a named plugin/Plugin export', () => {
        expect(selectPluginExport({ helper: undefined, Plugin: Fake }, 'x')).toBe(Fake);
        expect(selectPluginExport({ plugin: Fake }, 'x')).toBe(Fake);
    });

    it('keeps the legacy first-function heuristic but warns', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => { });
        expect(selectPluginExport({ Legacy: Fake }, 'legacy-pkg')).toBe(Fake);
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('legacy-pkg'));
        warn.mockRestore();
    });

    it('throws when nothing constructable is exported', () => {
        expect(() => selectPluginExport({ notAFunction: 42 }, 'empty-pkg')).toThrow(/empty-pkg/);
    });

    it('selected classes with a static init factory are honored by the loader contract', () => {
        // loadPluginInstance prefers `static init(...)` over `new` — the shape
        // @json-express/config uses for its async file loading.
        class Facto {
            static async init(cwd: string) { return new Facto(cwd); }
            constructor(public cwd: string) { }
        }
        expect(selectPluginExport({ default: Facto }, 'x')).toBe(Facto);
        expect(typeof (Facto as any).init).toBe('function');
    });
});

describe('discoverPluginsRecursively — transitive crawling', () => {
    let tmp: string;

    const addPackage = (name: string, pkg: Record<string, any>, extraFiles: Record<string, string> = {}) => {
        const dir = path.join(tmp, 'node_modules', ...name.split('/'));
        mkdirSync(dir, { recursive: true });
        writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name, version: '1.0.0', ...pkg }));
        for (const [file, content] of Object.entries(extraFiles)) {
            writeFileSync(path.join(dir, file), content);
        }
    };

    beforeEach(() => {
        tmp = mkdtempSync(path.join(os.tmpdir(), 'jex-discovery-'));
    });

    afterEach(() => {
        rmSync(tmp, { recursive: true, force: true });
    });

    it('discovers a preset subtree even when the preset has a broken main', () => {
        // preset-mock-server regression: main points at a file that does not exist
        addPackage('@json-express/preset-broken', {
            main: 'index.js', // never shipped
            dependencies: { '@json-express/adapter-fake': '1.0.0' }
        });
        addPackage('@json-express/adapter-fake', { main: 'index.js' }, { 'index.js': 'module.exports = {};' });
        writeFileSync(path.join(tmp, 'package.json'), JSON.stringify({
            name: 'app', dependencies: { '@json-express/preset-broken': '1.0.0' }
        }));

        const found = discoverPluginsRecursively(tmp);
        expect(found).toContain('@json-express/preset-broken');
        expect(found).toContain('@json-express/adapter-fake');
    });

    it('falls back to entry-point resolution when exports omits ./package.json', () => {
        addPackage('@json-express/preset-strict', {
            main: 'index.js',
            exports: { '.': './index.js' }, // no ./package.json subpath
            dependencies: { '@json-express/logger-fake': '1.0.0' }
        }, { 'index.js': 'module.exports = {};' });
        addPackage('@json-express/logger-fake', { main: 'index.js' }, { 'index.js': 'module.exports = {};' });
        writeFileSync(path.join(tmp, 'package.json'), JSON.stringify({
            name: 'app', dependencies: { '@json-express/preset-strict': '1.0.0' }
        }));

        const found = discoverPluginsRecursively(tmp);
        expect(found).toContain('@json-express/logger-fake');
    });

    it('warns instead of silently dropping a dep that cannot be resolved at all', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => { });
        writeFileSync(path.join(tmp, 'package.json'), JSON.stringify({
            name: 'app', dependencies: { '@json-express/not-installed': '1.0.0' }
        }));

        const found = discoverPluginsRecursively(tmp);
        expect(found).toContain('@json-express/not-installed'); // still reported to the bucketer
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('@json-express/not-installed'));
        warn.mockRestore();
    });

    it('deduplicates diamond dependencies', () => {
        addPackage('@json-express/plugin-a', { main: 'package.json', dependencies: { '@json-express/kv-fake': '1.0.0' } });
        addPackage('@json-express/plugin-b', { main: 'package.json', dependencies: { '@json-express/kv-fake': '1.0.0' } });
        addPackage('@json-express/kv-fake', { main: 'package.json' });
        writeFileSync(path.join(tmp, 'package.json'), JSON.stringify({
            name: 'app',
            dependencies: { '@json-express/plugin-a': '1.0.0', '@json-express/plugin-b': '1.0.0' }
        }));

        const found = discoverPluginsRecursively(tmp);
        expect(found.filter(d => d === '@json-express/kv-fake')).toHaveLength(1);
        expect(found).toHaveLength(3);
    });
});
