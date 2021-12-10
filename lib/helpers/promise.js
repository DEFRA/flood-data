const { PromisePool } = require('@supercharge/promise-pool');

/**
 * Process a list of items asynchronously with a specified concurrency level.
 * @param {Object} options - Options for the process.
 * @param {Array} options.list - The list of items to process.
 * @param {Function} options.cb - The callback function to execute for each item in the list.
 * @param {number} [options.concurrency=2] - The concurrency level for processing the list.
 * @returns {Promise} A Promise that resolves to the results of the process.
 */
exports.processListWithConcurrency = async ({ list, cb, concurrency = 2 }) => {
  try {
    const { results } = await PromisePool.withConcurrency(concurrency)
      .for(list)
      .handleError(async (error) => {
        throw error;
      })
      .process(cb);

    return results;
  } catch (error) {
    // Handle errors here or let them propagate to the caller
    throw error;
  }
};
