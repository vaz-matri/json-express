import express from 'express'
import passport from 'passport'
import passportJwt from 'passport-jwt'
import cors from 'cors'
import getPort from 'get-port'
import routes from './routes/index.js'
import jsonRoutes from './services/json-routes-service.js'
import logJsonRoutes from './services/logger-service.js'
import { getConfig } from './db/config-store.js'
import { initGoogleAuth, googleAuthRoutes } from './auth/google-auth.js'

const JwtStrategy = passportJwt.Strategy
const ExtractJwt = passportJwt.ExtractJwt

// JWT Secret (use environment variable in production)
const JWT_SECRET = process.env.JWT_SECRET || 'secret'

// Configure JWT Strategy
const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: JWT_SECRET,
    // Optional: specify issuer and audience
    // issuer: 'your-app-name',
    // audience: 'your-audience'
}

const startServer = async () => {
    const app = express()

    passport.use(new JwtStrategy(jwtOptions, async (payload, done) => {
        try {
            const { iat, exp, ...user } = payload

            return done(null, user)

            // Find user by ID from JWT payload
            // const user = users.find(u => u.id === payload.sub)
            //
            // if (user) {
            //     return done(null, user)
            // } else {
            //     return done(null, false)
            // }
        } catch (error) {
            return done(error, false)
        }
    }))

    // Initialize Google OAuth
    initGoogleAuth()

    app.use(express.json())
    app.use(cors())
    app.use(passport.initialize())

    // Setup Google OAuth routes
    googleAuthRoutes(app)

    routes(app, jsonRoutes)

    let configPort = getConfig('port')
    const portSequence = Array.from({ length: 100 }, (_, i) => configPort + i)
    const port = await getPort({ port: portSequence })

    app.listen(port, () => {
        console.log()
        if (port !== configPort) {
            console.log(`⚠️  Port ${configPort} was busy, using ${port} instead`)
        }
        console.log(`🚀 Server running on port ${port}`)
        console.log()

        logJsonRoutes(jsonRoutes, port)
    })
}

export default startServer
