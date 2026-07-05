import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { matchesCategory } from '../src/discovery';

/**
 * Loader-contract conformance for every first-party package (WS8.7).
 * These assertions ARE the authoring contract from PACKAGE_TAXONOMY §5 —
 * an agent-authored package PR that passes this suite is loadable by the
 * runner. Keep in sync with context/PACKAGE_TAXONOMY.md and the core skill.
 */

const PACKAGES_DIR = join(__dirname, '..', '..');
const CATEGORIES = [
    'transport', 'adapter', 'api', 'logger', 'docs', 'config',
    'middleware', 'plugin', 'seeder', 'id', 'kv', 'queue', 'email',
];
// Not plugins: core hosts the kernel/runner; cli is standalone tooling.
const EXEMPT = new Set(['core', 'cli']);

const packageDirs = readdirSync(PACKAGES_DIR).filter(d =>
    existsSync(join(PACKAGES_DIR, d, 'package.json')) && !EXEMPT.has(d)
);

const manifest = (dir: string) =>
    JSON.parse(readFileSync(join(PACKAGES_DIR, dir, 'package.json'), 'utf8'));

describe.each(packageDirs.map(d => [d]))('loader contract: %s', (dir) => {
    const pkg = manifest(dir);

    it('has an anchored category-prefixed name', () => {
        const matched = CATEGORIES.filter(c => matchesCategory(pkg.name, c));
        expect(matched, `${pkg.name} must match exactly one discovery category`).toHaveLength(1);
    });

    it('exports its package.json for recursive discovery', () => {
        expect(pkg.exports?.['./package.json']).toBe('./package.json');
    });

    it('declares core in peerDependencies (never dependencies)', () => {
        expect(pkg.dependencies?.['@json-express/core'],
            'core in dependencies risks a duplicated kernel').toBeUndefined();
        expect(pkg.peerDependencies?.['@json-express/core']).toBeDefined();
    });

    it('default-exports its plugin class', () => {
        const entry = join(PACKAGES_DIR, dir, 'src', 'index.ts');
        expect(readFileSync(entry, 'utf8')).toMatch(/export default /);
    });

    it('ships AI-facing docs (llms.txt + skills in files)', () => {
        expect(existsSync(join(PACKAGES_DIR, dir, 'llms.txt'))).toBe(true);
        expect(pkg.files).toContain('llms.txt');
        expect(existsSync(join(PACKAGES_DIR, dir, 'skills')), 'every package ships a skills/ folder').toBe(true);
        expect(pkg.files).toContain('skills');
    });
});
