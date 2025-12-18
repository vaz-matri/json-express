import AppError from '../utils/app-error.js'
import store from '../db/in-memory.js'
import { getRefs } from '../utils/obj-utils.js'

export const getAllItems = (key) => {
    const items = store[key]

    items.map(item => {
        const refs = getRefs(item)

        const refFields = Object.keys(refs)
        refFields.forEach(refField => {

            const refObjArr = []
            refs[refField].forEach(({ id: refId, ref }) => {
                // const { id: refId, ref } = refs[refField]

                const refItems = store[ref]

                const refObj = refItems.find(item => item.id === refId)
                refObjArr.push(refObj)
            })
            // console.log('log refs', refs[refField])
            // const refs
            //     const { id: refId, ref } = refs[refField]
            //
            //     const refItems = store[ref]
            //
            // item[refField] = refItems.find(item => item.id === refId)
            item[refField] = refObjArr
        })

        return item
    })

    return items
}

export const getItemById = (key, id) => {
    const { item } = findById(key, id)

    return item
}

export const searchItems = (key, searchReq) => {
    return store[key].filter((item) => {
        return Object.keys(searchReq).every(searchKey => {
            const searchValue = searchReq[searchKey]

            return searchValue === item[searchKey]
        })
    })
}

export const addItem = (key, createReq) => {
    const item = { id: `${Date.now()}`, ...createReq }
    store[key].push(item)

    return item
}

export const updateItem = (key, id, updateReq) => {
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

const findById = (key, id) => {
    const index = store[key].findIndex((item) => item.id === id)

    if (index === -1) {
        throw new AppError('id not found', 404)
    }

    const item = store[key][index]

    return { item, index }
}
