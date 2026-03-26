import { faker } from '@faker-js/faker';

// Stores newly generated active data in memory
const runtimeStorage = {};

const generateData = (key) => {
    if (runtimeStorage[key]) return runtimeStorage[key];

    // Some simple rules to generate realistic mock data based on the route name
    if (key === 'users') {
        const creator = () => ({
            id: faker.string.uuid(),
            username: faker.internet.username(),
            email: faker.internet.email(),
            avatar: faker.image.avatar(),
            password: faker.internet.password()
        });
        runtimeStorage[key] = faker.helpers.multiple(creator, { count: 10 });
    } else if (key === 'albums' || key === 'music') {
        const creator = () => ({
            id: faker.string.uuid(),
            album: faker.music.album(),
            artist: faker.music.artist(),
            genre: faker.music.genre()
        });
        runtimeStorage[key] = faker.helpers.multiple(creator, { count: 10 });
    } else {
        // Fallback default mock
        const creator = () => ({
            id: faker.string.uuid(),
            title: faker.word.words({ count: 3 }),
            description: faker.lorem.sentence()
        });
        runtimeStorage[key] = faker.helpers.multiple(creator, { count: 5 });
    }

    return runtimeStorage[key];
};

export default {
    name: '@json-express/faker',
    type: 'data-adapter',
    
    validateConfig: (config) => {
        // Example hook: ensuring no conflicts
        if (config.strictMode === true) {
            console.warn('⚠️ @json-express/faker ignores strict schema validation because data is randomized.');
        }
    },

    adapter: {
        getAllItems: async (key) => {
            return generateData(key);
        },
        getItemById: async (key, id) => {
            const items = generateData(key);
            const item = items.find(i => i.id === id);
            if (!item) {
                const err = new Error('id not found');
                err.statusCode = 404;
                throw err;
            }
            return item;
        },
        searchItems: async (key, searchReq) => {
            const items = generateData(key);
            return items.filter(item => {
                return Object.keys(searchReq).every(searchKey => searchReq[searchKey] === item[searchKey]);
            });
        },
        addItem: async (key, createReq) => {
            const items = generateData(key);
            const newItem = { id: faker.string.uuid(), ...createReq };
            items.push(newItem);
            return newItem;
        },
        updateItem: async (key, id, updateReq) => {
            const items = generateData(key);
            const index = items.findIndex(i => i.id === id);
            if (index === -1) {
                const err = new Error('id not found');
                err.statusCode = 404;
                throw err;
            }
            items[index] = { ...items[index], ...updateReq };
            return items[index];
        },
        deleteItem: async (key, id) => {
            const items = generateData(key);
            const index = items.findIndex(i => i.id === id);
            if (index === -1) {
                const err = new Error('id not found');
                err.statusCode = 404;
                throw err;
            }
            const deleted = items.splice(index, 1)[0];
            return deleted;
        }
    }
};
