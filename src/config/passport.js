const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const prisma = require('./database');

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists
        let user = await prisma.user.findUnique({
          where: { googleId: profile.id }
        });

        if (!user) {
          // Check if email exists
          user = await prisma.user.findUnique({
            where: { email: profile.emails[0].value }
          });

          if (user) {
            // Link Google account
            user = await prisma.user.update({
              where: { id: user.id },
              data: { googleId: profile.id, emailVerified: true }
            });
          } else {
            // Create new user
            user = await prisma.user.create({
              data: {
                googleId: profile.id,
                email: profile.emails[0].value,
                firstName: profile.name.givenName,
                lastName: profile.name.familyName,
                emailVerified: true
              }
            });
          }
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

module.exports = passport;

