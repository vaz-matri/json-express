import { describe, it, expect } from 'vitest';
import { getRefs } from '../../src/utils/obj-utils.js';

describe('Object Utilities (obj-utils.js)', () => {
    describe('getRefs', () => {
        it('should return an empty object if no refs exist', () => {
            const result = getRefs({ name: 'Eminem', genre: 'Hip Hop' });
            expect(result).toEqual({});
        });

        it('should extract a single reference object', () => {
            const input = {
                title: 'Encore',
                artist: { ref: 'artists', id: 1 }
            };
            const result = getRefs(input);
            expect(result).toEqual({
                artist: [{ ref: 'artists', id: 1 }]
            });
        });

        it('should extract an array of reference objects', () => {
            const input = {
                name: 'Eminem',
                albums: [
                    { ref: 'albums', id: 1 },
                    { ref: 'albums', id: 2 }
                ]
            };
            const result = getRefs(input);
            expect(result).toEqual({
                albums: [
                    { ref: 'albums', id: 1 },
                    { ref: 'albums', id: 2 }
                ]
            });
        });

        it('should ignore arrays that do not contain reference objects', () => {
            const input = {
                name: 'Eminem',
                genres: ['Hip Hop', 'Rap']
            };
            const result = getRefs(input);
            expect(result).toEqual({});
        });
    });
});
