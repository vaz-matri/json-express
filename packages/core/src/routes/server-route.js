import { Router } from 'express'

const serverRouter = Router()

serverRouter.get('/api/trusted', (req, res) => {
    res.json({
        message: 'Trusted SSL endpoint with JSONExpress !',
        timestamp: new Date().toISOString(),
        ssl: true,
        trusted: true,
        generator: 'devcert'
    })
})

serverRouter.post('/api/trusted-data', (req, res) => {
    const data = req.body

    res.json({
        success: true,
        message: 'Data processed with trusted SSL',
        noWarnings: true,
        data
    })
})

serverRouter.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        ssl: req.secure,
        protocol: req.protocol,
        timestamp: new Date().toISOString()
    })
})

export default serverRouter
