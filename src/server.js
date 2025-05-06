import express from 'express'
import routes from './routes/index.js'

const port = 3000

const app = express()

app.use(express.json())

routes(app)

app.listen(port, () => {
    console.log(`app listening on port ${port}`)
})
