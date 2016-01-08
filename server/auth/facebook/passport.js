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
      'picture.type(large)',
      'friends',
      'birthday'
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
            picture: profile.photos ? profile.photos[0].value : "http://www.london24.com/polopoly_fs/1.3602534.1400170400!/image/2302025834.jpg_gen/derivatives/landscape_630/2302025834.jpg",
            facebookId: profile.id,
            birthday: profile.birthday,
            friendList: profile._json.friends ? profile._json.friends.data : [],
            email: profile.emails ? profile.emails[0].value : "", //Getting cannot read property 0 of undefined here.  Crashed server.
            role: 'user',
            provider: 'facebook',
            facebook: profile._json,
            trainerCredential1: "L1 CrossFit Trainer",
            trainerCredential2: "ACSM certified",
            trainerCredential3: "NASM Certified",
            trainerCredential4: "AED/CPR",
            trainerRating: 5.0
          });
          user.friendListObject = {}
          for (var i = 0; i < user.friendList.length; i++) {
            user.friendListObject[user.friendList[i].id] = {}
            user.friendListObject[user.friendList[i].id].name = user.friendList[i].name
          }

          user.save(function(err) {
            if (err) return done(err);
            done(err, user);
          });
        } else {
          user.facebook = profile._json;
          user.friendListObject = {}
          for (var i = 0; i < user.friendList.length; i++) {
            user.friendListObject[user.friendList[i].id] = {}
            user.friendListObject[user.friendList[i].id].name = user.friendList[i].name
          }
          user.save(function(err) {
            if (err) return done(err);
            return done(err, user);
          })
        }
      })
    }
  ));
};
