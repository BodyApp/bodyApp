var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var config = require('../../config/environment');
var stripe = require("stripe")(config.stripeOptions.apiKey);
// var Firebase = require('firebase');
// var FirebaseTokenGenerator = require("firebase-token-generator");
// var tokenGenerator = new FirebaseTokenGenerator(config.firebaseSecret);

var firebase = require('firebase');
var ref = firebase.database().ref()

const crypto = require("crypto"); //For intercom hash

// var fs = require('fs')
// var Mailgun = require('mailgun-js');
// var api_key = config.mailgunApiKey;
// var from_who = config.mailgunFromWho;
// var domain = 'getbodyapp.com';  
// var mailgun = new Mailgun({apiKey: api_key, domain: domain});

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
            name: profile.displayName ? profile.displayName : "",
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
          // var firebaseToken = tokenGenerator.createToken({ uid: profile.id, mdbId: user._id, role: user.role, firstName: user.firstName, lastName: user.lastName.charAt(0), gender: user.gender, picture: user.picture })
          user.firebaseToken = firebase.auth().createCustomToken(profile.id, {"facebookId": profile.id, "role": user.role, "mdbId": user._id, "firstName": user.firstName, "lastName": user.lastName, "gender": user.gender, "picture": user.picture, "email": user.email });
          user.lastLoginDate = user.signUpDate;

          //Used for intercom secure mode
          var hmac = crypto.createHmac('sha256', config.intercomSecret);
          hmac.update(user._id.toString());
          user.intercomHash = hmac.digest('hex');
          user.trialStart = new Date();
          user.trialDurationDays = 7;

          user.save(function(err) {
            if (err) return done(err);
            console.log("Created new user with facebookId " + user.facebookId)
            //Firebase authentication
            // var ref = new Firebase("https://bodyapp.firebaseio.com/");
            var usersRef = ref.child("fbUsers");  
            // sendWelcomeEmail(user)
            // var userId = user._id.toString()
            
            // console.log(token)
            // ref.authWithCustomToken(firebaseToken, function(error, authData) {
            //   if (error) {
            //     console.log("Firebase authentication failed", error);
            //   } else {
            //     console.log("Firebase authentication succeeded!");
            //   }
            // // }, { remember: "sessionOnly" }); //Session expires upon browser shutdown
            // }); 

            usersRef.child(profile.id).update({picture: user.picture, gender: user.gender, firstName: user.firstName, lastName: user.lastName.charAt(0), email: user.email})
            var rightNow = new Date().getTime()
            ref.child('usersById').child(user._id).update({firstName: user.firstName, lastName: user.lastName, email: user.email, created: rightNow, updated: rightNow, trialStart: rightNow, trialDurationDays: 7})
            done(err, user);  
            
          });
        } else {
          //Generate client firebase token.  Set user to admin if their role is admin
          // var firebaseToken = tokenGenerator.createToken({ uid: profile.id, role: user.role, mdbId: user._id, firstName: user.firstName, lastName: user.lastName.charAt(0), gender: user.gender, picture: user.picture }) 
            // {admin: user.role === "admin"});

          user.firebaseToken = firebase.auth().createCustomToken(profile.id, {"facebookId": profile.id, "role": user.role, "mdbId": user._id, "firstName": user.firstName, "lastName": user.lastName, "gender": user.gender, "picture": user.picture, "email": user.email});
          // user.firebaseToken = firebaseToken;
          
          if (profile._json) {
            user.facebook = profile._json;
            user.picture = profile.photos ? profile.photos[0].value : user.picture
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

          if (!user.intercomHash) {
            //Used for intercom secure mode
            var hmac = crypto.createHmac('sha256', config.intercomSecret);
            hmac.update(user._id.toString());
            user.intercomHash = hmac.digest('hex');
            console.log("Created intercom hash for " + user.firstName + " " + user.lastName)
          } else {
            console.log(user.firstName + " " + user.lastName + " already has an intercom hash.")
          }
                  
          if (!user.trialStart) {
            user.trialStart = new Date();
            user.trialDurationDays = 7;
          }

          user.save(function(err) {
            if (err) return done(err);
            //Firebase authentication
            // var ref = new Firebase("https://bodyapp.firebaseio.com/");
            var usersRef = ref.child("fbUsers");  
            // var userId = user._id.toString();
            
            // var token = tokenGenerator.createToken({ uid: profile.id, some: "arbitrary", data: "here" },
            //   {admin: user.role === "admin"});
            // user.firebaseToken = token;
            // ref.authWithCustomToken(firebaseToken, function(error, authData) {
            //   if (error) {
            //     console.log("Firebase authentication failed", error);
            //   } else {
            //     console.log("Firebase authentication succeeded!");                     
            //   }
            // // }, { remember: "sessionOnly" }); //Session expires upon browser shutdown
            // }); 
            var rightNow = new Date().getTime();
            console.log(user._id)
            usersRef.child(profile.id).update({picture: user.picture, gender: user.gender, firstName: user.firstName, lastName: user.lastName.charAt(0), email: user.email})
            ref.child('usersById').child(user._id.toString()).update({firstName: user.firstName, lastName: user.lastName, email: user.email, updated: rightNow}, function(err) {
              if (err) return console.log(err);
              ref.child('usersById').child(user._id.toString()).child('trialStart').once('value', function(snapshot) {
                if (!snapshot.exists()) ref.child('usersById').child(user._id.toString()).update({trialStart: rightNow, trialDurationDays: 7}, function(err) {
                  if (err) return console.log(err)
                  console.log("Added trial start for user " + user._id)
                })
              })
            })
            // passport.authenticate('facebook', { authType: 'rerequest', scope: ['user_friends'] });
            return done(err, user);
          })
        }
      })
    }
  ));
};

// function sendWelcomeEmail(user) {
//   var emailAddress = user.email
//     fs.readFile(__dirname + '../user/emails/welcomeEmail.html', function (err, html) {
//       if (err) throw err; 
//       var welcomeEmail = html
//       // fs.readFile(__dirname + '/emails/welcomeEmailHeader.html', function (err, html) {
//       //   if (err) throw err; 
//       //   var welcomeEmailHeader = html
//       var data = {
//         from: from_who,
//         to: emailAddress,
//         subject: 'Welcome To The Club',
//         html: welcomeEmail.toString()
//       }
//       // if (!user.welcomeEmailSent) {
//       mailgun.messages().send(data, function (err, body) {
//         //If there is an error, render the error page
//         if (err) {
//           console.log("Error sending welcome email to " + emailAddress)
//           console.log(err)
//           res.status(400).send("Error sending welcome email to " + emailAddress);
//         }
//         else {
//           user.welcomeEmailSent = new Date();
//           user.save(function(err) {
//             if (err) return validationError(res, err);
//             res.status(200).json(user);
//           });    
//         }
//       });
//       // } else {
//       //   res.status(500).send("User welcome email has previously been sent.")
//       // }
//       // }); 
//     });  
// }
