import { addItem } from '../services/storage-service.js'

const store = {}

export const addCollection = (collection, initialData = []) => {
    if (store[collection]) return

    store[collection] = []

    initialData.forEach(data => addItem(collection, data))
}

export default store
