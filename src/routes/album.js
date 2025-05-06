import { Router } from 'express'
import { addItem, deleteItem, getAllItems, getItemById, updateItem } from '../services/storage-service.js'

const albumRouter = Router()

const key = 'albums'

albumRouter.get('/', async (req, res) => {
    const artists = getAllItems(key)

    res.json(artists)
})

albumRouter.get('/:id', async (req, res) => {
    const id = req.params.id

    const artist = getItemById(key, id)

    res.json(artist)
})

albumRouter.post('/', async (req, res) => {
    const createReq = req.body

    try {
        const artist = addItem(key, createReq)

        res.status(201).json(artist)
    } catch (appError) {
        res.status(appError.statusCode).send({ message: appError.message })
    }
})

albumRouter.patch('/:id', async (req, res) => {
    const { id } = req.params
    const updateReq = req.body

    try {
        const artist = updateItem(key, id, updateReq)

        res.json(artist)
    } catch (appError) {
        res.status(appError.statusCode).send({ message: appError.message })
    }
})

albumRouter.delete('/:id', async (req, res) => {
    const { id } = req.params

    try {
        const artist = deleteItem(key, id)
        res.json(artist)

    } catch (appError) {
        res.status(appError.statusCode).send({ message: appError.message })
    }
})

export default albumRouter
