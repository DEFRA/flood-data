// Importing the winston library
const winston = require('winston')

/**
 * Class for logging.
 */
class Logger {
  /**
     * Create a logger.
     * @param {Object} [meta={}] - Meta data for the logger.
     */
  constructor (meta = {}) {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(winston.format.splat(), winston.format.json()),
      defaultMeta: { service: 'products-service' },
      transports: new winston.transports.Console({})
    })

    /** @type {Object} */
    this.meta = meta
  }

  /**
     * Log an error message.
     * @param {string} message - The message to log.
     * @param {Object} [meta] - Additional meta data.
     */
  error (message, meta) {
    this.logger.error(message, this.merged(meta))
  }

  /**
     * Log a warning message.
     * @param {string} message - The message to log.
     * @param {Object} [meta] - Additional meta data.
     */
  warn (message, meta) {
    this.logger.warn(message, this.merged(meta))
  }

  /**
     * Log an info message.
     * @param {string} message - The message to log.
     * @param {Object} [meta] - Additional meta data.
     */
  info (message, meta) {
    this.logger.info(message, this.merged(meta))
  }

  /**
     * Log a debug message.
     * @param {string} message - The message to log.
     * @param {Object} [meta] - Additional meta data.
     */
  debug (message, meta) {
    this.logger.debug(message, this.merged(meta))
  }

  /**
     * Merge meta data.
     * @param {Object} [extra] - The additional meta data.
     * @returns {Object} The merged meta data.
     * @private
     */
  merged (extra) {
    if (!extra) {
      return this.meta
    }

    return Object.assign(this.meta, extra)
  }
}

const logger = new Logger()
module.exports = { logger, Logger }
