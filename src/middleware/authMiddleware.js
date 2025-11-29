const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const token = req.header("Authorization");

  if (!token) return res.status(401).json({ msg: "No token, access denied" });

  try {
    const decoded = jwt.verify(token, "SECRET123");
    req.user = decoded.id;
    next();
  } catch (err) {
    res.status(400).json({ msg: "Invalid token" });
  }
};
