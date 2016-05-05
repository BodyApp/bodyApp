var passport = require('passport');
var StripeStrategy = require('passport-stripe').Strategy;
// var StripeStrategy = require('./strategy');
var config = require('../../config/environment');

exports.setup = function (User, config) {
  passport.use(new StripeStrategy({
      // clientID: config.stripe.clientID,
      clientID: "ca_8NvwFunaEsSeZJ56Ez9yb1XhXaDR00bE",
      clientSecret: "sk_test_FcBN0w7tedfz76of38xr0qr4",
      callbackURL: config.stripe.callbackURL
    },
    function(accessToken, refreshToken, stripe_properties, done) {
      console.log(accessToken)
      console.log(refreshToken)
      console.log(stripe_properties)
      return done();
      // User.findOrCreate({ stripeId: stripe_properties.stripe_user_id }, function (err, user) {
      //   return done(err, user);
      // });
    }
  ));
};


    