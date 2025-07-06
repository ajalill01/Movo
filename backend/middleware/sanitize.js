const sanitize = (req, res, next) => {
  const hasMongoOperators = (obj) => {
    for (let key in obj) {
      if (key.startsWith('$')) {
        return true;
      }
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (hasMongoOperators(obj[key])) {
          return true;
        }
      }
    }
    return false;
  };

  if (hasMongoOperators(req.body) || hasMongoOperators(req.query) || hasMongoOperators(req.params)) {
    return res.status(400).json({
      success: false,
      message: "Invalid request data (NoSQL injection attempt blocked)."
    });
  }

  next();
};

module.exports = sanitize;