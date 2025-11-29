const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const passport = require("passport");

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);

    user = await User.create({ name, email, password: hashed });

    res.json({ msg: "Register success", user });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

exports.login = (req, res, next) => {
  passport.authenticate("local", { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(400).json({ msg: info.message });

    const token = jwt.sign({ id: user._id }, "SECRET123", {
      expiresIn: "1h"
    });

    res.json({ msg: "Login success", token });
  })(req, res, next);
};
