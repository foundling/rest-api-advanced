const express = require('express')
const bodyParser = require('body-parser')
const port = process.env.PORT || 8080

const { shipRouter } = require('./routes')
const app = express()

app.use(bodyParser.json())
app.use(shipRouter)
app.listen(port, () => { console.log(`up on port ${port}`) })
