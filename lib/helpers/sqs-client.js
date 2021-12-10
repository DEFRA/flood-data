const PromisePool = require('@supercharge/promise-pool/dist');
const AWS = require('aws-sdk');
const { chunk } = require('lodash');

/** @type {AWS.SQS} */
let sqsClientInstance;

/**
 * Initializes and returns an AWS SQS client.
 *
 * @param {boolean} isLocal - If true, use local endpoint for SQS.
 * @returns {AWS.SQS} The AWS SQS client instance.
 */
export const initializeSQSClient = (isLocal = false) => {
  if (!sqsClientInstance) {
    sqsClientInstance = new AWS.SQS(
      isLocal || process.env.IS_OFFLINE || process.env.IS_LOCAL
        ? {
            endpoint: 'http://localhost:9324',
            region: 'us-east-1',
          }
        : {}
    );
  }

  return sqsClientInstance;
};

/**
 * Prepares the batched messages request for AWS SQS.
 *
 * @param {Record<string, any>} params - Parameters for preparing the request.
 * @param {string} params.queueUrl - The SQS queue URL.
 * @param {array} params.messages - The array of messages to send.
 * @param {number} params.batchSize - The size of each batch of messages.
 * @returns {array} The batched messages request.
 */
const prepareBatchedMessagesRequest = ({ queueUrl, messages, batchSize }) =>
  chunk(messages, batchSize).map((Entries) => ({
    QueueUrl: queueUrl,
    Entries,
  }));

/**
 * Sends a batch of messages to an AWS SQS queue.
 *
 * @param {Record<string, any>} params - Parameters for sending the messages.
 * @param {array} params.messages - The array of messages to send.
 * @param {string} params.queueUrl - The SQS queue URL.
 * @param {number} [params.batchSize=10] - The size of each batch of messages.
 * @returns {Promise<void>} Resolves when all messages have been sent.
 */
export async function batchUploadSQSMessages({
  messages,
  queueUrl,
  batchSize = 10,
}) {
  const client = initializeSQSClient();

  let count = 0;

  const batchedMessages = prepareBatchedMessagesRequest({
    messages,
    queueUrl,
    batchSize,
  });

  await PromisePool.withConcurrency(100)
    .for(batchedMessages)
    .handleError((error) => {
      throw error; // Uncaught errors will immediately stop PromisePool
    })
    .process((data) => {
      count += data.Entries.length;
      return client.sendMessageBatch(data).promise();
    });

  console.info(`The lambda has uploaded ${count} items`);
}
