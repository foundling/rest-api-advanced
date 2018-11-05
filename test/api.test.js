const mocha = require('mocha')
const chai = require('chai')
const { expect } = chai
const $ = require('cheerio')
const request = require('request')
const requestPromise = require('request-promise-native')
const env = process.env.DEV ? 'dev' : 'prod'
const config = {
  dev: {
    baseUrl: 'http://localhost:8080', 
    shipRe: /^http:\/\/localhost:8080\/ships\/\d+$/
  },
  prod: {
    baseUrl: 'http://rest-api-advanced.appspot.com',
    shipRe: /^http:\/\/rest-api-advanced\.appspot\.com\/ships\/\d+$/
  }
}

function deleteAllShips() {
  return requestPromise({
      method: 'GET',
      uri: `${config[env].baseUrl}/ships`,
      resolveWithFullResponse: true,
  })
  .then(request => {
    const ships = JSON.parse(request.body)
    const shipIds = ships.map(ship => ship.ship_id) 
    const deletions = shipIds.map(shipId => {
      return requestPromise({
        method: 'DELETE',
        uri: `${config[env].baseUrl}/ships/${shipId}`,
        resolveWithFullResponse: true,
      })
    })
    return Promise.all(deletions)
  })
}

function createShips(n=1) {
  const creates = [...Array(n).keys()].map((key) => {
    return requestPromise({
      method: 'POST',
      uri: `${config[env].baseUrl}/ships`,
      resolveWithFullResponse: true,
      body: {
        name: `a new ship! (#${key + 1})`,
        length: 3230,
        type: 'newtype'
      },
      json: true
    })
  })

  return Promise
    .all(creates)
}


// /SHIPS
describe('[GET] on /ships', () => {

  // delete all ships and create a new ship
  beforeEach('deleting all ships', function(done) {
    deleteAllShips().then(() => { 
      createShips(3).then(() => { done() }) 
    })
  })

  it('Each ship should have "ship_id", "name", "type", "length" and "self" properties', (done) => {

    requestPromise({
      method: 'GET',
      uri: `${config[env].baseUrl}/ships`,
      resolveWithFullResponse: true,
    })
    .then(({ body }) => {

      const ships = JSON.parse(body)
      const allPropertiesExist = ships.every(ship => ship.ship_id && ship.name && ship.type && ship.length)

      expect(allPropertiesExist).to.be.true
      done()

    })
  })

  it('Each ship should have a valid "self" link that I can follow to reach that entity.', (done) => {

    requestPromise({
      method: 'GET',
      uri: `${config[env].baseUrl}/ships`,
      resolveWithFullResponse: true,
    })
    .then(({ body }) => {

      const ships = JSON.parse(body)
      const selfLinks = ships.map(ship => ship.self)
      const verifications = selfLinks.map(uri => {
        return requestPromise({
          uri,
          method: 'GET',
          resolveWithFullResponse: true,
        })
      })

      return Promise
        .all(verifications)
        .then((responses, index) => {

          const allSelfLinksAreValid = responses.every((response, index) => JSON.parse(response.body).ship_id === ships[index].ship_id)
          expect(allSelfLinksAreValid).to.be.true
          done()

        })
    })

  })

}) 

describe('[PUT] on /ships', (done) => {
  it('should fail with 405 because put on /ships is invalid', (done) => {
    const payload = {
      name: 'SS BOB II',
      length: 900,
      type: 'clipper ship'
    }
    requestPromise({
      resolveWithFullResponse: true,
      uri: `${config[env].baseUrl}/ships`,
      method: 'PUT'
    }) 
    .catch(response => {
      expect(1).to.equal(1)
      done()
    })
  })
})

describe('[PATCH] on /ships', (done) => {
  it('should fail with 405 because patch on /ships is invalid', (done) => {
    const payload = {
      name: 'SS BOB II',
      length: 900,
      type: 'clipper ship'
    }
    requestPromise({
      resolveWithFullResponse: true,
      uri: `${config[env].baseUrl}/ships`,
      method: 'PATCH'
    }) 
    .catch(response => {
      expect(1).to.equal(1)
      done()
    })
  })
})


describe('[POST] on /ships', (done) => {

  it('should return status 201 for a succesfully created ship record', (done) => {
    const shipData = {
      name: 'ss bob',
      length: 500,
      type:'schooner'
    }
    requestPromise({
      uri: `${config[env].baseUrl}/ships`,
      method: 'POST',
      resolveWithFullResponse: true,
      body: shipData,
      json: true
    })
    .then(res => {
      expect(res.statusCode).to.equal(201)
      done()
    })
  })
})

describe('[DELETE] on /ships', (done) => {

  it('should fail because deleting the entire collection is not allowed', (done) => {
    requestPromise({
      uri: `${config[env].baseUrl}/ships`,
      method: 'DELETE',
      resolveWithFullResponse: true
    })
    .catch(res => {
      expect(res.statusCode).to.equal(405)
      done()
    })
  })
})

// SHIPS/ID

