import jwt from "jsonwebtoken";

export function authenticateJWT(req, res, next) {
  try {
    // Accept token from Authorization header (Postman/API) OR cookie (browser)
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1].trim().replace(/^<|>$/g, "");
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken.replace(/^<|>$/g, "");
    }

    if (!token) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized: Token missing or invalid format",
      });
    }

    // Verify token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({
          status: false,
          message: "Unauthorized: Invalid or expired token",
        });
      }

      // Attach decoded payload to request
      req.user = decoded;
      next();
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: "Something went wrong in authentication",
    });
  }
}