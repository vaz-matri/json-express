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
