import { initJwtAuth, jwtAuthRoutes, authenticateJWT } from './jwt-auth.js'
import { initSessionAuth, setupSession, sessionAuthRoutes, isAuthenticated } from './session-auth.js'
import { googleAuthRoutes, initGoogleAuth } from './google-auth.js'

const passportAuth = (app) => {
    // Initialize session middleware (must come before passport initialization)
    setupSession(app)

    // Initialize authentication strategies
    initJwtAuth()
    initSessionAuth()
    initGoogleAuth()

    // Setup routes
    jwtAuthRoutes(app)
    sessionAuthRoutes(app)
    googleAuthRoutes(app)
}

// Export the main function and individual middlewares for flexibility
export default passportAuth
