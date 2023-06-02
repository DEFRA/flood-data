module.exports = {
  log: function (...args) {
    console.log.apply(console, Array.prototype.slice.call(args))
  },

  error: function (...args) {
    console.error.apply(console, Array.prototype.slice.call(args))
  }
}
