import { Router } from 'express'

const artistRouter = Router()

const createArtist = (name) => {
    return { id: `${Date.now()}`, name }
}

const artists = [
    createArtist('Eminem')
]

artistRouter.get('/', async (req, res) => {
    res.json(artists)
})

artistRouter.get('/:id', async (req, res) => {
    debugger
    const id = req.params.id

    const artist = artists.find(artist => artist.id === id)
    if (!artist) {
        return res.status(404).send({ message: 'Artist not found' })
    }

    res.json(artist)
})

artistRouter.post('/', async (req, res) => {
    const { name } = req.body

    if (!name) {
        return res.status(400).send({ message: 'Name is required' })
    }

    const artist = createArtist(name)
    artists.push(artist)

    res.json(artist)
})

artistRouter.patch('/:id', async (req, res) => {
    const { id } = req.params
    const { name } = req.body

    if (!name) {
        return res.status(400).send({ message: 'Name is required' })
    }

    const artistIndex = artists.findIndex(artist => artist.id === id)
    if (artistIndex === -1) {
        return res.status(404).send({ message: 'Artist not found' })
    }

    const artist = artists[artistIndex]
    artist.name = name

    artists[artistIndex] = artist

    res.json(artist)
})

artistRouter.delete('/:id', async (req, res) => {
    const { id } = req.params

    const artistIndex = artists.findIndex(artist => artist.id === id)
    if (artistIndex === -1) {
        return res.status(404).send({ message: 'Artist not found' })
    }

    const artist = artists[artistIndex]

    artists.splice(artistIndex, 1)

    res.json(artist)
})

export default artistRouter
