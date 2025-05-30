import { Router } from 'express'
import { addItem, deleteItem, getAllItems, getItemById, updateItem } from '../services/storage-service.js'
import { validateCreateReq, validateUpdateReq } from '../services/validation-service.js'

const createRoute = (key, config) => {
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
        const { value: createReq, error } = validateCreateReq(config.schema, req.body)

        if (error) {
            return res.status(400).json({ message: error.message })
        }

        try {
            const item = addItem(key, createReq)

            res.status(201).json(item)
        } catch (appError) {
            res.status(appError.statusCode).send({ message: appError.message })
        }
    })

    router.patch('/:id', async (req, res) => {
        const { id } = req.params

        const { value: updateReq, error } = validateUpdateReq(config.schema, req.body)
        if (error) {
            return res.status(400).json({ message: error.message })
        }

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

    return router
}

export default createRoute
