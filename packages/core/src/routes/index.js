import createRoute from './create-route.js'
import { addCollection } from '../db/in-memory.js'
import { getConfig } from '../db/config-store.js'
import jwt from 'jsonwebtoken'

const JWT_SECRET = 'secret'

function generateToken(user) {
    const payload = {
        sub: user.id,
        username: user.username,
        email: user.email,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 365) // 1 year
    }

    return jwt.sign(payload, JWT_SECRET)
}

const init = (app, jsonRoutes) => {
    Object.keys(jsonRoutes).forEach(route => {
        addCollection(route, jsonRoutes[route])

        const routeConfig = getConfig(route)

        const router = createRoute(route, routeConfig)

        app.use(`/${route}`, router)
    })

    app.post('/login', (req, res) => {
        const { username, password } = req.body

        const user = {
            id: 'u-0001',
            username,
            email: `${username}@mail.com`
        }

        const token = generateToken(user)

        res.json({ token, user })

        // :TODO
        // 1. any username and password
        // 2. users.json defined with username and password if not fall to step 1
        // 3. username and password defined in config.json

        // output from claude.ai

        // Mock authentication (replace with real authentication)
        // const user = users.find(u => u.username === username)

        // if (user && password === 'password') { // Replace with real password check
        //     const token = generateToken(user)
        //     res.json({
        //         success: true,
        //         token: token,
        //         user: {
        //             id: user.id,
        //             username: user.username,
        //             email: user.email
        //         }
        //     })
        // } else {
        //     res.status(401).json({
        //         success: false,
        //         message: 'Invalid credentials'
        //     })
        // }
    })
}

export default init
