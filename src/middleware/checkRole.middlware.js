// role.middleware.js
const checkRole = allowedRoles => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Allowed roles: ${allowedRoles.join(
          ", "
        )}`
      });
    }
    next();
  };
};

export default checkRole