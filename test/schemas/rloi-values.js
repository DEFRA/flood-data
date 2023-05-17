const Joi = require('@hapi/joi')

module.exports = {
  vars: Joi.array().required().items(
    Joi.object({
      telemetry_value_parent_id: Joi.number().required(),
      error: Joi.boolean().required(),
      value: Joi.number().allow(NaN).required(),
      processed_value: Joi.number().required(),
      value_timestamp: Joi.date().required()
    })
  )
}
