const { parseThresholds } = require('../models/parse-thresholds')
const { Pool } = require('pg')
const axios = require('axios')
const pool = new Pool({ connectionString: process.env.LFW_DATA_DB_CONNECTION })
const s3 = require('../helpers/s3')
const queries = require('../queries')

let fileName

module.exports.handler = async (event) => {
  // get file from S3
  const data = await getFile(0)
  const stations = JSON.parse((data.Body))

  let processIds
  let remainingIds

  const MAX_LENGTH = 50

  if (stations.length > MAX_LENGTH) {
    processIds = stations.slice(0, MAX_LENGTH)
    remainingIds = stations.slice(MAX_LENGTH)
  } else {
    // handle the case where the original array is 50 items or fewer
    processIds = stations
  }

  fetchDataForStationIds(processIds)
    .then(results => {
      const filtered = results.filter(obj => obj.length > 0)
      const flattenedData = filtered.reduce((acc, curr) => acc.concat(curr), [])

      writeToTable(flattenedData, remainingIds)
    })
    .catch(error => {
      console.error(`Error fetching data: ${error.message}`)
    })
}

async function fetchDataForStationIds (processIds) {
  const results = []

  for (const stationId of processIds) {
    try {
      const station = stationId.rloi_id
      const response = await axios.get(`https://imfs-prd1-thresholds-api.azurewebsites.net/Location/${station}?version=2`)
      const thresholds = await parseThresholds(response.data[0].TimeSeriesMetaData, station)
      results.push(thresholds) // add the response data to the results array
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('No response from API for station: ', { rloi_id: stationId.rloi_id })
      } else {
        console.error(`Error fetching data for station ID ${stationId}: ${error.message}`)
      }
    }
  }
  if (results.length === 0) {
    throw new Error('No results found.')
  }
  return results
}

async function writeToTable (data, remainingIds) {
  let client

  try {
    client = await pool.connect()
    // do something with the client
  } catch (error) {
    console.log(pool.options)
    console.error('Error acquiring client:', error)
  }
  try {
    if (fileName === 'latest.json') {
      await pool.query(queries.deleteImtd)
      console.log('Truncating the IMTD table')
    }
    // loop through each object in the data array
    for (const obj of data) {
      // build the INSERT query string
      const query = queries.insertImtd
      // execute the query with the values from the current object
      await client.query(query, [obj.stationId, obj.floodWarningArea, obj.floodWarningType, obj.direction, obj.level])
    }
    console.log('Data written to table successfully.')
    await updateStationsList(remainingIds)
    // once all thresholds have been processed refresh mview
    if (!remainingIds) {
      await pool.query(queries.refreshImtdMview)
      console.log('Thresholds mview refreshed successfully.')
    }
  } catch (err) {
    console.error('Error writing to table:', err)
  } finally {
    // release the client back to the pool
    client.release()
  }
}

async function getFile (index) {
  const fileNames = ['latest.json', 'remainingIds.json']

  if (index >= fileNames.length) {
    console.log('None of the files were found in the S3 bucket')
    return
  }

  fileName = fileNames[index]

  const bucket = process.env.LFW_DATA_SLS_BUCKET
  const key = `imtd/${fileName}`

  try {
    const data = await s3.getObject({ Bucket: bucket, Key: key })
    // const data = await s3.getObject(params).promise()
    console.log(`File ${fileName} found in the S3 bucket`)
    if (data === undefined) {
      throw new Error(`File ${fileName} not found in the S3 bucket`)
    }
    return data
    // Process data here
  } catch (err) {
    if (err.code === 'NoSuchKey') {
      console.log(`File ${fileName} not found in the S3 bucket`)
      const data = await getFile(index + 1)
      return data
    } else {
      console.error(err)
    }
  }
}

async function updateStationsList (remainingIds) {
  const bucket = process.env.LFW_DATA_SLS_BUCKET

  try {
    await s3.deleteObject({ Bucket: bucket, Key: 'imtd/latest.json' })
    console.log('Deleted latest.json file from S3 bucket')
  } catch (err) {
    if (err.code === 'NoSuchKey') {
      console.log('latest.json file not found in S3 bucket')
    } else {
      console.error(`Error deleting latest.json file from S3 bucket: ${err.message}`)
    }
  }

  try {
    await s3.deleteObject({ Bucket: bucket, Key: 'imtd/remainingIds.json' })
    console.log('Deleted remainingIds.json file from S3 bucket')
  } catch (err) {
    if (err.code === 'NoSuchKey') {
      console.log('remainingIds.json file not found in S3 bucket')
    } else {
      console.error(`Error deleting remainingIds.json file from S3 bucket: ${err.message}`)
    }
  }

  if (remainingIds) {
    const key = 'imtd/remainingIds.json'
    await s3.putObject({ Bucket: bucket, Key: key, Body: JSON.stringify(remainingIds) })
    console.log('Updated remainingIds.json file in S3 bucket')
  }
}
