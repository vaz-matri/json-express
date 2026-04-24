import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryDatabaseAdapter } from '../src/index';
import type { ModelSchema } from '@json-express/core';

// Artist has id (2 chars) that could coincidentally match other numeric fields in albums.
// This fixture is deliberately crafted so the old value-matching heuristic would produce
// false positives; only an explicit foreignKey-based filter yields the right result.
const artists: ModelSchema = {
    name: 'artists',
    fields: {
        id: { type: 'id', options: {} } as any,
        name: { type: 'string', options: {} } as any,
        albums: {
            type: 'relation',
            options: { target: 'albums', type: 'one-to-many', foreignKey: 'artistId' },
        } as any,
    },
};

const albums: ModelSchema = {
    name: 'albums',
    fields: {
        id: { type: 'id', options: {} } as any,
        title: { type: 'string', options: {} } as any,
        artistId: { type: 'string', options: {} } as any,
        rating: { type: 'number', options: {} } as any,
        artist: {
            type: 'relation',
            options: { target: 'artists', type: 'many-to-one', foreignKey: 'artistId' },
        } as any,
    },
};

let db: MemoryDatabaseAdapter;

beforeEach(() => {
    db = new MemoryDatabaseAdapter();
    db.setSchemas([artists, albums]);
    db.loadData({
        artists: [
            { id: '1', name: 'The Beatles' },
            { id: '2', name: 'Daft Punk' },
        ],
        albums: [
            // `rating: 1` is the booby trap: the old heuristic would match this row
            // to artist id '1' via Object.values().some(...).
            { id: 'alb-1', title: 'Abbey Road', artistId: '1', rating: 5 },
            { id: 'alb-2', title: 'Revolver', artistId: '1', rating: 1 },
            { id: 'alb-3', title: 'Discovery', artistId: '2', rating: 1 },
            { id: 'alb-4', title: 'Random', artistId: '2', rating: 2 },
        ],
    });
});

describe('adapter-memory — one-to-many _expand via foreignKey', () => {
    it('expands artist.albums using the declared foreignKey, not value matching', async () => {
        const beatles = await db.getById<any>('artists', '1', { expand: ['albums'] });
        expect(beatles.albums).toHaveLength(2);
        expect(beatles.albums.map((a: any) => a.id).sort()).toEqual(['alb-1', 'alb-2']);
    });

    it('does not include unrelated records whose non-FK fields coincidentally equal parent.id', async () => {
        // Old heuristic bug: alb-3 has rating=1, which would have matched parent id '1'.
        // With the fix, only records whose artistId === '1' are returned.
        const beatles = await db.getById<any>('artists', '1', { expand: ['albums'] });
        const ids = beatles.albums.map((a: any) => a.id);
        expect(ids).not.toContain('alb-3');
        expect(ids).not.toContain('alb-4');
    });

    it('returns empty array when no children exist', async () => {
        await db.create('artists', { id: '3', name: 'Loner' });
        const loner = await db.getById<any>('artists', '3', { expand: ['albums'] });
        expect(loner.albums).toEqual([]);
    });

    it('still supports many-to-one expand via foreignKey (regression)', async () => {
        const abbey = await db.getById<any>('albums', 'alb-1', { expand: ['artist'] });
        expect(abbey.artist).toEqual({ id: '1', name: 'The Beatles' });
    });

    it('falls back to `${parentSingular}Id` when foreignKey option is omitted', async () => {
        const artistsNoFk: ModelSchema = {
            name: 'artists',
            fields: {
                id: { type: 'id', options: {} } as any,
                name: { type: 'string', options: {} } as any,
                albums: {
                    type: 'relation',
                    options: { target: 'albums', type: 'one-to-many' },
                } as any,
            },
        };
        const fallbackDb = new MemoryDatabaseAdapter();
        fallbackDb.setSchemas([artistsNoFk, albums]);
        fallbackDb.loadData({
            artists: [{ id: '1', name: 'The Beatles' }],
            albums: [{ id: 'alb-1', title: 'Abbey Road', artistId: '1' }],
        });

        const beatles = await fallbackDb.getById<any>('artists', '1', { expand: ['albums'] });
        expect(beatles.albums).toHaveLength(1);
        expect(beatles.albums[0].id).toBe('alb-1');
    });
});
