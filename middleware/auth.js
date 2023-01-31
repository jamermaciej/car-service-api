const jwt = require("jsonwebtoken");
const User = require("../models/User");
const config = process.env;
const { TokenExpiredError } = jwt;

const verifyToken = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    const token =
    req.body.token || req.query.token || req.headers["x-access-token"] || req.headers["authorization"].split(' ')[1];

  if (!token) {
    return res.status(403).send("A token is required for authentication");
  }

  // TODO - co gdy token został zmodyfikowany? albo wygasł? - obsługa błędu

  try {
    const decoded = await jwt.verify(token, config.ACCESS_TOKEN_KEY);
    const freshUser = await User.findById(decoded.id);

    if (!freshUser) {
      return res.status(401).send("The user belonging to this token does no longer exist.");
    }

    // check if user changed password after the token was issued
    // if (freshUser.changedPasswordAfter(decoded.iat)) {
    //   return res.status(401).send("User recently changed password! Please log in again.");
    // }

    freshUser.accessToken = token;
    req.user = freshUser;
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      return res.status(401).send({ message: "Unauthorized! Access Token was expired!" });
    } 
    
    return res.status(401).json("Invalid Token");
  }
  return next();
  } else {
    return res.status(403).send("Invalid token");
  }
};

module.exports = verifyToken;