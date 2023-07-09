const authMiddleware = (req, res, next) => {
    // Check if the user is authenticated
    if (req.isAuthenticated()) {
      // User is authenticated, proceed to the next middleware or route handler
      next();
    } else {
      // User is not authenticated, send a 401 Unauthorized response
      res.status(401).json({ error: 'Unauthorized' });
    }
};
  
module.exports = authMiddleware;
  
  