const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");
const { register, login } = require("./controllers/authController");

// Normal Routes
router.post("/register", register);
router.post("/login", login);

// ---------------- GOOGLE LOGIN ----------------

// Step 1: Redirect user to Google
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Step 2: Google redirects back to us
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    // Generate JWT for Google user
    const token = jwt.sign({ id: req.user._id }, "SECRET123", {
      expiresIn: "1h"
    });

    res.json({
      msg: "Google Login success",
      token,
      user: req.user
    });
  }
);

// Protected route for testing
router.get(
  "/profile",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    res.json({ msg: "Protected Data", user: req.user });
  }
);

module.exports = router;
