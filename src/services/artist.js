import AppError from '../utils/app-error.js'

const artists = [] // { id, name }

export const getAllArtists = () => {
    return artists
}

export const getArtistById = (id) => {
    const { artist } = findById(id)

    return artist
}

export const addArtist = (createReq) => {
    const { name } = validateReq(createReq)

    const artist = { id: `${Date.now()}`, name }
    artists.push(artist)

    return artist
}

export const updateArtist = (id, updateReq) => {
    const { name } = validateReq(updateReq)

    const { artist, artistIndex } = findById(id)

    artist.name = name

    artists[artistIndex] = artist

    return artist
}

export const deleteArtist = (id) => {
    const { artist, artistIndex } = findById(id)

    artists.splice(artistIndex, 1)

    return artist
}

const validateReq = (dtoReq) => {
    const { name } = dtoReq

    if (!name) {
        throw new AppError('name is required', 400)
    }

    return { name }
}

const findById = (id) => {
    const artistIndex = artists.findIndex((artist) => artist.id === id)

    if (artistIndex === -1) {
        throw new AppError('id not found', 404)
    }

    const artist = artists[artistIndex]

    return { artist, artistIndex }
}

addArtist({ name: 'Eminem' }) //:TODO remove it later
