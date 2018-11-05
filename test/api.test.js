const mocha = require('mocha')
const chaiHTTP = require('chai-http')
const chai = require('chai')
const { expect } = chai
const PROD_BASE_URL = 'https://rest-api-advanced.appspot.com'
const TEST_BASE_URL = 'http://localhost:8080'

chai.use(chaiHTTP)

describe('[GET] on /ships', () => {

  it('Should successfully return an array', (done) => {
    chai.request(TEST_BASE_URL)
      .get('/ships')
      .end((err, res) => {

        expect(res.status).to.equal(200)
        expect(res.body).to.be.an('array')
        done()

      })
  })

  it('Each ship should have "ship_id", "name", "type", "length" and "self" properties', (done) => {

    chai.request(TEST_BASE_URL)
      .get('/ships')
      .end((err, res) => {

        const ships = res.body
        const allPropertiesExist = ships.every(ship => ship.ship_id && ship.name && ship.type && ship.length)

        expect(allPropertiesExist).to.be.true
        done()

      })
  })

  it('Each ship should have a "self" property comprised of the <request_path>/<ship_id>', (done) => {

    chai.request(TEST_BASE_URL)
      .get('/ships')
      .end((err, res) => {

        const re = /^https:\/\/rest-api-advanced\.appspot\.com\/ships\/\d+$/
        const ships = res.body
        const allSelfLinksAreValid = ships.every(ship => {
          console.log(ship.self)
          return re.test(ship.self)
        })

        expect(allSelfLinksAreValid).to.be.true

        done()

      })
  })

}) 
