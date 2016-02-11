var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var config = require('../../config/environment');
var stripe = require("stripe")(config.stripeOptions.apiKey);
var Firebase = require('firebase');
var FirebaseTokenGenerator = require("firebase-token-generator");
var tokenGenerator = new FirebaseTokenGenerator(config.firebaseSecret);

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
            name: profile.displayName ? profile.dislpayName : "",
            firstName: profile.displayName ? profile.displayName.substr(0, profile.displayName.indexOf(" ")) : "",
            lastName: profile.displayName ? profile.displayName.substring(profile.displayName.lastIndexOf(" ")+1) : "",
            nickName: profile.displayName ? profile.displayName.substr(0, profile.displayName.indexOf(" ")) : "",
            gender: profile.gender ? profile.gender : "",
            picture: profile.photos ? profile.photos[0].value : "#",
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
          var firebaseToken = tokenGenerator.createToken({ uid: profile.id, mdbId: user._id, role: user.role, firstName: user.firstName, lastName: user.lastName.charAt(0), gender: user.gender, picture: user.picture })
          user.firebaseToken = firebaseToken;
          user.lastLoginDate = user.signUpDate;

          user.save(function(err) {
            if (err) return done(err);
            //Firebase authentication
            var ref = new Firebase("https://bodyapp.firebaseio.com/");
            var usersRef = ref.child("fbUsers");  
            var userId = user._id.toString()
            
            // console.log(token)
            ref.authWithCustomToken(firebaseToken, function(error, authData) {
              if (error) {
                console.log("Firebase authentication failed", error);
              } else {
                console.log("Firebase authentication succeeded!", authData);
              }
            // }, { remember: "sessionOnly" }); //Session expires upon browser shutdown
            }); 

            usersRef.child(profile.id).set({picture: user.picture, gender: user.gender, firstName: user.firstName, lastName: user.lastName.charAt(0)})
            done(err, user);  
            
          });
        } else {
          //Generate client firebase token.  Set user to admin if their role is admin
          var firebaseToken = tokenGenerator.createToken({ uid: profile.id, role: user.role, mdbId: user._id, firstName: user.firstName, lastName: user.lastName.charAt(0), gender: user.gender, picture: user.picture }) 
            // {admin: user.role === "admin"});
          user.firebaseToken = firebaseToken;
          
          if (profile._json) {
            user.facebook = profile._json;
          }

          user.lastLoginDate = new Date();
          if (profile._json && profile._json.friends) user.friendList = profile._json.friends.data;
          user.friendListObject = {};
          for (var i = 0; i < user.friendList.length; i++) {
            user.friendListObject[user.friendList[i].id] = {name: user.friendList[i].name}
            // user.friendListObject[user.friendList[i].id].name = user.friendList[i].name
            // console.log(user.friendListObject)
            // console.log("hello")
            // user.friendListObject[user.friendList[i].id].picture = user.friendList[i].picture
          }
                    
          user.save(function(err) {
            console.log("save complete")
            if (err) return done(err);
            //Firebase authentication
            var ref = new Firebase("https://bodyapp.firebaseio.com/");
            var usersRef = ref.child("fbUsers");  
            var userId = user._id.toString();
            
            // var token = tokenGenerator.createToken({ uid: profile.id, some: "arbitrary", data: "here" },
            //   {admin: user.role === "admin"});
            // user.firebaseToken = token;
            ref.authWithCustomToken(firebaseToken, function(error, authData) {
              if (error) {
                console.log("Firebase authentication failed", error);
              } else {
                console.log("Firebase authentication succeeded!", authData);                     
              }
            // }, { remember: "sessionOnly" }); //Session expires upon browser shutdown
            }); 
            usersRef.child(profile.id).update({picture: user.picture, gender: user.gender, firstName: user.firstName, lastName: user.lastName.charAt(0)})
            // passport.authenticate('facebook', { authType: 'rerequest', scope: ['user_friends'] });
            return done(err, user);
          })
        }
      })
    }
  ));
};
