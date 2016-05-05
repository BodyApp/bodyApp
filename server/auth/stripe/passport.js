var passport = require('passport');
// var StripeStrategy = require('passport-stripe').Strategy;
var StripeStrategy = require('./strategy');
var Firebase = require('firebase');

exports.setup = function (User, config) {

  passport.use(new StripeStrategy({
      // clientID: config.stripe.clientID,
      clientID: "ca_8NvwFunaEsSeZJ56Ez9yb1XhXaDR00bE",
      clientSecret: "sk_test_FcBN0w7tedfz76of38xr0qr4",
      callbackURL: config.stripe.callbackURL,
      passReqToCallback: true
    },
    function(req, accessToken, refreshToken, stripe_properties, done) {
      var dataToSave = stripe_properties;
      dataToSave.refreshToken = refreshToken;
      dataToSave.applicationFeePercent = 30;
      var ref = new Firebase("https://bodyapp.firebaseio.com/studios/" + req.query.state);
      ref.child("stripeConnected").update(dataToSave, function(err) {
        if (err) return console.log(err)
        console.log("Stripe account connected for studio " + req.query.state);
        return done();
      })
      // User.findOrCreate({ stripeId: stripe_properties.stripe_user_id }, function (err, user) {
      //   return done(err, user);
      // });
    }
  ));
};


    