const retry = require('async-retry')
const { Pool } = require('pg')
const axios = require('axios')
const { parseThresholds } = require('../models/parse-thresholds')
// const fs = require('fs')
// const fwis = require('../models/fwis')
// const wreck = require('../helpers/wreck')

module.exports.handler = async (event) => {
  // Get all Stations from Flood DB
  const connectionString = process.env.LFW_DATA_DB_CONNECTION

  const getDBStuff = async () => {
    const pool = new Pool({ connectionString })
    const result = await pool.query('select distinct rloi_id from rivers_mview where rloi_id is not null order by rloi_id asc')
    console.log('Number of stations from database: ', result.rows.length)
    await pool.end()
    return result.rows
  }

  const getData = (stationId) => {
    return new Promise((resolve, reject) => {
      axios
        .get(`https://imfs-prd1-thresholds-api.azurewebsites.net/Location/${stationId}?version=2`)
        .then(res => {
          try {
            const thresholds = parseThresholds(res.data[0].TimeSeriesMetaData)
            // thresholds.forEach(threshold => {
            // const csvString = `${stationId},${threshold.floodWarningArea},${threshold.floodWarningType},${threshold.direction},${threshold.level}\n`
            // fs.appendFile('station-threshold.csv', csvString, (err) => {
            //   if (err) {
            //     console.log('Append file error: ', err)
            //   } else {
            //     // Insert extra logging here if required.
            //   }
            // })
            // })
          } catch (err) {
            console.log(`Error processing station ${stationId} - ${err}`)
          }
          return `Successfully processed station ${stationId}`
        })
        .then((data) => {
          // Insert extra logging here if required.
          resolve(data)
        })
        .catch((err) => {
          console.log(`Station ${stationId} error - ${err}`)
          resolve(`Error processing station ${stationId}. Status is ${err.response.status}`)
        })
    })
  }

  const main = async () => {
    const stations = await getDBStuff()
    console.log('Number of stations: ', stations.length)
    stations.map((station) => console.log('Station: ', station.rloi_id))

    const stationBuffer = []
    let stationIndex = 0

    while (stationIndex < stations.length) {
      // Limit number of concurrent calls to the IMTD api to 50

      for (let j = 0; j < 50; j++) {
        if (stationIndex < stations.length) {
          stationBuffer.push((getData(stations[stationIndex].rloi_id)))
          stationIndex++
        } else {
          break
        }
      }

      await Promise.all(stationBuffer).then(stationData => {
        console.log('stationData: ', stationData)
      })

      stationBuffer.splice(0, stationBuffer.length)

      console.log('stationIndex: ', stationIndex)
    }

    // STAY retry wrapper for client connection
    let pool
    await retry(async () => {
      pool = new Pool({ connectionString: process.env.LFW_DATA_DB_CONNECTION })
      await pool.connect()
    }, {
      retries: 2,
      factor: 2,
      minTimeout: 2000,
      onRetry: async (err, attempt) => {
        try {
          await pool.end()
        } catch (e) {
          console.error(e)
        }
        console.error(`client connect failed (${attempt})`)
        console.error(err)
      }
    })
    // send to DB
    await fwis.save(warnings, timestamp, client)

    // close connection
    await client.end()
  }

  main()
}

// const axios = require('axios')
// const { parseThresholds } = require('./parse-thresholds')

// Connect to database and generate list of station ids

// const { Pool } = require('pg')

// const connectionString = process.env.FLOOD_SERVICE_CONNECTION_STRING

// const getDBStuff = async () => {
//   const pool = new Pool({ connectionString })
//   const result = await pool.query('select distinct rloi_id from rivers_mview where rloi_id is not null order by rloi_id asc')
//   console.log('Number of stations from database: ', result.rows.length)
//   await pool.end()
//   return result.rows
// }

// // End database stuff

// // Create csv header

// const fs = require('fs')

// // console.log('Writing CSV header')
// // const csvHeader = 'station_id,fwis_code,fwis_type,direction,value\n'
// // fs.writeFile('./station-threshold.csv', csvHeader, err => {
// //   if (err) {
// //     console.log(err)
// //   }
// // })

// const getData = (stationId) => {
//   return new Promise((resolve, reject) => {
//     axios
//       .get(`https://imfs-prd1-thresholds-api.azurewebsites.net/Location/${stationId}?version=2`)
//       .then(res => {
//         try {
//           const thresholds = parseThresholds(res.data[0].TimeSeriesMetaData)
//           thresholds.forEach(threshold => {
//             const csvString = `${stationId},${threshold.floodWarningArea},${threshold.floodWarningType},${threshold.direction},${threshold.level}\n`
//             fs.appendFile('station-threshold.csv', csvString, (err) => {
//               if (err) {
//                 console.log('Append file error: ', err)
//               } else {
//                 // Insert extra logging here if required.
//               }
//             })
//           })
//         } catch (err) {
//           console.log(`Error processing station ${stationId} - ${err}`)
//         }
//         return `Successfully processed station ${stationId}`
//       })
//       .then((data) => {
//         // Insert extra logging here if required.
//         resolve(data)
//       })
//       .catch((err) => {
//         console.log(`Station ${stationId} error - ${err}`)
//         resolve(`Error processing station ${stationId}. Status is ${err.response.status}`)
//       })
//   })
// }

// const main = async () => {
//   const stations = await getDBStuff()
//   console.log('Number of stations: ', stations.length)
//   stations.map((station) => console.log('Station: ', station.rloi_id))

//   const stationBuffer = []
//   let stationIndex = 0

//   while (stationIndex < stations.length) {
//     // Limit number of concurrent calls to the IMTD api to 50

//     for (let j = 0; j < 50; j++) {
//       if (stationIndex < stations.length) {
//         stationBuffer.push((getData(stations[stationIndex].rloi_id)))
//         stationIndex++
//       } else {
//         break
//       }
//     }

//     await Promise.all(stationBuffer).then(stationData => {
//       console.log('stationData: ', stationData)
//     })

//     stationBuffer.splice(0, stationBuffer.length)

//     console.log('stationIndex: ', stationIndex)
//   }
// }

// main()
