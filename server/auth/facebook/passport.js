var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var config = require('../../config/environment');
var stripe = require("stripe")(config.stripeOptions.apiKey);
var Firebase = require('firebase');

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
      'friends.limit(5000)',
      'age_range'
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
            picture: profile.photos ? profile.photos[0].value: "#",
            facebookId: profile.id,
            // birthday: profile.birthday,
            friendList: profile._json.friends ? profile._json.friends.data : [],
            email: profile.emails ? profile.emails[0].value : "", //Getting cannot read property 0 of undefined here.  Crashed server.
            role: 'user',
            provider: 'facebook',
            facebook: profile._json,
            trainerCredential1: "Highly Enthusiastic",
            trainerRating: 5.0,
            trainerNumRatings: 0,
            signUpDate: new Date()
          });
          user.friendListObject = user.friendListObject || {};
          for (var i = 0; i < user.friendList.length; i++) {
            user.friendListObject[user.friendList[i].id] = {};
            user.friendListObject[user.friendList[i].id].name = user.friendList[i].name;
            // user.friendListObject[user.friendList[i].id].picture = user.friendList[i].picture
          }

          user.level = user.level || 0;

          user.save(function(err) {
            if (err) return done(err);
            var usersRef = new Firebase("https://bodyapp.firebaseio.com/fbUsers");  
            var userId = user._id.toString()
            usersRef.child(profile.id).set({picture: user.picture, gender: user.gender, firstName: user.firstName, lastName: user.lastName.charAt(0)})
            done(err, user);
          });
        } else {
          if (profile._json) {
            user.facebook = profile._json;
            user.lastLoginDate = new Date()
            if (profile._json.friends) user.friendList = profile._json.friends.data;
            user.friendListObject = user.friendListObject || {};
            for (var i = 0; i < user.friendList.length; i++) {
              user.friendListObject[user.friendList[i].id] = {}
              user.friendListObject[user.friendList[i].id].name = user.friendList[i].name
              // user.friendListObject[user.friendList[i].id].picture = user.friendList[i].picture
            }
          }          
          user.save(function(err) {
            if (err) return done(err);
            var usersRef = new Firebase("https://bodyapp.firebaseio.com/fbUsers");  
            var userId = user._id.toString()
            usersRef.child(profile.id).set({picture: user.picture, gender: user.gender, firstName: user.firstName, lastName: user.lastName.charAt(0)})
            // passport.authenticate('facebook', { authType: 'rerequest', scope: ['user_friends'] });
            return done(err, user);
          })
        }
      })
    }
  ));
};
