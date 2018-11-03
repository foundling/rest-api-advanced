const Router = require('express').Router
const knex = require('knex')

const config = require('./config')
const shipRouter = Router()
const ShipModel = require('./models')
const db = knex({
  client: 'mysql',
  debug: true,
  connection: process.env.TEST ? config.test : config.prod
})

const ship = new ShipModel(db, 'Ship')

shipRouter.get('/ships', (req, res) => {
})

shipRouter.post('/ships/:ShipId', (req, res) => {
})

shipRouter.delete('/ships/:ShipId', (req, res) => {
})

shipRouter.patch('/ships/:ShipId', (req, res) => {
})

module.exports = exports = { shipRouter }
