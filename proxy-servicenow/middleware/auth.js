module.exports = (req, res, next) => {
  if (!req.session?.sn_access_token) {
    return res.status(401).json({ 
      error: 'unauthorized',
      message: 'Please login first' 
    });
  }
  next();
};