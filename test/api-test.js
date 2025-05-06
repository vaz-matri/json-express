const baseUrl = 'http://localhost:3000/'

let id = ''

const getAllArtist = async (route) => {
    try {
        const res = await fetch(baseUrl + route)
        const data = await res.json()

        id = data[0]?.id

        console.log(`log get all ${route.replace('/', '')}`, data)
    } catch (e) {
        console.error(`error get all ${route.replace('/', '')}`, e)
    }
}

const getArtistById = async (route) => {
    try {
        const res = await fetch(baseUrl + route + id)
        const data = await res.json()

        console.log(`log get ${route.replace('/', '')} by id`, data)
    } catch (e) {
        console.error(`error get ${route.replace('/', '')} by id`)
    }
}

const createArtist = async (route, body) => {
    try {
        const res = await fetch(baseUrl + route, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
        })
        const data = await res.json()

        console.log(`log create ${route.replace('/', '')}`, data)
    } catch (e) {
        console.error(`error create ${route.replace('/', '')}`)
    }
}

const updateArtist = async (route, body) => {
    try {
        const res = await fetch(baseUrl + route + id, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
        })
        const data = await res.json()

        console.log(`log update ${route.replace('/', '')}`, data)
    } catch (e) {
        console.error(`error update ${route.replace('/', '')}`)
    }
}

const deleteArtist = async (route) => {
    try {
        const res = await fetch(baseUrl + route + id, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        const data = await res.json()

        console.log(`log delete ${route.replace('/', '')}`, data)
    } catch (e) {
        console.error(`error delete ${route.replace('/', '')}`)
    }
}

const testRoute = async ({ route, createReq = {}, updateReq = {} }) => {
    console.log(`---------${route.replace('/', '')}---------`)

    await createArtist(route, createReq)
    await getAllArtist(route)
    await getArtistById(route)
    await updateArtist(route, updateReq)
    await getAllArtist(route)
    await deleteArtist(route)
    await getAllArtist(route)

    console.log()
    console.log()
}

const main = async () => {
    const routes = {
        artists: {
            route: 'artists/',
            createReq: { name: 'Drake' },
            updateReq: { name: 'Marshall Bruce Mathers III' }
        },
        albums: {
            route: 'albums/',
            createReq: { name: 'The Marshall Mathers LP' },
            updateReq: { name: 'Encore' }
        }
    }

    for (const route of Object.values(routes)) {
        await testRoute(route)
    }
}

await main()
