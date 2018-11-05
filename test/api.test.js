const mocha = require('mocha')
const chai = require('chai')
const { expect } = chai
const request = require('request')
const requestPromise = require('request-promise-native')
const env = process.env.DEV ? 'dev' : 'prod'
const config = {
  dev: {
    baseUrl: 'http://localhost:8080', 
    shipRe: /^http:\/\/localhost:8080\/ships\/\d+$/
  },
  prod: {
    baseUrl: 'https://rest-api-advanced.appspot.com',
    shipRe: /^https:\/\/rest-api-advanced\.appspot\.com\/ships\/\d+$/
  }
}



// /SHIPS
describe('[GET] on /ships', () => {

  it('Should successfully return an array', (done) => {
    requestPromise({
      method: 'GET',
      uri: `${config[env].baseUrl}/ships`,
      resolveWithFullResponse: true,
    })
    .then(({ body, headers }) => {
      expect(JSON.parse(body)).to.be.an('array')
      done()

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

  it('Each ship should have a "self" property comprised of the <request_path>/<ship_id>', (done) => {

    requestPromise({
      method: 'GET',
      uri: `${config[env].baseUrl}/ships`,
      resolveWithFullResponse: true,
    })
    .then(({ body }) => {

      const ships = JSON.parse(body)
      const allSelfLinksAreValid = ships.every(ship => {
        return config[env].shipRe.test(ship.self)
      })

      expect(allSelfLinksAreValid).to.be.true

      done()

    })
  })

}) 

describe('[PUT] on /ships', (done) => {
  it('should fail because put on /ships is invalid', (done) => {
    const payload = {
      name: 'ss bob ii',
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
/*

// SHIPS/ID

describe('[GET] on /ships/{ship_id}', () => {

  it('Should successfully return 200 status', (done) => {

    const shipId = 2

    chai.request(config[env].baseUrl)
      .get(`/ships/${shipId}`)
      .end((err, res) => {
        expect(res.status).to.equal(200)
        done()
      })

  })

  it('Should successfully return an object with name, length, type and self properties', (done) => {

    const shipId = 2

    chai.request(config[env].baseUrl)
      .get(`/ships/${shipId}`)
      .end((err, res) => {

        const ship = res.body

        expect(ship).to.be.an('object')
        expect(ship).to.have.property('name')
        expect(ship).to.have.property('length')
        expect(ship).to.have.property('type')
        expect(ship).to.have.property('self')

        done()

      })
  })

  it('Ship self link should be correct', (done) => {

    const shipId = 2

    chai
      .request(config[env].baseUrl)
      .get(`/ships/${shipId}`)
      .end((err, res) => {

        const ship = res.body
        const shipSelfUrl = ship.self
        const matches = config[env].shipRe.test(shipSelfUrl) 
        expect(matches).to.equal(true)
        done()

      })
  })

})

describe('[PATCH] on /ships/{ship_id}', (done) => {

  it('Should return status 303', (done) => {

    const shipId = 5
    const updates = {
      name: 's.s. update',
      length: 400,
      type: 'updated ship'
    }

    chai
      .request(config[env].baseUrl)
      .patch(`/ships/${shipId}`)
      .end((err, res) => {
        expect(res.status).to.equal(303)
        done()
      })

  })
})

describe('[PATCH] on /ships/{ship_id}', (done) => {
    const shipId = 5
    chai
      .request(config[env].baseUrl)
      .get(`/ships/${shipId}`)
      .end((err, res) => {
        done()
      })
})
describe('[DELETE] on /ships/{ship_id}', (done) => {

    const shipId = 5
    chai
      .request(config[env].baseUrl)
      .get(`/ships/${shipId}`)
      .end((err, res) => {
        done()
      })

})
*/
