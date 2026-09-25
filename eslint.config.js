module.exports = [
  {
    ignores: ['coverage/**', 'test/output*', 'test/*.html']
  },
  ...require('neostandard')({}),
  {
    languageOptions: {
      parserOptions: {
        requireConfigFile: false
      }
    }
  }
]
