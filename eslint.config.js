const neostandard = require('neostandard')

module.exports = [
  {
    ignores: ['coverage/**', 'test/output*', 'test/*.html']
  },
  ...neostandard(),
  // @hapi/lab's coverage instrumentation reads this project's eslint config and
  // feeds it to @babel/eslint-parser, which otherwise crashes without a babel config file
  {
    languageOptions: {
      parserOptions: {
        requireConfigFile: false
      }
    }
  }
]
