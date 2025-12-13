//format of token
//authorization: Bearer <access_token>

function verifyToken(req, res, next) {
  //get auth header value
  const bearerHeader = req.headers["authorization"];
  //check if bearer is undefined
  if (typeof bearerHeader !== "undefined") {
    //split at the space
    const bearer = bearerHeader.split(" ");
    //get token from array
    const token = bearer[1];
    //set token to the request
    req.token = token;
    next();
  } else {
    //forbidden
    res.sendStatus(403);
  }
}

module.exports = verifyToken;
