'use strict';

var User = require('./user.model');
var passport = require('passport');
var config = require('../../config/environment');
var jwt = require('jsonwebtoken');
var stripe = require("stripe")(config.stripeOptions.apiKey);
var flash = require('req-flash');

var validationError = function(res, err) {
  return res.status(422).json(err);
};

/**
 * Get list of users
 * restriction: 'admin'
 */
exports.index = function(req, res) {
  User.find({}, '-salt -hashedPassword', function (err, users) {
    if(err) return res.status(500).send(err);
    res.status(200).json(users);
  });
};

/**
 * Creates a new user
 */
exports.create = function (req, res, next) {
  var newUser = new User(req.body);
  newUser.provider = 'local';
  newUser.role = 'user';
  if(!newUser.isNew || newUser.stripe.customerId) return next();
  newUser.createCustomer(function(err){
    if (err) return next(err);
    next();
  });
  newUser.save(function(err, user) {
    if (err) return validationError(res, err);
    var token = jwt.sign({_id: user._id }, config.secrets.session, { expiresInMinutes: 60*5 });
    res.json({ token: token });
  });
};

/**
 * Get a single user
 */
exports.show = function (req, res, next) {
  var userId = req.params.id;

  User.findById(userId, function (err, user) {
    if (err) return next(err);
    if (!user) return res.status(401).send('Unauthorized');
    res.json(user.profile);
  });
};

/**
 * Deletes a user
 * restriction: 'admin'
 */
exports.destroy = function(req, res) {
  User.findByIdAndRemove(req.params.id, function(err, user) {
    if(err) return res.status(500).send(err);
    return res.status(204).send('No Content');
  });
};

/**
 * Change a users password
 */
exports.changePassword = function(req, res, next) {
  var userId = req.user._id;
  var oldPass = String(req.body.oldPassword);
  var newPass = String(req.body.newPassword);

  User.findById(userId, function (err, user) {
    if(user.authenticate(oldPass)) {
      user.password = newPass;
      user.save(function(err) {
        if (err) return validationError(res, err);
        res.status(200).send('OK');
      });
    } else {
      res.status(403).send('Forbidden');
    }
  });
};

/**
 * Get my info
 */
exports.me = function(req, res, next) {
  var userId = req.user._id;
  User.findOne({
    _id: userId
  }, '-salt -hashedPassword', function(err, user) { // don't ever give out the password or salt
    if (err) return next(err);
    if (!user) return res.status(401).send('Unauthorized');
    res.json(user);
  });
};

/**
 * Authentication callback
 */
exports.authCallback = function(req, res, next) {
  res.redirect('/');
};

// Adds or updates a users card using Stripe integration.
exports.postBilling = function(req, res, next){
  // console.log(req.body)
  // var stripeToken = req.body.stripeToken;
  // var userEmail = req.body.stripeEmail;

  // stripe.customers.create({
  //   source: stripeToken,
  //   plan: "basicSubscription",
  //   email: userEmail,
  //   description: "Created subscription during inital private beta"
  // }, function(err, customer) {
  //   if (err) {
  //     console.log("error creating customer: " + err)
  //   } else {
  //     console.log("customer created: ")
  //     console.log(customer)
  //   }
  // });

  var stripeToken = req.body.stripeToken.id;

  if(!stripeToken){
    // req.flash('errors', { msg: 'Please provide a valid card.' });
    return console.log("error retrieving stripe token.")
    // res.redirect(req.redirect.failure);
  }

  User.findById(req.body.user._id, function(err, user) {
    // console.log(user)
    if (err) return next(err);
    
    var cb = function(err) {
    // user.setCard(stripeToken, user, function (err) {
      if (err) {
        if(err.code && err.code == 'card_declined'){
          console.log('Your card was declined. Please provide a valid card.');
          // req.flash('errors', { msg: 'Your card was declined. Please provide a valid card.' });
          // return res.redirect(req.redirect.failure);
        }
        // req.flash('errors', { msg: 'An unexpected error occurred.' });
        console.log('An unexpected error occurred.');
        // return res.redirect(req.redirect.failure);
      }
      console.log('Billing has been updated.');
      // req.flash('success', { msg: 'Billing has been updated.' });
      // res.redirect(req.redirect.success);
    };

    // function setCard(stripe_token, user, cb) {
    // var user = User.get();

      var cardHandler = function(err, customer) {
        if (err) return cb(err);

        if(!user.stripe.customerId){
          user.stripe.customerId = customer.id;
        }
        console.log(customer)
        var card = customer.sources.data[0];
        user.stripe.last4 = card.last4;
        user.save(function(err){
          if (err) return cb(err);
          return cb(null);
          return
        });
      };

      if(user.stripe.customerId){
        console.log("card updated. Customer not charged.")
        stripe.customers.update(user.stripe.customerId, {card: stripeToken}, cardHandler);
      } else {
        console.log("User didn't have active subscription.  Charging subscription")
        stripe.customers.create({
          email: user.email,
          source: stripeToken,
          plan: "basicSubscription",
          description: "Created subscription during inital private beta"
        }, cardHandler);
      }
    // };
  });
};



// exports.postPlan = function(req, res, next){
//   console.log(req)
//   var plan = req.body.plan;
//   var stripeToken = null;

//   if(plan){
//     plan = plan.toLowerCase();
//   }

//   if(req.body.user.stripe.plan == plan){
//     req.flash('info', {msg: 'The selected plan is the same as the current plan.'});
//     return res.redirect(req.redirect.success);
//   }

//   if(req.body.token){
//     stripeToken = req.body.token.id;
//   }

//   if(!req.user.stripe.last4 && !req.body.stripeToken){
//     req.flash('errors', {msg: 'Please add a card to your account before choosing a plan.'});
//     return res.redirect(req.redirect.failure);
//   }

//   User.findById(req.user._id, function(err, user) {
//     if (err) return next(err);

//     user.setPlan(plan, stripeToken, function (err) {
//       var msg;

//       if (err) {
//         if(err.code && err.code == 'card_declined'){
//           msg = 'Your card was declined. Please provide a valid card.';
//         } else if(err && err.message) {
//           msg = err.message;
//         } else {
//           msg = 'An unexpected error occurred.';
//         }

//         req.flash('errors', { msg:  msg});
//         return res.redirect(req.redirect.failure);
//       }
//       req.flash('success', { msg: 'Plan has been updated.' });
//       res.redirect(req.redirect.success);
//     });
//   });
// };
