const express = require("express");
const bodyParser = require("body-parser");
const passport = require("passport");

const connectDB = require("./source/config/db");
const app = express();

app.use(bodyParser.json());

// DB connect
connectDB();

// Passport config
require("./source/config/passport")(passport);
app.use(passport.initialize());

app.use("/api/auth", require("./routes/auth"));

app.listen(5000, () => console.log("Server running on port 5000"));
