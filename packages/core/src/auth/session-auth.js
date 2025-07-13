import passport from 'passport'
import passportLocal from 'passport-local'
import session from 'express-session'

const LocalStrategy = passportLocal.Strategy

// Initialize Local Strategy and serialization
export const initSessionAuth = () => {
    passport.use(new LocalStrategy(
        function (username, password, done) {
            const user = {
                id: 'u-001',
                username: username,
                name: username
            }

            // Add your user validation logic here
            // For now, using the same mock authentication
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
}

// Session middleware setup
export const setupSession = (app) => {
    app.use(session({
        secret: process.env.SESSION_SECRET || 'secret',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        }
    }))

    app.use(passport.initialize())
    app.use(passport.session())
}

// Session authentication middleware
export const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect('/login')
}

// Session Routes
export const sessionAuthRoutes = (app) => {
    // Session-based login
    app.post('/login-session', (req, res, next) => {
        passport.authenticate('local', (err, user, info) => {
            if (err) {
                return next(err)
            }

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication failed'
                })
            }

            req.logIn(user, (err) => {
                if (err) {
                    return next(err)
                }

                // Send user data back instead of redirecting
                return res.json({
                    success: true,
                    message: 'Login successful',
                    user: {
                        id: user.id,
                        username: user.username,
                        name: user.name
                    }
                })
            })
        })(req, res, next)
    })

    // Logout route
    app.get('/logout', (req, res, next) => {
        req.logout(function (err) {
            if (err) { return next(err) }
            res.redirect('/')
        })
    })

    // Protected session route
    app.get('/profile', isAuthenticated, (req, res) => {
        res.json({
            success: true,
            user: req.user
        })
    })
}
