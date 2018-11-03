const express = require('express')
const bodyParser = require('body-parser')

const { shipRouter } = require('./routes')
const app = express()

app.use(bodyParser.json())
app.use(shipRouter)
