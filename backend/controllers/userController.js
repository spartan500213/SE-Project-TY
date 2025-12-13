const jwt = require("jsonwebtoken");

const userProfileGet = (req, res) => {
  const token = req.token;

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // decoded contains the payload you signed, e.g. { id, email, iat, exp }
    // You can send back user info from the token:
    res.json({ email: decoded.email, id: decoded.id });

    // Optional: Instead of relying only on the token payload,
    // you can fetch fresh user data from DB using decoded.id.
  });
};

module.exports = {
  userProfileGet,
};
