const logJsonRoutes = (jsonRoutes) => {
    Object.keys(jsonRoutes).forEach(route => {
        console.log(`Get ${route}:     GET     http://localhost:3000/${route}`) //:TODO change port dynamically
        console.log(`Get one ${route}: GET     http://localhost:3000/${route}/:id`)
        console.log(`Create ${route}:  POST    http://localhost:3000/${route}`) //:TODO think of how to show request body since it's dynamic, ie, suggested by user
        console.log(`Update ${route}:  PATCH   http://localhost:3000/${route}/:id`)
        console.log(`Delete ${route}:  DELETE  http://localhost:3000/${route}/:id`)

        console.log()
    })
}

export default logJsonRoutes
