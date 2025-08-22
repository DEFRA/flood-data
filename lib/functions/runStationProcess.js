// runStationProcess.js
const { handler } = require('./station-process')
const event = require('../../test/events/station-event.json')

handler(event, {}, (err, result) => {
  if (err) console.error(err)
  else console.log(result)
})
