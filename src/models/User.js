const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: { type: String, required: false },
  password: { type: String, required: false },
  name: { type: String, required: false }
});

module.exports = mongoose.model("User", UserSchema);
