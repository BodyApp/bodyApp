var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;

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
      User.findOne({
        'email': profile.emails[0].value.toLowerCase()
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
            birthday: " ",
            email: profile.emails[0].value,
            role: 'user',
            provider: 'facebook',
            facebook: profile._json
          });
          user.save(function(err) {
            if (err) return done(err);
            console.log(user);
            done(err, user);
          });
        } else {
          return done(err, user);
        }
      })
    }
  ));
};
