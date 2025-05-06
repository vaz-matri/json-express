import AppError from '../utils/app-error.js'

const store = {
    artists: [],
    albums: []
}

export const getAllItems = (key) => {
    return store[key]
}

export const getItemById = (key, id) => {
    const { item } = findById(key, id)

    return item
}

export const addItem = (key, createReq) => {
    validateReq(createReq)

    const item = { id: `${Date.now()}`, ...createReq }
    store[key].push(item)

    return item
}

export const updateItem = (key, id, updateReq) => {
    validateReq(updateReq)

    let { item, index } = findById(key, id)

    item = { ...item, ...updateReq }

    store[key][index] = item

    return item
}

export const deleteItem = (key, id) => {
    const { item, index } = findById(key, id)

    store[key].splice(index, 1)

    return item
}

const validateReq = (dtoReq) => {
    if (!Object.keys(dtoReq).length) { //:TODO validate using joi
        throw new AppError('empty request body', 400)
    }

    return dtoReq
}

const findById = (key, id) => {
    const index = store[key].findIndex((item) => item.id === id)

    if (index === -1) {
        throw new AppError('id not found', 404)
    }

    const item = store[key][index]

    return { item, index }
}

addItem('artists', { name: 'Eminem' }) //:TODO remove it later
