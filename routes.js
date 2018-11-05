const Router = require('express').Router
const knex = require('knex')
const _ = require('lodash')

const { Ship } = require('./models')
const { formatResponse, getMetadata, toHTML } = require('./utils')

if (!process.env.SQL_USER) {
  console.log('SOURCE YOUR ENV!')
  process.exit(1)
}

const config = {
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  database: process.env.SQL_DATABASE
}

if (process.env.INSTANCE_CONNECTION_NAME && process.env.NODE_ENV === 'production') {
  config.host = `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`;
}

const shipRouter = Router()
const db = knex({
  client: 'pg',
  connection: config 
})

const ship = new Ship({ db, table: 'ship' })

shipRouter.get('/ships', (req, res) => {

  return ship
    .find()
    .then(ships => {

      if (!ships)
        return res.sendStatus(404)

      const shipsMeta = getMetadata(req, ships)
      const shipData = shipsMeta.map((metadata, index) => {
        return _.merge(metadata, ships[index])  
      })

      return res.status(200).send(shipData)

    })

})

shipRouter.post('/ships', (req, res) => {

  const payload = req.body
  return ship
    .create(payload)
    .then(id => res.status(201).send({ id }) )

})

shipRouter.put('/ships', (req, res) => {
  res.sendStatus(405)
})

shipRouter.delete('/ships', (req, res) => {
  res.sendStatus(405)
})

shipRouter.get('/ships/:ship_id', (req, res) => {

  const { ship_id } = req.params
  const responseFormat = req.get('Accept')

  return ship
    .findOne({ query: { ship_id } })
    .then(data => {

      if (!data)
        return res.sendStatus(404)

      if (['text/html','application/json'].includes(responseFormat))
        res.contentType(responseFormat)

      const metadata = getMetadata(req, data)
      const formattedData = formatResponse(_.merge(data, metadata), responseFormat)

      return res
        .status(200)
        .send(responseFormat === 'text/html' ? Buffer.from(formattedData) : formattedData)

    })

})

shipRouter.put('/ships/:ship_id', (req, res) => {

  const { ship_id } = req.params
  const updates = req.body

  return ship
    .findOne({ query: { ship_id } })
    .then(data => {
      return ship
        .updateById(ship_id, updates)
        .then(() => {
          const location = req.secure ? `https://${req.get('host')}${req.path}` : `${req.protocol}://${req.get('host')}${req.path}` 
          res.location(location)
          console.log(res.get('location'))
          res.sendStatus(303)
        }) // redirect to updated ship resource

    })

})

shipRouter.patch('/ships/:ship_id', (req, res) => {

  const { ship_id } = req.params
  const updates = req.body

  if (updates.ship_id != null) {
    return res
      .status(400)
      .send({ msg: 'Cannot update id of existing resource' })
  }

  return ship
    .findOne({ query: { ship_id } })
    .then(data => {

      if (!data)
        return res.sendStatus(404)

      return ship
        .updateById(ship_id, updates)
        .then(() => {
          const location = req.secure ? `https://${req.get('host')}${req.path}` : `${req.protocol}://${req.get('host')}${req.path}` 
          res.location(location)
          console.log(res.get('location'))
          res.sendStatus(303)
        })

    })
})

shipRouter.delete('/ships/:ship_id', (req, res) => {
  const { ship_id } = req.params
  return ship
    .delete({ query: { ship_id } })
    .then(affectedRows => {
      if (affectedRows > 0)
        return res.sendStatus(204)
      return res.status(404).send({ msg: 'Resource not found.' })
    })
})

module.exports = exports = { shipRouter }
