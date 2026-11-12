import jwt from "jsonwebtoken";

export function authMiddleware(req, res, next) {
   try {
let token = req.cookies.accessToken;
 token = token.replace(/^<|>$/g, "");
if (!token) {
  req.flash("error", "Unauthorized");
  return res.redirect("/login");
}

   jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.flash("error", "Invalid or expired token");
      }
      // Attach decoded payload to request and locals (for pug templates)
      req.user = decoded;
      res.locals.currentUser = decoded;
      next();
    });
  } catch (err) {
    req.flash("error", "Something went wrong in authentication");
    return res.redirect("/");
  }
}
