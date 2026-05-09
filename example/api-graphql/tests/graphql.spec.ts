import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

const GQL = '/graphql';

async function gql(request: any, query: string, variables?: Record<string, any>) {
    return request.post(GQL, { data: { query, variables } });
}

test.describe('GraphQL — Queries', () => {
    test('list all albums', async ({ request }) => {
        const res = await gql(request, `{ albums { id title artistId } }`);
        expect(res.ok()).toBeTruthy();
        const { data } = await res.json();
        expect(Array.isArray(data.albums)).toBeTruthy();
        expect(data.albums.length).toBeGreaterThanOrEqual(2);
    });

    test('fetch single album by id', async ({ request }) => {
        const res = await gql(request, `{ album(id: "alb-1") { id title artistId } }`);
        expect(res.ok()).toBeTruthy();
        const { data } = await res.json();
        expect(data.album.id).toBe('alb-1');
        expect(data.album.title).toBe('Abbey Road');
    });

    test('expand artist relation', async ({ request }) => {
        const res = await gql(request, `{ album(id: "alb-1") { id title artist { id name genre } } }`);
        expect(res.ok()).toBeTruthy();
        const { data } = await res.json();
        expect(data.album.artist.id).toBe('art-1');
        expect(data.album.artist.name).toBe('The Beatles');
    });

    test('list all artists', async ({ request }) => {
        const res = await gql(request, `{ artists { id name genre } }`);
        expect(res.ok()).toBeTruthy();
        const { data } = await res.json();
        expect(Array.isArray(data.artists)).toBeTruthy();
        expect(data.artists.length).toBeGreaterThanOrEqual(2);
    });

    test('reverse relation: artist.albums uses foreignKey, not value heuristic', async ({ request }) => {
        const res = await gql(
            request,
            `{ artists { id name albums { id title artistId } } }`
        );
        expect(res.ok()).toBeTruthy();
        const { data, errors } = await res.json();
        expect(errors).toBeUndefined();
        const beatles = data.artists.find((a: any) => a.id === 'art-1');
        const daft = data.artists.find((a: any) => a.id === 'art-2');
        expect(beatles.albums.every((a: any) => a.artistId === 'art-1')).toBeTruthy();
        expect(daft.albums.every((a: any) => a.artistId === 'art-2')).toBeTruthy();
    });
});

test.describe('GraphQL — List args (limit, offset, where)', () => {
    test('limit caps the result count', async ({ request }) => {
        const res = await gql(request, `{ albums(limit: 1) { id } }`);
        const { data } = await res.json();
        expect(data.albums).toHaveLength(1);
    });

    test('offset skips the leading records', async ({ request }) => {
        const full = await gql(request, `{ albums { id } }`);
        const { data: fullData } = await full.json();
        const res = await gql(request, `{ albums(offset: 1, limit: 10) { id } }`);
        const { data } = await res.json();
        expect(data.albums).toHaveLength(fullData.albums.length - 1);
        expect(data.albums[0].id).toBe(fullData.albums[1].id);
    });

    test('where filters by field equality', async ({ request }) => {
        const res = await gql(
            request,
            `{ albums(where: { artistId: "art-1" }) { id artistId } }`
        );
        const { data } = await res.json();
        expect(data.albums.every((a: any) => a.artistId === 'art-1')).toBeTruthy();
    });
});

