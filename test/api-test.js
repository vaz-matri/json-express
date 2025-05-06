const baseUrl = 'http://localhost:3000/'

let id = ''

const getAllRoute = async (route) => {
    try {
        const res = await fetch(baseUrl + route)
        const data = await res.json()

        id = data[0]?.id

        console.log(`log get all ${route.replace('/', '')}`, data)
    } catch (e) {
        console.error(`error get all ${route.replace('/', '')}`, e)
    }
}

const getByIdRoute = async (route) => {
    try {
        const res = await fetch(baseUrl + route + id)
        const data = await res.json()

        console.log(`log get ${route.replace('/', '')} by id`, data)
    } catch (e) {
        console.error(`error get ${route.replace('/', '')} by id`)
    }
}

const createRoute = async (route, body) => {
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

const updateRoute = async (route, body) => {
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

const deleteRoute = async (route) => {
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

    await createRoute(route, createReq)
    await getAllRoute(route)
    await getByIdRoute(route)
    await updateRoute(route, updateReq)
    await deleteRoute(route)
    await getAllRoute(route)

    console.log()
    console.log()
}

const main = async () => {
    const routes = {
        artists: {
            route: 'artists/',
            createReq: { name: 'Eminem', dob: '17-10-1972' },
            updateReq: { name: 'Marshall Bruce Mathers III' }
        },
        albums: {
            route: 'albums/',
            createReq: { name: 'The Marshall Mathers LP', releaseDate: '23-05-2000' },
            updateReq: { name: 'Encore', releaseDate: '12-11-2004' }
        }
    }

    for (const route of Object.values(routes)) {
        await testRoute(route)
    }
}

await main()
