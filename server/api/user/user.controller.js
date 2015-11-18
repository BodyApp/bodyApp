'use strict';

var User = require('./user.model');
var passport = require('passport');
var config = require('../../config/environment');
var jwt = require('jsonwebtoken');
var stripe = require("stripe")(config.stripeOptions.apiKey);
// var flash = require('req-flash');

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

exports.getInstructors = function(req, res) {
  var instructors = "instructor"
  User.find({role: instructors}, '-salt -hashedPassword', function (err, users) {
    if(err) return res.status(500).send(err);
    res.status(200).json(users);
  });
};

exports.getAdmins = function(req, res) {
  var admins = "admin"
  User.find({role: admins}, '-salt -hashedPassword', function (err, users) {
    if(err) return res.status(500).send(err);
    res.status(200).json(users);
  });
};

exports.getUser = function(req, res, next) {
  console.log(req)
  var userId = req.body.id;
  User.findOne({
    _id: userId
  }, '-salt -hashedPassword', function(err, user) { // don't ever give out the password or salt
    if (err) return next(err);
    if (!user) return res.status(401).send('Unauthorized');
    res.json(user);
  });
}

/**
 * Creates a new user
 */
exports.create = function (req, res, next) {
  var newUser = new User(req.body);
  newUser.provider = 'local';
  newUser.role = 'user';

  // function stripeCallback(err){
  //   if (err) return next(err);
  //   next();
  // }

  if(!newUser.isNew || newUser.stripe.customerId) return next();
  newUser.createCustomer(function(err){
    if (err) return next(err);
    next();
  });
  
  // stripe.customers.create({
  //   email: user.email
  //   }, function(err, customer){
  //     if (err) return stripeCallback(err);

  //     user.stripe.customerId = customer.id;
  //     return stripeCallback();
  // });

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
  var stripeToken = req.body.stripeToken.id;

  if(!stripeToken){
    return console.log("error retrieving stripe token.")
    // req.flash('errors', { msg: 'Please provide a valid card.' });
    // res.redirect(req.redirect.failure);
  }

  User.findById(req.body.user._id, function(err, user) {
    if (err) return next(err);
    
    var cb = function(err) {
      if (err) {
        if(err.code && err.code == 'card_declined'){
          console.log('Your card was declined. Please provide a valid card.');
          // req.flash('errors', { msg: 'Your card was declined. Please provide a valid card.' });
          // return res.redirect(req.redirect.failure);
        }
        console.log('An unexpected error occurred.');
        // req.flash('errors', { msg: 'An unexpected error occurred.' });
        // return res.redirect(req.redirect.failure);
      }
      console.log('Billing has been updated.');
      // req.flash('success', { msg: 'Billing has been updated.' });
      // res.redirect(req.redirect.success);
    };

      var cardHandler = function(err, customer) {
        if (err) return cb(err);

        // if (!user.stripe) {
        //   console.log("stripe object created on user")
        //   user.stripe = {};
        // }

        if(!user.stripe.customer.customerId){
          // user.stripe.customer = {};
          console.log("Didn't have customer ID yet.  Saving now.")
          user.stripe.customer.customerId = customer.id;
        }

        if(!user.stripe.subscription.id){
          // user.stripe.subscription = {};
          console.log("Didn't have plan saved yet.  Saving now.")
          var subData = customer.subscriptions.data[0];          
          console.log(subData)
          user.stripe.subscription.id = subData.id;
          user.stripe.subscription.name = subData.plan.id;
          user.stripe.subscription.amount = subData.plan.amount;
          user.stripe.subscription.startDate = subData.start
          user.stripe.subscription.endDate = subData.current_period_end
          user.stripe.subscription.currency = subData.plan.currency;
          user.stripe.subscription.interval = subData.plan.interval;
          user.stripe.subscription.intervalCount = subData.plan.interval_count;
          user.stripe.subscription.liveMode = subData.plan.livemode;       
        }        

      // if (!user.stripe.card) {
        // user.stripe.card = {};
        var card = customer.sources.data[0];
        console.log(card);
        user.stripe.card.id = card.id;
        user.stripe.card.last4 = card.last4;
        user.stripe.card.brand = card.brand;
        user.stripe.card.zip = card.address_zip;
        user.stripe.card.country = card.country;
        user.stripe.card.expMonth = card.exp_month;
        user.stripe.card.expYear = card.exp_year;
        user.stripe.card.fingerprint = card.fingerprint;  
      // }

        user.save(function(err){
          console.log("saving user")
          res.json(user)
          if (err) return cb(err);
          return cb(null);
          return
        });
      };

      if(user.stripe && user.stripe.customer.customerId){
        console.log("User " + user.stripe.customer.customerId + " already has ID. Card updated and customer not charged again.");
        stripe.customers.update(user.stripe.customer.customerId, {source: stripeToken}, cardHandler);
        if (user.stripe.plan) {
          return console.log("Customer " + user.stripe.customer.customerId + " already has subscription. Not charged again");
        } else {
          console.log("Customer " + user.stripe.customer.customerId + " exists, but didn't have subscription.  Resubscribing to basic.")
          stripe.customers.updateSubscription(
            user.stripe.customer.customerId,
            null,
            { plan: "basicSubscription"},
          cardHandler);
        }
      } else {
        console.log("User " + user._id + " didn't have active subscription.  Charging subscription")
        stripe.customers.create({
          email: user.email,
          source: stripeToken,
          plan: "basicSubscription",
          description: "Created subscription during inital private beta"
        }, cardHandler);
      }
  });
};

exports.addBookedClass = function(req, res, next) {
  var userId = req.user._id;
  var classToAdd = req.body.classToAdd;

  User.findById(userId, function (err, user) {
    if(err) { return err } else { 
      console.log(user);
      user.classes.push(classToAdd);
      user.save(function(err) {
        if (err) return validationError(res, err);
        res.status(200).json(user);
      });
    } 
  });
};
