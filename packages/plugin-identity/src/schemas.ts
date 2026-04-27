import { defineModel, types, type ModelSchema } from '@json-express/core';

export const userModel: ModelSchema = defineModel({
    name: 'users',
    fields: {
        id: types.id(),
        email: types.string({ unique: true }),
        passwordHash: types.string(),
        role: types.string({ default: 'user' }),
        emailVerified: types.boolean({ default: false }),
        createdAt: types.date(),
    },
    access: {
        read: 'admin',
        create: 'admin',
        update: 'owner',
        delete: 'admin',
        fields: {
            passwordHash: { read: 'admin', update: 'admin', create: 'admin' },
        },
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

export const refreshTokenModel: ModelSchema = defineModel({
    name: 'refreshTokens',
    exposeApi: false,
    fields: {
        id: types.id(),
        userId: types.string(),
        tokenHash: types.string(),
        expiresAt: types.date(),
        revoked: types.boolean({ default: false }),
        createdAt: types.date(),
    },
    access: {
        read: 'admin',
        create: 'admin',
        update: 'admin',
        delete: 'admin',
    },
});

export const emailVerificationTokenModel: ModelSchema = defineModel({
    name: 'emailVerificationTokens',
    exposeApi: false,
    fields: {
        id: types.id(),
        userId: types.string(),
        tokenHash: types.string(),
        expiresAt: types.date(),
        createdAt: types.date(),
    },
    access: {
        read: 'admin',
        create: 'admin',
        update: 'admin',
        delete: 'admin',
    },
});

export const passwordResetTokenModel: ModelSchema = defineModel({
    name: 'passwordResetTokens',
    exposeApi: false,
    fields: {
        id: types.id(),
        userId: types.string(),
        tokenHash: types.string(),
        expiresAt: types.date(),
        createdAt: types.date(),
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
    refreshTokenModel,
    emailVerificationTokenModel,
    passwordResetTokenModel,
];
