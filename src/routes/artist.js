import { Router } from 'express'
import { addItem, deleteItem, getAllItems, getItemById, updateItem } from '../services/storage-service.js'

const key = 'artists'

const router = Router()

router.get('/', async (req, res) => {
    const items = getAllItems(key)

    res.json(items)
})

router.get('/:id', async (req, res) => {
    const id = req.params.id

    const item = getItemById(key, id)

    res.json(item)
})

router.post('/', async (req, res) => {
    const createReq = req.body

    try {
        const item = addItem(key, createReq)

        res.status(201).json(item)
    } catch (appError) {
        res.status(appError.statusCode).send({ message: appError.message })
    }
})

router.patch('/:id', async (req, res) => {
    const { id } = req.params
    const updateReq = req.body

    try {
        const item = updateItem(key, id, updateReq)

        res.json(item)
    } catch (appError) {
        res.status(appError.statusCode).send({ message: appError.message })
    }
})

router.delete('/:id', async (req, res) => {
    const { id } = req.params

    try {
        const item = deleteItem(key, id)
        res.json(item)

    } catch (appError) {
        res.status(appError.statusCode).send({ message: appError.message })
    }
})

export default router
