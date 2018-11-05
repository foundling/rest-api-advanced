function getMetadata(req, data) {

  const base = `${req.protocol}://${req.get('host')}${req.originalUrl}`
  return Array.isArray(data) ?
    data.map(ship => ({ self: `${ base }/${ ship.ship_id }` })) :
    ({ self: `${ base }/${ data.ship_id }` })
    
}

function toHTML(ship) {

  const props = Object
    .keys(ship)
    .map(key => `<li>${key}: ${ship[key]}</li>`)
    .join('')

  return `<ul>${props}</ul>`

}
function formatResponse(data, format) {

  switch(format) {
    case 'text/html':        return Array.isArray(data) ? data.map(toHTML).join('') : toHTML(data)
    default:                 return data
  }

}
module.exports = exports = { toHTML, getMetadata, formatResponse }
