import { test, expect, type APIRequestContext } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

const createAlbum = (req: APIRequestContext, data: Record<string, any>) =>
    req.post('/albums', { data });

test.describe('docs-swagger — albums CRUD', () => {
    let albumId: string;

    test('creates a new album', async ({ request }) => {
        const res = await createAlbum(request, { name: 'Discovery', releaseDate: '12-03-2001' });
        expect(res.status()).toBe(201);

        const body = await res.json();
        expect(body.name).toBe('Discovery');
        expect(body.id).toBeDefined();
        albumId = body.id;
    });

    test('lists albums and includes the new one', async ({ request }) => {
        const res = await request.get('/albums');
        expect(res.ok()).toBeTruthy();

        const albums = await res.json();
        expect(Array.isArray(albums)).toBe(true);
        expect(albums.some((a: any) => a.name === 'Discovery')).toBe(true);
    });

    test('fetches the album by id', async ({ request }) => {
        const res = await request.get(`/albums/${albumId}`);
        expect(res.ok()).toBeTruthy();

        const album = await res.json();
        expect(album.name).toBe('Discovery');
        expect(album.id).toBe(albumId);
    });

    test('patches album details', async ({ request }) => {
        const res = await request.patch(`/albums/${albumId}`, {
            data: { name: 'Discovery (Anniversary Edition)' },
        });
        expect(res.ok()).toBeTruthy();

        const body = await res.json();
        expect(body.name).toBe('Discovery (Anniversary Edition)');
    });

    test('deletes the album and 404s thereafter', async ({ request }) => {
        const del = await request.delete(`/albums/${albumId}`);
        expect(del.status()).toBe(200);

        const after = await request.get(`/albums/${albumId}`);
        expect(after.status()).toBe(404);
    });
});

test.describe('docs-swagger — custom certify endpoint', () => {
    let goldId: string;
    let bronzeId: string;

    test('seeds a gold-tier album for promotion tests', async ({ request }) => {
        const res = await createAlbum(request, {
            name: 'Promotion Candidate',
            artist: 'Test Artist',
            certified: 'Gold',
        });
        expect(res.status()).toBe(201);
        goldId = (await res.json()).id;
    });

    test('promotes Gold → Platinum', async ({ request }) => {
        const res = await request.post(`/albums/${goldId}/certify`);
        expect(res.status()).toBe(200);
        expect((await res.json()).certified).toBe('Platinum');
    });

    test('promotes Platinum → Diamond', async ({ request }) => {
        const res = await request.post(`/albums/${goldId}/certify`);
        expect(res.status()).toBe(200);
        expect((await res.json()).certified).toBe('Diamond');
    });

    test('rejects further promotion at top tier with 409', async ({ request }) => {
        const res = await request.post(`/albums/${goldId}/certify`);
        expect(res.status()).toBe(409);
    });

    test('returns 400 on unknown certification tier', async ({ request }) => {
        const created = await createAlbum(request, {
            name: 'Bronze Album',
            artist: 'Indie',
            certified: 'Bronze',
        });
        bronzeId = (await created.json()).id;

        const res = await request.post(`/albums/${bronzeId}/certify`);
        expect(res.status()).toBe(400);
    });

    test('returns 404 for unknown album', async ({ request }) => {
        const res = await request.post('/albums/does-not-exist/certify');
        expect(res.status()).toBe(404);
    });

    test('cleanup', async ({ request }) => {
        await request.delete(`/albums/${goldId}`);
        await request.delete(`/albums/${bronzeId}`);
    });
});

test.describe('docs-swagger — OpenAPI manifest', () => {
    test('GET /docs/json serves the spec', async ({ request }) => {
        const res = await request.get('/docs/json');
        expect(res.status()).toBe(200);
        expect(res.headers()['content-type']).toContain('application/json');

        const spec = await res.json();
        expect(spec.openapi).toBe('3.0.0');
        expect(spec.info?.title).toBeTruthy();
    });

    test('paths include albums CRUD and the custom certify route', async ({ request }) => {
        const spec = await (await request.get('/docs/json')).json();

        expect(spec.paths['/albums']).toBeDefined();
        expect(spec.paths['/albums'].get).toBeDefined();
        expect(spec.paths['/albums'].post).toBeDefined();

        expect(spec.paths['/albums/{id}']).toBeDefined();
        expect(spec.paths['/albums/{id}'].patch).toBeDefined();
        expect(spec.paths['/albums/{id}'].delete).toBeDefined();

        expect(spec.paths['/albums/{id}/certify']).toBeDefined();
        expect(spec.paths['/albums/{id}/certify'].post).toBeDefined();
    });

    test('operations are grouped by resource (Albums tag, not General)', async ({ request }) => {
        const spec = await (await request.get('/docs/json')).json();

        const ops = [
            spec.paths['/albums'].get,
            spec.paths['/albums'].post,
            spec.paths['/albums/{id}'].get,
            spec.paths['/albums/{id}/certify'].post,
        ];
        for (const op of ops) {
            expect(op.tags).toContain('Albums');
            expect(op.tags).not.toContain('General');
        }
    });

    test('components.schemas.Albums is derived from the model fields', async ({ request }) => {
        const spec = await (await request.get('/docs/json')).json();
        const albumSchema = spec.components?.schemas?.Albums;

        expect(albumSchema).toBeDefined();
        expect(albumSchema.type).toBe('object');
        expect(albumSchema.properties.name).toEqual({ type: 'string' });
        expect(albumSchema.properties.trackCount.type).toBe('number');
        expect(albumSchema.properties.trackCount.minimum).toBe(1);
        expect(albumSchema.required).toContain('name');
    });

    test('POST /albums request body $refs the component schema', async ({ request }) => {
        const spec = await (await request.get('/docs/json')).json();
        const body = spec.paths['/albums'].post.requestBody;
        const schema = body.content['application/json'].schema;
        expect(schema.$ref).toBe('#/components/schemas/Albums');
    });
});

test.describe('docs-swagger — Swagger UI', () => {
    test('GET /docs serves the Swagger UI HTML shell', async ({ request }) => {
        const res = await request.get('/docs');
        expect(res.status()).toBe(200);
        expect(res.headers()['content-type']).toContain('text/html');

        const html = await res.text();
        expect(html).toContain('id="swagger-ui"');
        expect(html).toContain('/docs/json');
    });
});
