const { fail } = require('../utils/response');

const validate = (schema) => (req, res, next) => {
  const payload = {
    body: req.body,
    params: req.params,
    query: req.query,
  };
  const { error, value } = schema.validate(payload, { allowUnknown: true });
  if (error) {
    return fail(res, error.details[0].message, 400);
  }
  req.validated = value;
  return next();
};

module.exports = validate;

