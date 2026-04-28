import { defineModel, types, type ModelSchema } from '@json-express/core';
import { userBeforeCreate, userAfterCreate, userBeforeUpdate, userAfterUpdate } from './user-hooks';

export const userModel: ModelSchema = defineModel({
    name: 'users',
    fields: {
        id: types.id(),
        email: types.string({ unique: true }),
        passwordHash: types.string(),
        role: types.string({ default: 'user' }),
        emailVerified: types.boolean({ default: false }),
        requirePasswordReset: types.boolean({ default: false }),
        // Bumped on password reset/change to invalidate all outstanding refresh
        // tokens in O(1) — refresh handler rejects tokens whose embedded
        // version no longer matches the user's current version.
        tokenVersion: types.number({ default: 0 }),
        createdAt: types.date(),
    },
    access: {
        read: 'admin',
        create: 'admin',
        update: 'owner',
        delete: 'admin',
        fields: {
            // passwordHash must only be mutated via /auth/password/{change,reset} —
            // never via generic CRUD. `update: false` strips it from PATCH bodies.
            passwordHash: { read: 'admin', create: 'admin', update: false },
            // tokenVersion is internal session-invalidation state — never client-mutable.
            tokenVersion: { read: 'admin', create: false, update: false },
        },
    },
    hooks: {
        beforeCreate: userBeforeCreate,
        afterCreate: userAfterCreate,
        beforeUpdate: userBeforeUpdate,
        afterUpdate: userAfterUpdate,
    },
});

export const roleModel: ModelSchema = defineModel({
    name: 'roles',
    fields: {
        id: types.id(),
        name: types.string({ unique: true }),
        description: types.string(),
    },
    access: {
        read: 'admin',
        create: 'admin',
        update: 'admin',
        delete: 'admin',
    },
});

export const identitySchemas: ModelSchema[] = [
    userModel,
    roleModel,
];
