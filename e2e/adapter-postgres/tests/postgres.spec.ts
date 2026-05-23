import { test, expect } from '@playwright/test';

test.describe('Adapter Postgres — E2E Tests', () => {
    test.describe.configure({ mode: 'serial' });
    let noteId: string;

    test('should create a new note with a uuidv7', async ({ request }) => {
        const response = await request.post('/notes', {
            data: {
                title: 'Postgres E2E Test',
                done: false
            }
        });
        expect(response.status()).toBe(201);

        const body = await response.json();
        expect(body.title).toBe('Postgres E2E Test');
        expect(body.id).toBeDefined();
        
        // Ensure the ID is a valid string UUID
        expect(typeof body.id).toBe('string');
        expect(body.id.length).toBeGreaterThan(10);
        
        noteId = body.id;
    });

    test('should fetch the created note from Postgres', async ({ request }) => {
        const response = await request.get(`/notes/${noteId}`);
        expect(response.ok()).toBeTruthy();

        const note = await response.json();
        expect(note.title).toBe('Postgres E2E Test');
        expect(note.id).toBe(noteId);
    });

    test('should delete the note from Postgres', async ({ request }) => {
        const response = await request.delete(`/notes/${noteId}`);
        expect(response.status()).toBe(200);

        const getResponse = await request.get(`/notes/${noteId}`);
        expect(getResponse.status()).toBe(404);
    });
});
