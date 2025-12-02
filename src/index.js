require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Moralis = require("moralis").default;
const { ethers } = require("ethers");

const User = require("./models/User");
const app = express();

app.use(express.json());

// MongoDB connect
mongoose.connect(process.env.MONGO_URI).then(() => console.log("MongoDB Connected"));

// Initialize Passport
require("./config/passportLocal")(passport);
require("./config/passportGoogle")(passport);
app.use(passport.initialize());

Moralis.start({
  apiKey: process.env.MORALIS_API_KEY,
});


// Generate JWT
const makeToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

//////////////////////////////////////////////////////////////
// 🔐 EMAIL / PASSWORD REGISTER
//////////////////////////////////////////////////////////////
app.post("/auth/register", async (req, res) => {
  const { email, password, name } = req.body;

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ msg: "Email already registered" });

  const hashed = await bcrypt.hash(password, 10);

  const user = await User.create({ email, password: hashed, name });

  res.json({
    msg: "Registered successfully",
    token: makeToken(user)
  });
});

//////////////////////////////////////////////////////////////
// 🔐 EMAIL / PASSWORD LOGIN
//////////////////////////////////////////////////////////////
app.post(
  "/auth/login",
  passport.authenticate("local", { session: false }),
  (req, res) => {
    res.json({
      msg: "Logged in",
      token: makeToken(req.user)
    });
  }
);

//////////////////////////////////////////////////////////////
// 🔐 GOOGLE LOGIN (START)
//////////////////////////////////////////////////////////////
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

//////////////////////////////////////////////////////////////
// 🔐 GOOGLE CALLBACK
//////////////////////////////////////////////////////////////
app.get(
  "/auth/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    const token = makeToken(req.user);
    res.json({ msg: "Google login successful", token: token });
  }
);

//////////////////////////////////////////////////////////////
// PROTECTED ROUTE EXAMPLE
//////////////////////////////////////////////////////////////
app.get(
  "/protected",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    res.json({ msg: "You accessed a protected route!", user: req.user });
  }
);

//////////////////////////////////////////////////////////////
// GET TOTAL WALLET BALANCE
//////////////////////////////////////////////////////////////
app.get(
  "/wallet/tokens/:address",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const walletAddress = req.params.address;
    const chain = "0x1"; // Ethereum chain

    try {
      // 1️⃣ Fetch all ERC-20 tokens for the wallet
      const response = await Moralis.EvmApi.token.getWalletTokenBalances({
        address: walletAddress,
        chain: chain,
      });

      const tokens = response.raw;
      const output = [];

      // 2️⃣ Fetch price for each token
      for (const token of tokens) {
        let usdPrice = "N/A";
        let usdValue = "N/A";

        try {
          const price = await Moralis.EvmApi.token.getTokenPrice({
            address: token.token_address,
            chain: chain,
          });

          usdPrice = price.raw.usdPrice;
          usdValue =
            parseFloat(ethers.formatUnits(token.balance, token.decimals)) *
            usdPrice;
        } catch (error) {
          // token has no price data
        }

        output.push({
          name: token.name,
          symbol: token.symbol,
          contract: token.token_address,
          balance: ethers.formatUnits(token.balance, token.decimals),
          usd_price: usdPrice,
          usd_value: usdValue,
        });
      }

      res.json({
        wallet: walletAddress,
        tokens: output,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch wallet tokens" });
    }
  }
);

//////////////////////////////////////////////////////////////
// SERVER
//////////////////////////////////////////////////////////////
app.listen(5000, () => console.log("Server running on port 5000"));
