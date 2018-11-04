const Router = require('express').Router
const knex = require('knex')
const { Ship } = require('./models')
const _ = require('lodash')

if (!process.env.SQL_USER) {
  console.log('SOURCE YOUR ENV, DANGUS')
  process.exit(1)
}

function toHTML(ship) {

  const props = Object
    .keys(ship)
    .map(key => `<li>${key}: ${ship[key]}</li>`)
    .join('')

  return `<ul>${props}</ul>`

}

function getMetadata(req, data) {

  const base = `${req.protocol}://${req.get('host')}${req.originalUrl}`
  return Array.isArray(data) ?
    data.map(ship => ({ self: `${ base }/${ ship.ShipId }` })) :
    ({ self: `${ base }` })
    
}

function formatResponse(data, format) {

  switch(format) {
    case 'text/html':        return Array.isArray(data) ? data.map(toHTML).join('') : toHTML(data)
    default:                 return data
  }

}

const shipRouter = Router()
const db = knex({
  debug: true,
  client: 'mysql',
  connection: {
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DATABASE
  }
})

const ship = new Ship({db, table: 'Ship' })

shipRouter.get('/ships', (req, res) => {

  const responseFormat = req.get('Accept')

  return ship
    .find()
    .then(ships => {

      if (!ships)
        return res.sendStatus(404)


      const responseData = ships.map(ship => {
        const metadata = getMetadata(req, ship)
        const shipData = _.merge(ship,metadata)
        return formatResponse(shipData, responseFormat) 
      })

      res.set('Content-Type',responseFormat)
      return res.status(200).send(responseFormat === 'text/html' ? responseData.join('') : responseData)

    })

})

shipRouter.post('/ships', (req, res) => {

  const payload = req.body
  return ship
    .create(payload)
    .then(id => res.status(200).send({ id }) )

})

shipRouter.get('/ships/:ShipId', (req, res) => {

  const { ShipId } = req.params
  const responseFormat = req.get('Accept')

  return ship
    .findOne({ query: { ShipId } })
    .then(data => {

      const metadata = getMetadata(req, data)
      const formattedData = formatResponse(_.merge(data, metadata), responseFormat)
      if (!data)
        return res.sendStatus(404).send('OK')

      res.set('Content-Type', responseFormat)
      return res.status(200).send(responseFormat === 'text/html' ? new Buffer(formattedData) : formattedData)

    })

})


shipRouter.delete('/ships/:ShipId', (req, res) => {
  const { ShipId } = req.params
  return ship
    .delete({ query: { ShipId } })
    .then(affectedRows => {
      if (affectedRows > 0)
        return res.sendStatus(200).send('OK')
      return res.status(400).send({ msg: 'cannot delete ship. resource does not exist.' })
    })
})

shipRouter.patch('/ships/:ShipId', (req, res) => {

  const { ShipId } = req.params
  const updates = req.body

  if (updates.ShipId != null) {
    return res
      .status(400)
      .send({ msg: 'Cannot update id of existing resource' })
  }

  return ship
    .findOne({ query: { ShipId } })
    .then(data => {

      if (!data)
        return res.sendStatus(404)

      return ship
        .updateById(ShipId, updates)
        .then(() => res.sendStatus(200))

    })
})

module.exports = exports = { shipRouter }
