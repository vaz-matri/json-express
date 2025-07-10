import { Router } from 'express'
import passport from 'passport'
import get from 'lodash.get'
import { addItem, deleteItem, getAllItems, getItemById, searchItems, updateItem } from '../services/storage-service.js'
import { validateCreateReq, validateSearchReq, validateUpdateReq } from '../services/validation-service.js'
import { getConfig } from '../db/config-store.js'

// Express middleware to authenticate JWT
const getAuthenticateJWT = (key) => {
    const routeConfig = getConfig('routes')
    const authRoute = get(routeConfig, [key, 'auth'], false)

    return function authenticateJWT(req, res, next) {
        if (!authRoute) {
            return next()
        }

        passport.authenticate('jwt', { session: false }, (err, user, info) => {
            if (err) {
                return res.status(500).json({ error: 'Authentication error' })
            }

            if (!user) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: info ? info.message : 'Invalid token'
                })
            }

            req.user = user
            next()
        })(req, res, next)
    }
}

const createRoute = (key, config = {}) => {
    const router = Router()

    router.get('/', getAuthenticateJWT(key), async (req, res) => {
        const items = getAllItems(key)

        res.json(items)
    })

    router.get('/:id', getAuthenticateJWT(key), async (req, res) => {
        const id = req.params.id

        const item = getItemById(key, id)

        res.json(item)
    })

    router.post('/search', getAuthenticateJWT(key), async (req, res) => {
        const { value: searchReq, error } = validateSearchReq(config.schema, req.body)

        if (error) {
            return res.status(400).json({ message: error.message })
        }

        try {
            const items = searchItems(key, searchReq)

            res.json(items)
        } catch (appError) {
            res.status(appError.statusCode).send({ message: appError.message })
        }
    })

    router.post('/', getAuthenticateJWT(key), async (req, res) => {
        const { value: createReq, error } = validateCreateReq(config.schema, req.body)

        if (error) {
            return res.status(400).json({ message: error.message })
        }

        try {
            const item = addItem(key, createReq)

            res.status(201).json(item)
        } catch (appError) {
            res.status(appError.statusCode).send({ message: appError.message })
        }
    })

    router.patch('/:id', getAuthenticateJWT(key), async (req, res) => {
        const { id } = req.params

        const { value: updateReq, error } = validateUpdateReq(config.schema, req.body)
        if (error) {
            return res.status(400).json({ message: error.message })
        }

        try {
            const item = updateItem(key, id, updateReq)

            res.json(item)
        } catch (appError) {
            res.status(appError.statusCode).send({ message: appError.message })
        }
    })

    router.delete('/:id', getAuthenticateJWT(key), async (req, res) => {
        const { id } = req.params

        try {
            const item = deleteItem(key, id)
            res.json(item)

        } catch (appError) {
            res.status(appError.statusCode).send({ message: appError.message })
        }
    })

    return router
}

export default createRoute
