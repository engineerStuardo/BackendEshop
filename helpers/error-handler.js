function errorHandler(error, req, res, next) {
  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({ message: 'User is not authorized' });
  }
  if (error.name === 'ValidationError') {
    return res.status(401).json({ message: error });
  }

  return res.status(500).json(error);
}

module.exports = errorHandler;
