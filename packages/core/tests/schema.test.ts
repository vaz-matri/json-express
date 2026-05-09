import { describe, it, expect, expectTypeOf } from 'vitest';
import { defineModel, types, InferType } from '../src/schema';

describe('Schema Engine', () => {

    it('should build a valid schema using defineModel and types', () => {
        const albumModel = defineModel({
            name: 'albums',
            fields: {
                id: types.id(),
                title: types.string({ required: true, maxLength: 100 }),
                tracks: types.number({ default: 10 }),
                artistId: types.relation({ target: 'artists', type: 'many-to-one' })
            }
        });

        // Test the builder mapping
        expect(albumModel.name).toBe('albums');
        expect(albumModel.fields.id.type).toBe('id');
        expect(albumModel.fields.title.type).toBe('string');
        expect(albumModel.fields.title.options).toEqual({ required: true, maxLength: 100 });
        expect(albumModel.fields.artistId.type).toBe('relation');
        expect(albumModel.fields.artistId.options).toEqual({ target: 'artists', type: 'many-to-one' });
    });

    it('should auto-assign a default name if omitted', () => {
        const anonymousModel = defineModel({
            fields: {
                title: types.string()
            }
        });

        expect(anonymousModel.name).toBe('UNNAMED_MODEL');
    });

    it('Native Type Inference (Compile-Time Testing)', () => {
        const userModel = defineModel({
            fields: {
                id: types.id(),
                email: types.string(),
                age: types.number(),
                isActive: types.boolean(),
                createdAt: types.date(),
                profileId: types.relation({ target: 'profiles', type: 'one-to-one' })
            }
        });

        type UserType = InferType<typeof userModel>;

        // Using Vitest's exact type matching to ensure InferType properly extracted the generic hints.
        // If this compiles, our extraction mapped types are working flawlessly!
        expectTypeOf<UserType>().toEqualTypeOf<{
            id: string | number;
            email: string;
            age: number;
            isActive: boolean;
            createdAt: Date | string;
            profileId: any;
        }>();
    });

});
