import { defineModel, types } from '@json-express/core';
import { GraphQLInt } from 'graphql';

export default defineModel({
    fields: {
        id: types.id(),
        name: types.string({ required: true }),
        genre: types.string(),
        albums: types.relation({ target: 'albums', type: 'one-to-many', foreignKey: 'artistId' }),
    },
    graphql: {
        // Computed field on the auto-generated `Artist` type — exercises typeFields.
        // Reads via the db adapter exposed on the resolver context.
        typeFields: {
            albumCount: {
                type: GraphQLInt,
                resolve: async (parent: any, _args: any, ctx: any) => {
                    const owned = await ctx.db.search('albums', { artistId: parent.id });
                    return owned.length;
                },
            },
        },
        // Root-level custom query — exercises queryFields.
        queryFields: {
            artistsCount: {
                type: GraphQLInt,
                resolve: async (_: any, _args: any, ctx: any) => {
                    const all = await ctx.db.getAll('artists');
                    return all.length;
                },
            },
        },
    },
});
