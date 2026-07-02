import { test, expect } from '@playwright/test';
import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const LOG_PATH = resolve(process.cwd(), 'logs/app.log');

const readLogLines = () =>
    readFileSync(LOG_PATH, 'utf8')
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line));

const waitForFlush = () => new Promise((r) => setTimeout(r, 250));

// Pino's file transport runs in a worker thread whose (first) flush latency is
// unbounded — a fixed sleep is a race. Poll until the expected lines appear.
const waitUntil = async (predicate: () => boolean, timeoutMs = 5000) => {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        try { if (predicate()) return; } catch { /* torn write mid-read — retry */ }
        await new Promise((r) => setTimeout(r, 100));
    }
};

test.describe('Logger Pino — log file shape', () => {
    test.describe.configure({ mode: 'serial' });

    test('writes a non-empty logs/app.log on boot', () => {
        const stat = statSync(LOG_PATH);
        expect(stat.isFile()).toBe(true);
        expect(stat.size).toBeGreaterThan(0);
    });

    test('every line parses as a Pino JSON record (level, time, pid, msg)', () => {
        const lines = readLogLines();
        expect(lines.length).toBeGreaterThan(0);
        for (const entry of lines) {
            expect(typeof entry.level).toBe('number');
            expect(typeof entry.time).toBe('number');
            expect(typeof entry.pid).toBe('number');
            expect(typeof entry.msg).toBe('string');
        }
    });

    test('boot logs include the Express "Server listening" entry', () => {
        const lines = readLogLines();
        const listening = lines.find(
            (l) => l.component === 'Express' && /Server listening/.test(l.msg),
        );
        expect(listening).toBeDefined();
    });
});

test.describe('Logger Pino — traceId correlation across components', () => {
    test.describe.configure({ mode: 'serial' });

    let baselineCount = 0;
    const linesSinceBaseline = () => readLogLines().slice(baselineCount);
    const advanceBaseline = () => {
        baselineCount = readLogLines().length;
    };

    test.beforeAll(() => {
        baselineCount = readLogLines().length;
    });

    test('GET /albums emits Pino lines stamped with one shared traceId', async ({ request }) => {
        const res = await request.get('/albums');
        expect(res.ok()).toBeTruthy();
        await waitUntil(() => linesSinceBaseline().some((l) => l.traceId));

        const traced = linesSinceBaseline().filter((l) => l.traceId);
        expect(traced.length).toBeGreaterThan(0);

        const traceIds = new Set(traced.map((l) => l.traceId));
        expect(traceIds.size).toBe(1);

        const components = new Set(traced.map((l) => l.component));
        expect(components.has('Express')).toBe(true);
        expect(components.has('API-REST')).toBe(true);
        expect(components.has('DB-Memory')).toBe(true);

        advanceBaseline();
    });

    test('each request gets its own traceId (no cross-request bleed)', async ({ request }) => {
        const a = await request.get('/albums');
        const b = await request.get('/albums');
        expect(a.ok()).toBeTruthy();
        expect(b.ok()).toBeTruthy();
        await waitUntil(() => new Set(linesSinceBaseline().filter((l) => l.traceId).map((l) => l.traceId)).size >= 2);

        const traced = linesSinceBaseline().filter((l) => l.traceId);
        const traceIds = new Set(traced.map((l) => l.traceId));
        expect(traceIds.size).toBe(2);

        advanceBaseline();
    });
});

test.describe('Logger Pino — CRUD continues to work under the swapped logger', () => {
    test.describe.configure({ mode: 'serial' });
    let albumId: string;

    test('GET /albums returns the seeded record', async ({ request }) => {
        const res = await request.get('/albums');
        expect(res.ok()).toBeTruthy();
        const albums = await res.json();
        expect(Array.isArray(albums)).toBe(true);
        expect(albums.length).toBeGreaterThan(0);
    });

    test('POST /albums creates a new record', async ({ request }) => {
        const res = await request.post('/albums', {
            data: { name: 'Random Access Memories', artist: 'Daft Punk' },
        });
        expect(res.status()).toBe(201);

        const body = await res.json();
        expect(body.name).toBe('Random Access Memories');
        expect(body.id).toBeDefined();
        albumId = body.id;
    });

    test('GET /albums/:id returns the created record', async ({ request }) => {
        const res = await request.get(`/albums/${albumId}`);
        expect(res.ok()).toBeTruthy();
        const album = await res.json();
        expect(album.name).toBe('Random Access Memories');
    });

    test('DELETE /albums/:id removes the record and is logged with a traceId', async ({ request }) => {
        await waitForFlush();
        const before = readLogLines().length;
        const del = await request.delete(`/albums/${albumId}`);
        expect(del.status()).toBe(200);
        await waitUntil(() => readLogLines().slice(before).some((l) => l.traceId));

        const fresh = readLogLines().slice(before).filter((l) => l.traceId);
        expect(fresh.length).toBeGreaterThan(0);
        const ids = new Set(fresh.map((l) => l.traceId));
        expect(ids.size).toBe(1);

        const get = await request.get(`/albums/${albumId}`);
        expect(get.status()).toBe(404);
    });
});
