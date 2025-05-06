import { Router } from 'express'
import { addItem, deleteItem, getAllItems, getItemById, updateItem } from '../services/artist.js'

const artistRouter = Router()

const key = 'artists'

artistRouter.get('/', async (req, res) => {
    const artists = getAllItems(key)

    res.json(artists)
})

artistRouter.get('/:id', async (req, res) => {
    const id = req.params.id

    const artist = getItemById(key, id)

    res.json(artist)
})

artistRouter.post('/', async (req, res) => {
    const createReq = req.body

    try {
        const artist = addItem(key, createReq)

        res.status(201).json(artist)
    } catch (appError) {
        res.status(appError.statusCode).send({ message: appError.message })
    }
})

artistRouter.patch('/:id', async (req, res) => {
    const { id } = req.params
    const updateReq = req.body

    try {
        const artist = updateItem(key, id, updateReq)

        res.json(artist)
    } catch (appError) {
        res.status(appError.statusCode).send({ message: appError.message })
    }
})

artistRouter.delete('/:id', async (req, res) => {
    const { id } = req.params

    try {
        const artist = deleteItem(key, id)
        res.json(artist)

    } catch (appError) {
        res.status(appError.statusCode).send({ message: appError.message })
    }
})

export default artistRouter
