function getMetadata(req, data) {

  // on GAE, the protocol shows up as http, not https for some reason                                                                                                          
  // which is why i'm hard coding https
  const protocol = req.secure ? 'http' : 'http'
  const base = `${protocol}://${req.get('host')}${req.originalUrl}`
  return Array.isArray(data) ?
    data.map(ship => ({ self: `${ base }/${ ship.ship_id }` })) :
    ({ self: `${ base }` })
    
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
