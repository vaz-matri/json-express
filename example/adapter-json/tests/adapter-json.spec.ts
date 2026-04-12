import { test, expect } from '@playwright/test';

test.describe('Adapter JSON — Persistent File Storage', () => {
    test.describe.configure({ mode: 'serial' });
    let noteId: string;

    // CREATE
    test('should create a new note', async ({ request }) => {
        const response = await request.post('/notes', {
            data: {
                title: 'Learn JSON Express',
                done: false
            }
        });
        expect(response.status()).toBe(201);

        const body = await response.json();
        expect(body.title).toBe('Learn JSON Express');
        expect(body.id).toBeDefined();
        noteId = body.id;
    });

    // READ (All)
    test('should fetch all notes including the created one', async ({ request }) => {
        const response = await request.get('/notes');
        expect(response.ok()).toBeTruthy();

        const notes = await response.json();
        expect(Array.isArray(notes)).toBe(true);
        expect(notes.some((n: any) => n.title === 'Learn JSON Express')).toBe(true);
    });

    // READ (One)
    test('should fetch the created note by ID', async ({ request }) => {
        const response = await request.get(`/notes/${noteId}`);
        expect(response.ok()).toBeTruthy();

        const note = await response.json();
        expect(note.title).toBe('Learn JSON Express');
        expect(note.id).toBe(noteId);
    });

    // UPDATE
    test('should update note details', async ({ request }) => {
        const response = await request.patch(`/notes/${noteId}`, {
            data: { done: true }
        });
        expect(response.ok()).toBeTruthy();

        const body = await response.json();
        expect(body.done).toBe(true);
        expect(body.title).toBe('Learn JSON Express');
    });

    // DELETE
    test('should delete the note', async ({ request }) => {
        const response = await request.delete(`/notes/${noteId}`);
        expect(response.status()).toBe(200);

        const getResponse = await request.get(`/notes/${noteId}`);
        expect(getResponse.status()).toBe(404);
    });
});
