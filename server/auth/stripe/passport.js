var passport = require('passport');
// var StripeStrategy = require('passport-stripe').Strategy;
var StripeStrategy = require('./strategy');
// var Firebase = require('firebase');

var firebase = require('firebase');
var baseRef = firebase.database().ref()

exports.setup = function (User, config) {

  var stripe = require("stripe")(config.stripeOptions.apiKey);
  passport.use(new StripeStrategy({
      clientID: config.stripe.clientID,
      // ca_8NvwJNVopcVHsPMB93KDBXzZoIXJ7cW1
      // clientID: "ca_8NvwJNVopcVHsPMB93KDBXzZoIXJ7cW1",
      clientSecret: config.stripe.clientSecret,
      callbackURL: config.stripe.callbackURL,
      passReqToCallback: true
    },
    function(req, accessToken, refreshToken, stripe_properties, done) {
      var dataToSave = stripe_properties;
      dataToSave.refreshToken = refreshToken;
      dataToSave.applicationFeePercent = 30;
      var ref = baseRef.child('studios').child(req.query.state);
      // var firebaseToken = tokenGenerator.createToken({ uid: "excellentBodyServer" });

      var auth = firebase.auth();
      auth.signInWithCustomToken(config.firebaseSecret).then(function(user) {
          // checkIfStudioAdmin()
      }); 
      ref.authWithCustomToken(config.firebaseSecret, function(error, authData) {
        if (error) {
          console.log("Firebase server authentication failed", error);
        } else {
          console.log("Firebase server authentication succeeded!", authData);
          ref.child("stripeConnected").update(dataToSave, function(err) {
            if (err) return console.log(err)
            console.log("Stripe account connected for studio " + req.query.state);
            // return done();

            var stripe = require("stripe")(dataToSave.access_token);

            stripe.accounts.retrieve(
              dataToSave.stripe_user_id,
              function(err, account) {
                if (err) return console.log(err);
                ref.child("stripeConnected").child("detailedAccountInfo").update(account, function(err) {
                  if (err) return console.log(err);
                  console.log("Detailed stripe information for account " + account.id + " saved")
                  return done();      
                })
              }
            );
          })
        }
      // }, { remember: "sessionOnly" }); //Session expires upon browser shutdown
      }); 
      
      // User.findOrCreate({ stripeId: stripe_properties.stripe_user_id }, function (err, user) {
      //   return done(err, user);
      // });
    }
  ));
};


    