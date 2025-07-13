import express from 'express'
import passport from 'passport'
import passportJwt from 'passport-jwt'
import passportLocal from 'passport-local'
import cors from 'cors'
import session from 'express-session'
import routes from './routes/index.js'
import jsonRoutes from './services/json-routes-service.js'
import { googleAuthRoutes, initGoogleAuth } from './auth/google-auth.js'
import serverRoute from './routes/server-route.js'
import { preparePortNumber } from './services/port-service.js'
import createServer from './server/index.js'

const JwtStrategy = passportJwt.Strategy
const LocalStrategy = passportLocal.Strategy
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

    await preparePortNumber()

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

    passport.use(new LocalStrategy(
        function (username, password, done) {
            const user = {
                id: 'u-001',
                username: username,
                name: username
            }

            debugger
            return done(null, user)
        }
    ))

    passport.serializeUser(function (user, done) {
        done(null, user.id)
    })

    passport.deserializeUser(function (id, done) {
        // const user = users.find(u => u.id === id)
        const user = {
            id: 'u-001',
            username: 'username',
            name: 'user'
        }

        done(null, user)
    })

    // Initialize Google OAuth
    initGoogleAuth()

    app.use(express.json())
    app.use(cors())
    app.use(session({
        secret: 'secret',
        resave: false,
        saveUninitialized: false
    }))
    app.use(passport.initialize())
    app.use(passport.session())

    // Setup Google OAuth routes
    googleAuthRoutes(app)

    app.use(serverRoute)
    routes(app, jsonRoutes)

    function isAuthenticated(req, res, next) {
        if (req.isAuthenticated()) {
            return next()
        }
        res.redirect('/login')
    }

    app.post('/login-session',
        passport.authenticate('local', {
            successRedirect: '/profile',
            failureRedirect: '/login',
            failureFlash: false // You can enable flash messages for displaying errors
        })
    )

    app.get('/logout', (req, res) => {
        req.logout(function (err) {
            if (err) { return next(err) }
            res.redirect('/')
        })
    })

    app.get('/profile', isAuthenticated, (req, res) => {
        res.json({
            success: true,
            user: 'test user'
        })
    })

    const server = createServer()
    await server(app)

}

export default startServer
