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

    const artist = addArtist(createReq) //:TODO handle error

    res.status(201).json(artist)
})

artistRouter.patch('/:id', async (req, res) => {
    const { id } = req.params
    const updateReq = req.body

    const artist = updateArtist(id, updateReq) //:TODO handle error

    res.json(artist)
})

artistRouter.delete('/:id', async (req, res) => {
    const { id } = req.params

    const artist = deleteArtist(id) //:TODO handle error

    res.json(artist)
})

export default artistRouter
