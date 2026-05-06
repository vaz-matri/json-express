import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const seed: Array<{ id: string; name: string; artist: string }> = JSON.parse(
    readFileSync(resolve(process.cwd(), 'data/albums.json'), 'utf8')
);
const seedAlbum = seed[0];

test.describe('Transport Fastify — CRUD Parity', () => {
    test.describe.configure({ mode: 'serial' });
    let albumId: string;

    // SEED — runs first so it observes the boot state from data/albums.json
    test('should expose the seeded album from data/albums.json', async ({ request }) => {
        const response = await request.get('/albums');
        expect(response.ok()).toBeTruthy();

        const albums = await response.json();
        expect(Array.isArray(albums)).toBe(true);

        const seeded = albums.find((a: any) => a.id === seedAlbum.id);
        expect(seeded).toBeDefined();
        expect(seeded.name).toBe(seedAlbum.name);
        expect(seeded.artist).toBe(seedAlbum.artist);
    });

    // CREATE
    test('should create a new album via Fastify transport', async ({ request }) => {
        const response = await request.post('/albums', {
            data: { name: 'Discovery', artist: 'Daft Punk' }
        });
        expect(response.status()).toBe(201);

        const body = await response.json();
        expect(body.name).toBe('Discovery');
        expect(body.artist).toBe('Daft Punk');
        expect(body.id).toBeDefined();
        albumId = body.id;
    });

    // READ (One)
    test('should fetch the created album by ID', async ({ request }) => {
        const response = await request.get(`/albums/${albumId}`);
        expect(response.ok()).toBeTruthy();

        const album = await response.json();
        expect(album.id).toBe(albumId);
        expect(album.name).toBe('Discovery');
        expect(album.artist).toBe('Daft Punk');
    });

    // UPDATE
    test('should update album details', async ({ request }) => {
        const response = await request.patch(`/albums/${albumId}`, {
            data: { name: 'Discovery (Anniversary Edition)' }
        });
        expect(response.ok()).toBeTruthy();

        const body = await response.json();
        expect(body.name).toBe('Discovery (Anniversary Edition)');
        expect(body.artist).toBe('Daft Punk');
    });

    // DELETE
    test('should delete the album', async ({ request }) => {
        const response = await request.delete(`/albums/${albumId}`);
        expect(response.status()).toBe(200);

        const getResponse = await request.get(`/albums/${albumId}`);
        expect(getResponse.status()).toBe(404);
    });
});
