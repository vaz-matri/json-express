// auth/google-auth.js
import passport from 'passport'
import passportGoogle from 'passport-google-oauth20'
import { getConfig } from '../db/config-store.js'

const GoogleStrategy = passportGoogle.Strategy

// Configure Google OAuth Strategy
const googleOptions = {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback'
}

const authConfig = getConfig('auth')

const isGoogleAuthActive = () => {
    return  !!googleOptions.clientID && !!googleOptions.clientSecret
}

// Initialize Google OAuth Strategy
export const initGoogleAuth = () => {
    if (!isGoogleAuthActive()) return

    passport.use(new GoogleStrategy(googleOptions, (accessToken, refreshToken, profile, done) => {
        const user = {
            id: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName,
            avatar: profile.photos[0].value
        }
        return done(null, user)
    }))
}

// Google OAuth routes
export const googleAuthRoutes = (app) => {
    if (!isGoogleAuthActive()) return

    app.get('/auth/google',
        passport.authenticate('google', { scope: ['profile', 'email'] })
    )

    app.get('/auth/google/callback',
        passport.authenticate('google', { session: false }),
        (req, res) => {
            res.json({
                success: true,
                user: req.user
            })
        }
    )
}
