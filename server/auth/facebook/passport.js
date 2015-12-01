var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var config = require('../../config/environment');
var stripe = require("stripe")(config.stripeOptions.apiKey);

exports.setup = function (User, config) {
  passport.use(new FacebookStrategy({
      clientID: config.facebook.clientID,
      clientSecret: config.facebook.clientSecret,
      callbackURL: config.facebook.callbackURL,
      profileFields: [
      'displayName',
      'emails',
      'gender',
      'picture.type(large)'
      ]
    },
    function(accessToken, refreshToken, profile, done) {

      //Will have to change to email check if incorporate authentication other than facebook.  Changed to this because there was an issue if email wasn't properly set in facebook.
      User.findOne({
        // 'email': profile.emails[0].value.toLowerCase()
        'facebookId': profile.id
      },
      function(err, user) {
        if (err) {
          return done(err);
        }
        if (!user) {
          user = new User({
            name: profile.displayName,
            firstName: profile.displayName.substr(0, profile.displayName.indexOf(" ")),
            lastName: profile.displayName.substring(profile.displayName.lastIndexOf(" ")+1),
            nickName: profile.displayName.substr(0, profile.displayName.indexOf(" ")),
            gender: profile.gender,
            picture: profile.photos[0].value,
            facebookId: profile.id,
            birthday: " ",
            email: profile.emails[0].value || "",
            role: 'user',
            provider: 'facebook',
            facebook: profile._json
          });
          user.save(function(err) {
            if (err) return done(err);
            done(err, user);
          });
        } else {
          //Update picture link every time.
          user.picture = profile.photos[0].value
          user.save(function(err) {
            if (err) return done(err);
            return done(err, user);
          })

          
        }
      })
    }
  ));
};
