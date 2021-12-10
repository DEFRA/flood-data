const { SQSEvent } = require('aws-lambda');
const { fetchDataForStationIds, writeToTable } = require('../helpers/station');

/**
 * Handles an S3 event, retrieves the corresponding file from S3, and sends its content as messages to an SQS queue.
 *
 * @param {SQSEvent} event - The SQSEvent event.
 */
module.exports.handler = async (event) => {
  const { Records } = event;

  try {
    /** @type {Array<{rloi_id: string}>} */
    const parsedStations = JSON.parse(Records[0].body);
    const thresholds = await fetchDataForStationIds(parsedStations);

    /** @type {Array<{level: string;direction: string;floodWarningType: string;floodWarningArea: string;stationId: string;}>} */
    const flattenedThresholdData = thresholds.reduce((acc, curr) => {
      return curr.length > 0 ? acc.concat(curr) : acc;
    }, []);

    await writeToTable(flattenedThresholdData);
  } catch (error) {}
};
