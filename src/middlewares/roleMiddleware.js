/**
 * Role-based access control middleware.
 * Usage: requireRole('admin')  or  requireRole('admin', 'staff')
 * If user role is not in the allowed list → redirect to dashboard with error flash.
 */
export function requireRole(...allowedRoles) {
  return function (req, res, next) {
    const role = req.user?.role;

    if (!role || !allowedRoles.includes(role)) {
      req.flash("error", "You do not have permission to access this page.");
      return res.redirect("/user/dashboard");
    }

    next();
  };
}
