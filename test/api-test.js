const baseUrl = 'http://localhost:3000/artists/'

let id = ''

const getAllArtist = async () => {
    try {
        const res = await fetch(baseUrl)
        const data = await res.json()

        id = data[0].id

        console.log('log get all artists', data)
    } catch (e) {
        console.error('error get all artists')
    }
}

const getArtistById = async () => {
    try {
        const res = await fetch(baseUrl + id)
        const data = await res.json()

        console.log('log get artist by id', data)
    } catch (e) {
        console.error('error get artist by id')
    }
}

const createArtist = async () => {
    try {
        const res = await fetch(baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: 'Drake'
            })
        })
        const data = await res.json()

        console.log('log create artist', data)
    } catch (e) {
        console.error('error create artist')
    }
}

const updateArtist = async () => {
    try {
        const res = await fetch(baseUrl + id, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: 'Marshall Bruce Mathers III'
            })
        })
        const data = await res.json()

        console.log('log update artist', data)
    } catch (e) {
        console.error('error update artist')
    }
}

const deleteArtist = async () => {
    try {
        const res = await fetch(baseUrl + id, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        const data = await res.json()

        console.log('log delete artist', data)
    } catch (e) {
        console.error('error delete artist')
    }
}

const main = async () => {
    await getAllArtist()
    await getArtistById()
    await createArtist()
    await updateArtist()
    await getAllArtist()
    await deleteArtist()
    await getAllArtist()
}

await main()
