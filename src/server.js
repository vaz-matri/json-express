import express from 'express'
import artist from './routes/artist.js'

const port = 3000

const app = express()

app.use(express.json())

app.use('/artists', artist)

app.listen(port, () => {
    console.log(`app listening on port ${port}`)
})
