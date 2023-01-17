const jwt = require("jsonwebtoken");
const User = require("../models/User");
const config = process.env;

const verifyToken = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    const token =
    req.body.token || req.query.token || req.headers["x-access-token"] || req.headers["authorization"].split(' ')[1];

  if (!token) {
    return res.status(403).send("A token is required for authentication");
  }

  try {
    const decoded = await jwt.verify(token, config.TOKEN_KEY);
    const freshUser = await User.findById(decoded.id);

    if (!freshUser) {
      return res.status(401).send("The user belonging to this token does no longer exist.");
    }

    freshUser.token = token;
    req.user = freshUser;
  } catch (err) {
    return res.status(401).send("Invalid Token");
  }
  return next();
  } else {
    return res.status(403).send("Invalid token");
  }
};

module.exports = verifyToken;