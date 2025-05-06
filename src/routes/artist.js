import { Router } from 'express'
import { addArtist, deleteArtist, getAllArtists, getArtistById, updateArtist } from '../services/artist.js'

const artistRouter = Router()

artistRouter.get('/', async (req, res) => {
    const artists = getAllArtists()

    res.json(artists)
})

artistRouter.get('/:id', async (req, res) => {
    const id = req.params.id

    const artist = getArtistById(id)

    res.json(artist)
})

artistRouter.post('/', async (req, res) => {
    const createReq = req.body

    try {
        const artist = addArtist(createReq)

        res.status(201).json(artist)
    } catch (appError) {
        res.status(appError.statusCode).send({ message: appError.message })
    }
})

artistRouter.patch('/:id', async (req, res) => {
    const { id } = req.params
    const updateReq = req.body

    try {
        const artist = updateArtist(id, updateReq)

        res.json(artist)
    } catch (appError) {
        res.status(appError.statusCode).send({ message: appError.message })
    }
})

artistRouter.delete('/:id', async (req, res) => {
    const { id } = req.params
    try {
        const artist = deleteArtist(id)
        res.json(artist)

    } catch (appError) {
        res.status(appError.statusCode).send({ message: appError.message })
    }
})

export default artistRouter
