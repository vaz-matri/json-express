import { Router } from 'express'
import passport from 'passport'

const localAuthRoute = new Router()

function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect('/login')
}

localAuthRoute.post('/login-session',
    passport.authenticate('local', {
        successRedirect: '/profile',
        failureRedirect: '/login',
        failureFlash: false // You can enable flash messages for displaying errors
    })
)

localAuthRoute.get('/logout', (req, res) => {
    req.logout(function (err) {
        if (err) { return next(err) }
        res.redirect('/')
    })
})

localAuthRoute.get('/profile', isAuthenticated, (req, res) => {
    res.json({
        success: true,
        user: 'test user'
    })
});

export default localAuthRoute
