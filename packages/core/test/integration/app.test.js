import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Dynamic JSON Express API Integration', () => {
    let app;

    beforeAll(async () => {
        // Change the current working directory so json-routes-service uses our test fixtures instead of the root repo
        process.chdir(join(__dirname, '../fixtures'));

        // We must dynamically import it AFTER chdir because it uses top-level await on process.cwd()
        const jsonRoutesModule = await import('../../src/services/json-routes-service.js');
        const routesModule = await import('../../src/routes/index.js');
        
        const jsonRoutes = jsonRoutesModule.default;
        const routes = routesModule.default;

        app = express();
        app.use(express.json());
        routes(app, jsonRoutes);
    });

    it('should successfully GET all albums', async () => {
        const response = await request(app).get('/albums');
        
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(2);
        expect(response.body[0].name).toBe('Encore');
    });

    it('should successfully GET an album by ID', async () => {
        const response = await request(app).get('/albums/2');
        
        expect(response.status).toBe(200);
        expect(response.body.name).toBe('The Marshall Mathers LP');
    });

    it('should successfully POST a new album', async () => {
        const newAlbum = { name: 'Recovery', releaseDate: '21-06-2010' };
        
        const response = await request(app)
            .post('/albums')
            .send(newAlbum);
            
        expect(response.status).toBe(201);
        expect(response.body.name).toBe('Recovery');
        expect(response.body.id).toBeDefined(); // Ensures ID generation works
        
        // Verify it was actually added
        const getRes = await request(app).get('/albums');
        expect(getRes.body.length).toBe(3);
    });
    
    it('should successfully DELETE an album', async () => {
        // Delete the one we just created
        const albumsBefore = await request(app).get('/albums');
        const targetId = albumsBefore.body[2].id;
        
        const delRes = await request(app).delete(`/albums/${targetId}`);
        expect(delRes.status).toBe(200);
        
        // Verify it was removed
        const albumsAfter = await request(app).get('/albums');
        expect(albumsAfter.body.length).toBe(2);
    });
});
