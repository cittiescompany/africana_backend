const { ValidationError } = require('yup');

const validate = (schema, stripUnknown = false) => {
  return async (req, res, next) => {
    try {
      const validated = await schema.validate(
        {
          body: req.body,
          query: req.query,
          params: req.params,
        },
        {
          stripUnknown,
        }
      );

      if (validated.body) req.body = validated.body;
      if (validated.query) req.query = validated.query;
      if (validated.params) req.params = validated.params;

      next();
    } catch (error) {
      console.log(error);
      const e =
        error instanceof ValidationError
          ? error
          : new ValidationError(error.message);
      e.message = e.errors.map((err) => err.message).join(', ');
      return res.status(400).json({ success: false, message: e.message });
    }
  };
};

module.exports = validate;
