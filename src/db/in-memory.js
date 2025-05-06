const store = {}

export const addCollection = (collection) => {
    if (store[collection]) return

    store[collection] = []
}

export default store
