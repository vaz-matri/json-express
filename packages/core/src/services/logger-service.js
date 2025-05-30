const logJsonRoutes = (jsonRoutes, port) => {
    Object.keys(jsonRoutes).forEach(route => {
        console.log(`Get ${route}:     GET     http://localhost:${port}/${route}`)
        console.log(`Get one ${route}: GET     http://localhost:${port}/${route}/:id`)
        console.log(`Search ${route}:  POST    http://localhost:${port}/${route}`)
        console.log(`Create ${route}:  POST    http://localhost:${port}/${route}`) //:TODO think of how to show request body since it's dynamic, ie, suggested by user
        console.log(`Update ${route}:  PATCH   http://localhost:${port}/${route}/:id`)
        console.log(`Delete ${route}:  DELETE  http://localhost:${port}/${route}/:id`)

        console.log()
    })
}

export default logJsonRoutes
