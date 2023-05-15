const { SQSEvent } = require('aws-lambda')
const {
  fetchDataForStationIds,
  writeToTable
} = require('../helpers/data-fetch-and-write-station')

/**
 * An array of parsed threshold data for the given station IDs.
 * @typedef {Array<{ level: string; direction: string; floodWarningType: string; floodWarningArea: string; stationId: string; }>} ThresholdData
 */

/**
* @param {SQSEvent} event - The SQSEvent event containing the message from the SQS queue.
* @returns {Promise<void>} A promise that resolves when all the processing is complete.
*/
module.exports.handler = async (event) => {
  const { Records } = event

  try {
    /** @type {Array<{rloi_id: string}>} */
    const parsedStations = JSON.parse(Records[0].body)
    const thresholds = await fetchDataForStationIds(parsedStations)

    /** @type {ThresholdData>} */
    const flattenedThresholdData = thresholds.reduce((acc, curr) => {
      return curr.length > 0 ? acc.concat(curr) : acc
    }, [])

    await writeToTable(flattenedThresholdData)
  } catch (error) {}
}
