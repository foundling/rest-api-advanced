const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = process.env.PORT || 8080
const { shipRouter } = require('./routes')

app.use((req, res, next) => {
  console.log(req.method, '-', req.url)
  next()
})
app.use(bodyParser.json())
app.use(shipRouter)

app.listen(port, () => { 
  console.log(`up on port ${port}`)
})
