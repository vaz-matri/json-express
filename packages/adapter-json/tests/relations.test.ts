import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import os from 'os';
import path from 'path';
import { mkdtempSync, rmSync } from 'fs';
import type { ILogger, ModelSchema } from '@json-express/core';
import { JsonFileDatabaseAdapter } from '../src/index';

const silentLogger: ILogger = (() => {
    const noop = () => {};
    const l: ILogger = { info: noop, warn: noop, error: noop, debug: noop, child: () => l };
    return l;
})();

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
        artist: {
            type: 'relation',
            options: { target: 'artists', type: 'many-to-one', foreignKey: 'artistId' },
        } as any,
    },
};

let db: JsonFileDatabaseAdapter;
let originalCwd: string;
let tmp: string;

beforeEach(async () => {
    originalCwd = process.cwd();
    tmp = mkdtempSync(path.join(os.tmpdir(), 'jex-adapter-json-relations-'));
    process.chdir(tmp);

    db = new JsonFileDatabaseAdapter({ logger: silentLogger });
    db.setSchemas([artists, albums]);
    await db.create('artists', { id: 'art-1', name: 'The Beatles' });
    await db.create('artists', { id: 'art-2', name: 'Daft Punk' });
    await db.create('albums', { id: 'alb-1', title: 'Abbey Road', artistId: 'art-1' });
    await db.create('albums', { id: 'alb-2', title: 'Revolver', artistId: 'art-1' });
    await db.create('albums', { id: 'alb-3', title: 'Discovery', artistId: 'art-2' });
});

afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tmp, { recursive: true, force: true });
});

describe('adapter-json — schema-driven _expand', () => {
    it('expands many-to-one on getById using the declared foreignKey', async () => {
        const album = await db.getById('albums', 'alb-1', { expand: ['artist'] });
        expect(album.artist).toEqual(expect.objectContaining({ id: 'art-1', name: 'The Beatles' }));
    });

    it('expands many-to-one on getAll', async () => {
        const all = await db.getAll('albums', { expand: ['artist'] });
        const abbey = all.find((a: any) => a.id === 'alb-1');
        expect(abbey.artist.name).toBe('The Beatles');
    });

    it('omits the relation field when _expand is not requested', async () => {
        const album = await db.getById('albums', 'alb-1');
        expect(album.artist).toBeUndefined();
        expect(album.artistId).toBe('art-1');
    });

    it('expands inverse one-to-many on getById', async () => {
        const beatles = await db.getById('artists', 'art-1', { expand: ['albums'] });
        expect(beatles.albums).toHaveLength(2);
        expect(beatles.albums.map((a: any) => a.id).sort()).toEqual(['alb-1', 'alb-2']);
    });

    it('returns an empty array on inverse expansion when no children exist', async () => {
        await db.create('artists', { id: 'art-3', name: 'Loner' });
        const loner = await db.getById('artists', 'art-3', { expand: ['albums'] });
        expect(loner.albums).toEqual([]);
    });

    it('falls back to `${parentSingular}Id` when foreignKey is omitted on inverse', async () => {
        const artistsNoFk: ModelSchema = {
            name: 'artists',
            fields: {
                id: { type: 'id', options: {} } as any,
                albums: {
                    type: 'relation',
                    options: { target: 'albums', type: 'one-to-many' },
                } as any,
            },
        };
        db.setSchemas([artistsNoFk, albums]);

        const beatles = await db.getById('artists', 'art-1', { expand: ['albums'] });
        expect(beatles.albums.map((a: any) => a.id).sort()).toEqual(['alb-1', 'alb-2']);
    });

    it('falls back to `${fieldName}Id` when foreignKey is omitted on forward', async () => {
        const albumsNoFk: ModelSchema = {
            name: 'albums',
            fields: {
                id: { type: 'id', options: {} } as any,
                title: { type: 'string', options: {} } as any,
                artistId: { type: 'string', options: {} } as any,
                artist: {
                    type: 'relation',
                    options: { target: 'artists', type: 'many-to-one' },
                } as any,
            },
        };
        db.setSchemas([artists, albumsNoFk]);

        const album = await db.getById('albums', 'alb-1', { expand: ['artist'] });
        expect(album.artist.id).toBe('art-1');
    });

    it('honors search() with _expand', async () => {
        const results = await db.search('albums', { artistId: 'art-1' }, { expand: ['artist'] });
        expect(results).toHaveLength(2);
        for (const album of results) {
            expect(album.artist.id).toBe('art-1');
        }
    });
});

describe('adapter-json — inline {ref, id} envelope (legacy auto-expand)', () => {
    it('still auto-expands inline ref envelopes when no schema relation exists', async () => {
        const dbNoRefSchema = new JsonFileDatabaseAdapter({ logger: silentLogger });
        // No schemas registered → inline-ref auto-expand is the only path.
        await dbNoRefSchema.create('artists', { id: 'a', name: 'Eminem' });
        await dbNoRefSchema.create('albums', { id: 'b', title: 'Encore', artist: { ref: 'artists', id: 'a' } });

        const all = await dbNoRefSchema.getAll('albums');
        expect(all[0].artist).toEqual([expect.objectContaining({ id: 'a', name: 'Eminem' })]);
    });
});
