/**
 * Validation middleware using Zod schemas
 */
const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error.name === 'ZodError') {
      // Format validation errors nicely
      const errors = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return res.status(400).json({
        success: false,
        message: errors[0]?.message || 'Validation failed',
        errors,
      });
    }
    next(error);
  }
};

module.exports = validate;