test.describe('GraphQL — Mutations', () => {
    let createdId: string;

    test('createAlbum', async ({ request }) => {
        const res = await gql(
            request,
            `mutation CreateAlbum($input: AlbumInput!) {
                createAlbum(input: $input) { id title artistId }
            }`,
            { input: { title: 'Dark Side of the Moon', artistId: 'art-1' } }
        );
        expect(res.ok()).toBeTruthy();
        const { data } = await res.json();
        expect(data.createAlbum.title).toBe('Dark Side of the Moon');
        expect(data.createAlbum.id).toBeDefined();
        createdId = data.createAlbum.id;
    });

    test('updateAlbum', async ({ request }) => {
        const res = await gql(
            request,
            `mutation UpdateAlbum($id: ID!, $input: AlbumInput!) {
                updateAlbum(id: $id, input: $input) { id title }
            }`,
            { id: 'alb-1', input: { title: 'Abbey Road (Remastered)', artistId: 'art-1' } }
        );
        expect(res.ok()).toBeTruthy();
        const { data } = await res.json();
        expect(data.updateAlbum.title).toBe('Abbey Road (Remastered)');
    });

    test('deleteAlbum', async ({ request }) => {
        // Create one specifically to delete
        const createRes = await gql(
            request,
            `mutation { createAlbum(input: { title: "To Delete", artistId: "art-2" }) { id } }`
        );
        const { data: createData } = await createRes.json();
        const deleteId = createData.createAlbum.id;

        const deleteRes = await gql(
            request,
            `mutation DeleteAlbum($id: ID!) { deleteAlbum(id: $id) { id } }`,
            { id: deleteId }
        );
        expect(deleteRes.ok()).toBeTruthy();
        const { data } = await deleteRes.json();
        expect(data.deleteAlbum.id).toBe(deleteId);
    });

    test('error on missing query field', async ({ request }) => {
        const res = await request.post(GQL, { data: {} });
        const body = await res.json();
        expect(body.errors).toBeDefined();
        expect(body.errors[0].message).toContain('Missing "query"');
    });
});

test.describe('GraphQL — Error mapping', () => {
    test('updateAlbum with unknown id returns NOT_FOUND', async ({ request }) => {
        const res = await gql(
            request,
            `mutation UpdateAlbum($id: ID!, $input: AlbumInput!) {
                updateAlbum(id: $id, input: $input) { id }
            }`,
            { id: 'does-not-exist', input: { title: 'whatever', artistId: 'art-1' } }
        );
        const body = await res.json();
        expect(body.errors).toBeDefined();
        expect(body.errors[0].extensions.code).toBe('NOT_FOUND');
    });

    test('deleteAlbum with unknown id returns NOT_FOUND', async ({ request }) => {
        const res = await gql(
            request,
            `mutation DeleteAlbum($id: ID!) { deleteAlbum(id: $id) { id } }`,
            { id: 'does-not-exist' }
        );
        const body = await res.json();
        expect(body.errors).toBeDefined();
        expect(body.errors[0].extensions.code).toBe('NOT_FOUND');
    });
});

test.describe('GraphQL — Custom endpoints', () => {
    test('typeFields: artist.albumCount uses ctx.db', async ({ request }) => {
        const res = await gql(request, `{ artists { id name albumCount } }`);
        expect(res.ok()).toBeTruthy();
        const { data, errors } = await res.json();
        expect(errors).toBeUndefined();
        const beatles = data.artists.find((a: any) => a.id === 'art-1');
        const daft = data.artists.find((a: any) => a.id === 'art-2');
        expect(beatles.albumCount).toBeGreaterThanOrEqual(1);
        expect(daft.albumCount).toBeGreaterThanOrEqual(1);
    });

    test('queryFields: artistsCount returns the live store size', async ({ request }) => {
        const res = await gql(request, `{ artistsCount }`);
        expect(res.ok()).toBeTruthy();
        const { data, errors } = await res.json();
        expect(errors).toBeUndefined();
        expect(typeof data.artistsCount).toBe('number');
        expect(data.artistsCount).toBeGreaterThanOrEqual(2);
    });

    test('typeFields and queryFields appear in introspection', async ({ request }) => {
        const res = await gql(
            request,
            `{
                __type(name: "Artist") { fields { name } }
                queryRoot: __type(name: "Query") { fields { name } }
            }`
        );
        const { data, errors } = await res.json();
        expect(errors).toBeUndefined();
        const artistFieldNames = data.__type.fields.map((f: any) => f.name);
        const queryFieldNames = data.queryRoot.fields.map((f: any) => f.name);
        expect(artistFieldNames).toContain('albumCount');
        expect(queryFieldNames).toContain('artistsCount');
    });
});