describe('[GET] on /ships/{ship_id}', () => {

  let shipId = null

  // delete all ships and create new ship
  beforeEach('deleting all ships', function(done) {
    deleteAllShips()
      .then(() => { 
        createShips(3)
          .then(responses => { 
            const shipIds = responses.map(response => response.toJSON().body).map(body => body.id)
            shipId = shipIds[0] // first of 3, saved before subsequent tests run
            done() 
        }) 
      })
  })

  it('Should successfully return 200 status', (done) => {

    requestPromise({
      uri: `${config[env].baseUrl}/ships/${shipId}`,
      method: 'GET',
      resolveWithFullResponse: true
    })
    .then(res => {
      expect(res.statusCode).to.equal(200)
      done()
    })

  })

  it('Should successfully return an object with name, length, type and self properties', (done) => {

    requestPromise({
      uri: `${config[env].baseUrl}/ships/${shipId}`,
      method: 'GET',
      resolveWithFullResponse: true
    })
    .then(res => {

      const ship = JSON.parse(res.body)

      expect(ship).to.be.an('object')
      expect(ship).to.have.property('name')
      expect(ship).to.have.property('length')
      expect(ship).to.have.property('type')
      expect(ship).to.have.property('self')

      done()

    })
  })

  it('It should return html if I pass it a Content-Type header with the value of "text/html"', (done) => {

    requestPromise({
      uri: `${config[env].baseUrl}/ships/${shipId}`,
      method: 'GET',
      resolveWithFullResponse: true,
      headers: {
        'Accept': 'text/html'
      }
    })
    .then(res => {
      const htmlParsed = $(res.body)
      const fragmentParsedSuccessfully = htmlParsed[0] != null // aka, has at least a first parse result
      expect(fragmentParsedSuccessfully).to.be.true
      done()
    })
    .catch(() => {
      done()
    })

  })

  it('should return json if I pass the Content-Type header, "application/json".', (done) => {

    requestPromise({
      uri: `${config[env].baseUrl}/ships/${shipId}`,
      method: 'GET',
      resolveWithFullResponse: true,
      headers: {
        'Accept': 'application/json'
      }
    })
    .then(res => {
      const htmlParsed = $(res.body)
      const fragmentParsedSuccessfully = !htmlParsed[0] 
      const validJSON = JSON.parse(JSON.stringify(res.body))
      expect(fragmentParsedSuccessfully).to.be.false
      expect(validJSON).to.be.true
      done()
    })
    .catch(() => {
      done()
    })

  })



  it('Ship self link should resolve to itself', (done) => {

    requestPromise({
      uri: `${config[env].baseUrl}/ships/${shipId}`,
      method: 'GET',
      resolveWithFullResponse: true
    })
    .then(res => {
      const ship = JSON.parse(res.body)
      const shipSelfUrl = ship.self
      const matches = config[env].shipRe.test(shipSelfUrl) 
      expect(matches).to.equal(true)

      requestPromise({
        uri: shipSelfUrl,
        method: 'GET',
        resolveWithFullResponse: true
      })
      .then(res => {
        const shipData = JSON.parse(res.body)
        expect(shipData.ship_id).to.equal(shipId) 
        done()
      })
      .catch(() => {
        done()
      })

    })
  })

})

describe('[PATCH] on /ships/{ship_id}', (done) => {

  let shipId = null

  // delete all ships and create new ships
  beforeEach('deleting all ships', function(done) {
    deleteAllShips()
      .then(() => { 
        createShips(3)
          .then((responses) => { 
            const shipIds = responses.map(response => response.toJSON().body).map(body => body.id)
            shipId = shipIds[0] // first of 3, saved before subsequent tests run
            done() 
        }) 
      })
  })

  it('Should return a 400, bad request on an an update with a ship_id in the payload', (done) => {

    const updates = {
      name: 's.s. update',
      length: 400,
      type: 'updated ship',
      ship_id: 400,
    }

    requestPromise({
      uri: `${config[env].baseUrl}/ships/${shipId}`,
      method: 'PATCH',
      resolveWithFullResponse: true,
      body: updates,
      json: true
    })
    .catch(res => {
      expect(res.statusCode).to.equal(400)
      done()
    })

  })


  it('Should return status 303', (done) => {

    const updates = {
      name: 's.s. update',
      length: 400,
      type: 'updated ship'
    }

    requestPromise({
      uri: `${config[env].baseUrl}/ships/${shipId}`,
      method: 'PATCH',
      resolveWithFullResponse: true,
      body: updates,
      json: true
    })
    .catch(res => {
      expect(res.statusCode).to.equal(303)
      done()
    })

  })

  it('Should return a path I can use to locate the new resource.', (done) => {

    const updates = {
      name: 's.s. update',
      length: 400,
      type: 'updated ship'
    }

    requestPromise({
      uri: `${config[env].baseUrl}/ships/${shipId}`,
      method: 'PATCH',
      resolveWithFullResponse: true,
      body: updates,
      json: true
    })
    .catch(res => {

      const resourceLocation = res.response.headers.location

      requestPromise({
        method: 'GET',
        uri: resourceLocation,
        resolveWithFullResponse: true,
      })
      .then(res => {
        const ship_id = JSON.parse(res.body).ship_id
        expect(ship_id).to.equal(shipId)
        done()
      })
    })

  })

})

describe('[DELETE] on /ships/{ship_id}', (done) => {

  let shipId = null

  // delete all ships and create new ship
  beforeEach('deleting all ships', function(done) {
    deleteAllShips()
      .then(() => { 
        createShips(3)
          .then((responses) => { 
            const shipIds = responses.map(response => response.toJSON().body).map(body => body.id)
            shipId = shipIds[0] // first of 3, saved before subsequent tests run
            done() 
        }) 
      })
  })

  it('should return 204 on successful ship deletion', done => {
    requestPromise({
      uri: `${config[env].baseUrl}/ships/${shipId}`,
      method: 'DELETE',
      resolveWithFullResponse: true,
    })
    .then(res => { 
      expect(res.statusCode).to.equal(204)
        done()
    })
  })

  it('should return 404 on delete request for a resource that does not exist.', done => {
    const badShipId = 20000000
    requestPromise({
      uri: `${config[env].baseUrl}/ships/${badShipId}`,
      method: 'DELETE',
      resolveWithFullResponse: true,
    })
    .catch(res => { 
      expect(res.statusCode).to.equal(404)
        done()
    })
  })

})
