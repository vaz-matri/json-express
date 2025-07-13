import passport from 'passport'
import passportJwt from 'passport-jwt'
import jwt from 'jsonwebtoken'

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

// Initialize JWT Strategy
export const initJwtAuth = () => {
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
}

// JWT Authentication middleware
export const authenticateJWT = passport.authenticate('jwt', { session: false })

// Helper function to generate JWT token
export const generateToken = (user) => {
    return jwt.sign(user, JWT_SECRET, { expiresIn: '1h' })
}

// JWT Routes
export const jwtAuthRoutes = (app) => {
    // JWT Login endpoint
    app.post('/login-jwt', (req, res) => {
        const { username, password } = req.body

        // Add your authentication logic here
        // For now, using the same mock user as in original code
        const user = {
            id: 'u-001',
            username: username,
            name: username
        }

        // Generate JWT token
        const token = generateToken(user)

        res.json({
            success: true,
            token: token,
            user: user
        })
    })

    // Protected JWT route example
    app.get('/profile-jwt', authenticateJWT, (req, res) => {
        res.json({
            success: true,
            user: req.user
        })
    })
}
