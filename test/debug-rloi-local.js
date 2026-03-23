'use strict'

const fs = require('fs')
const proxyquire = require('proxyquire')

async function main () {
  process.env.LFW_DATA_DB_CONNECTION = process.env.LFW_DATA_DB_CONNECTION || 'postgres://u_flood:secret@127.0.0.1:5433/temp_flood_db'

  const event = {
    Records: [
      {
        s3: {
          bucket: { name: 'local-bucket' },
          object: { key: 'local/rloi-debug.xml' }
        }
      }
    ]
  }

  // By default, use a unique station each run (prevents duplicates).
  // To test duplicates across files, set DEBUG_STATION_REF to a fixed value.
  let stationRef = process.env.DEBUG_STATION_REF
  if (!stationRef) {
    stationRef = String(960000 + Math.floor(Math.random() * 10000))
  }

  // By default use rloi-test.xml, but allow override via DEBUG_XML_FILE
  const xmlFile = process.env.DEBUG_XML_FILE || './test/data/rloi-test.xml'
  let telemetryXml = fs.readFileSync(xmlFile, 'utf8')
  telemetryXml = telemetryXml.replace(/stationReference="[^"]*"/g, `stationReference="${stationRef}"`)

  const mockS3 = {
    async getObject ({ Key }) {
      if (Key && Key.endsWith('/station.json')) {
        throw new Error('No station file for local debug run')
      }

      return {
        Body: {
          async transformToString () {
            return telemetryXml
          }
        }
      }
    }
  }

  const { handler } = proxyquire('../lib/functions/rloi-process', {
    '../helpers/s3': mockS3
  })

  console.log('Running local rloi debug with:')
  console.log(`  stationReference=${stationRef}`)
  console.log(`  xmlFile=${xmlFile}`)
  console.log('  Note: Set DEBUG_STATION_REF to fixed value to test duplicates across files')
  await handler(event)
  console.log('rloi debug run complete')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
