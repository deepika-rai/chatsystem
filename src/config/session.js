import session from "express-session";

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || '78D2D8EE943783ACEB69E9A1BB3ED',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000 
  }
});
export default sessionMiddleware;
