const s3 = require('../helpers/s3')
const { batchUploadSQSMessages } = require('../helpers/sqs-client')

/**
 * Decodes the provided string.
 * This function handles a case where the string needs to be decoded twice to properly parse the equal (=) sign.
 *
 * @param {string} str - The string to decode.
 * @returns {string} The decoded string.
 */
function decodeString (str) {
  console.info(str)
  return decodeURIComponent(
    JSON.parse(`"${str.replace(/\"/g, '\\"')}"`)
  ).replace(/\+/g, ' ')
}

/**
 * Retrieves a file from an S3 bucket.
 *
 * @param {string} bucket - The name of the S3 bucket.
 * @param {string} key - The key of the object in the S3 bucket.
 * @returns {Promise<AWS.S3.GetObjectOutput>} A promise that resolves with the data of the object, or rejects if an error occurs.
 */
async function getFile (bucket, key) {
  try {
    const data = await s3.getObject({ Bucket: bucket, Key: key })
    console.log(`File ${key} found in the S3 bucket`)
    return data
  } catch (err) {
    throw Promise.reject(err)
  }
}

/**
 * Handles an S3 event, retrieves the corresponding file from S3, and sends its content as messages to an SQS queue.
 * @param {require('aws-lambda').S3Event} event - The S3 event.
 */
module.exports.handler = async (event) => {
  // Extract the first record from the S3 event.
  const [s3EventRecord] = event.Records

  try {
    // Decode the bucket name and file name from the S3 event record.
    const bucket = decodeString(s3EventRecord.s3.bucket.name)
    const fileName = decodeString(s3EventRecord.s3.object.key)

    // Retrieve the file from the S3 bucket.
    const data = await getFile(bucket, fileName)

    // Parse the content of the file.
    /** @type {Array<{rloi_id: string}>} */
    const stations = JSON.parse(data.Body)

    // Send the content of the file as messages to an SQS queue.
    await batchUploadSQSMessages({
      messages: stations,
      queueUrl: process.env.PROCESS_XIP_QUEUE
    })
  } catch (error) {}
}
