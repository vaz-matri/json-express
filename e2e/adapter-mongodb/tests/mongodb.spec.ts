import { test, expect } from '@playwright/test';

test.describe('Adapter MongoDB — E2E Tests', () => {
    test.describe.configure({ mode: 'serial' });
    let noteId: string;

    test('should create a new note with a MongoDB ObjectId mapped to id', async ({ request }) => {
        const response = await request.post('/notes', {
            data: {
                title: 'MongoDB E2E Test',
                done: false
            }
        });
        expect(response.status()).toBe(201);

        const body = await response.json();
        expect(body.title).toBe('MongoDB E2E Test');
        
        // Assert the ID mapping works correctly!
        expect(body.id).toBeDefined();
        expect(body._id).toBeUndefined(); // Should not leak internal _id
        
        // MongoDB ObjectIds are 24 character hex strings
        expect(body.id.length).toBe(24);
        
        noteId = body.id;
    });

    test('should fetch the created note using string id', async ({ request }) => {
        const response = await request.get(`/notes/${noteId}`);
        expect(response.ok()).toBeTruthy();

        const note = await response.json();
        expect(note.title).toBe('MongoDB E2E Test');
        expect(note.id).toBe(noteId);
    });

    test('should update the note', async ({ request }) => {
        const response = await request.patch(`/notes/${noteId}`, {
            data: { done: true }
        });
        expect(response.ok()).toBeTruthy();

        const getResponse = await request.get(`/notes/${noteId}`);
        const note = await getResponse.json();
        expect(note.done).toBe(true);
    });

    test('should delete the note', async ({ request }) => {
        const response = await request.delete(`/notes/${noteId}`);
        expect(response.status()).toBe(200);

        const getResponse = await request.get(`/notes/${noteId}`);
        expect(getResponse.status()).toBe(404);
    });
});
