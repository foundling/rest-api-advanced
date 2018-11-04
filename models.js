const _ = require('lodash')

class Model {

  constructor({ db, table }) {
    this.db = db
    this.table = table
  }

  create(data = {}) {
    return this.db(this.table)
      .insert(data)
      .returning('ship_id')
      .then(([ship_id, ...rest]) => ship_id) 

  }

  find({ fields = ['*'], query = {}, offset = 0 } = {}) {
    return this.db
      .select(fields)
      .from(this.table)
      .where(query)
  }

  findOne({ fields = ['*'], query = {} } = {}) {
    return this.db
      .select(fields)
      .from(this.table)
      .where(query)
      .then(([first,...rest]) => first)
  }


  delete({ query = {} } = {}) {
    return this.db
      .from(this.table)
      .where(query)
      .del()
  }

}

class Ship extends Model {

  constructor(db, table) {
    super(db, table)
  }

  updateById(id, updates) {

    let invalid = false
    const invalidUpdateMsg = { msg: 'Cannot change Id of resource' } 

    if (updates.ship_id) {
      delete updates.ship_id
      invalid = true
    }

    return this.db(this.table)
      .where({ ship_id: Number(id) })
      .update(updates)
      .then(() => invalid ? invalidUpdateMsg : undefined ) 
  }

}

module.exports = exports = { Model, Ship }
