const LocalStrategy = require("passport-local").Strategy;
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

module.exports = function (passport) {
  
  // 🔹 LOCAL STRATEGY (email + password)
  passport.use(
    new LocalStrategy(
      { usernameField: "email" }, // use email instead of username
      async (email, password, done) => {
        try {
          const user = await User.findOne({ email });
          if (!user) return done(null, false, { message: "User not found" });

          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) return done(null, false, { message: "Invalid password" });

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  // 🔹 JWT STRATEGY
  const opts = {};
  opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
  opts.secretOrKey = "SECRET123";

  passport.use(
    new JwtStrategy(opts, async (jwt_payload, done) => {
      try {
        const user = await User.findById(jwt_payload.id);
        if (user) return done(null, user);
        return done(null, false);
      } catch (err) {
        done(err, false);
      }
    })
  );

  // 🔹 GOOGLE STRATEGY
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "YOUR_GOOGLE_CLIENT_SECRET",
      callbackURL: "/api/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;

        let user = await User.findOne({ email });

        // If user does not exist → create one
        if (!user) {
          user = await User.create({
            name: profile.displayName,
            email: email,
            password: "GOOGLE_LOGIN" // dummy password
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);


  // 🔹 For storing user in session (optional)
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
};
