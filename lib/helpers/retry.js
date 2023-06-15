const retry = require('async-retry')

exports.retryFunction = (cb, options) => retry(cb, options)
