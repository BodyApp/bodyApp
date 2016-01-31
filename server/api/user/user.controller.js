'use strict';

var User = require('./user.model');
var passport = require('passport');
var config = require('../../config/environment');
var jwt = require('jsonwebtoken');
var stripe = require("stripe")(config.stripeOptions.apiKey);
// var flash = require('req-flash');

var OpenTok = require('opentok'),
    opentok = new OpenTok(config.tokBoxApiKey, config.tokBoxApiSecret);

var Mailgun = require('mailgun-js');
var api_key = config.mailgunApiKey;
var from_who = config.mailgunFromWho;
var domain = 'getbodyapp.com';  

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
  var userId = req.body.userToGet;
  console.log("getting user " + userId)
  User.findOne({_id: userId}, '-salt -hashedPassword', function(err, user) { // don't ever give out the password or salt
    if (err) return next(err);
    if (!user) return res.status(200).send('No user found');
    if (user) return res.json(user.profile);
  });
}

exports.getUserAndInjuries = function(req, res, next) {
  var userId = req.body.userToGet;
  console.log("getting user " + userId)
  User.findOne({_id: userId}, '-salt -hashedPassword', function(err, user) { // don't ever give out the password or salt
    if (err) return next(err);
    if (!user) return res.status(200).send('No user found');
    if (user) return res.json({profile: user.profile, injuries: user.injuries});
  });
}

//Saves email address if there wasn't one provided by Facebook
exports.saveEmail = function (req, res, next) {
  var userId = req.user._id;
  email = req.body.email.toLowerCase()  

  User.findOne({
    _id: userId
  }, '-salt -hashedPassword', function(err, user) { // don't ever give out the password or salt
    if (err) return next(err);
    if (!user) return res.status(401).send('Unauthorized');
      user.email = email;

      user.save(function(err, user) {
        if (err) return validationError(res, err);
        res.json(user)
      });
  });
};


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
  console.log(req.body)

  if(!stripeToken){
    return console.log("error retrieving stripe token.")
    // req.flash('errors', { msg: 'Please provide a valid card.' });
    // res.redirect(req.redirect.failure);
  }

  User.findById(req.body.user._id, function(err, user) {
    if (err) return next(err);
    
    var cb = function(err) {
      if (err && err.statusCode) {
        res.status(err.statusCode).send(err)
        if(err.code){
          console.log('User ' + user._id + ' with email address ' + user.email + ' card declined. Status code ' + err.statusCode + ' - Error: ' + err.code);
        } else {
          console.log('User ' + user._id + ' with email address ' + user.email + ' card declined. Status code ' + err.statusCode + '. Unknown error');
        }
      } else if (err) {
        res.status(400).send(err)
        console.log('User ' + user._id + ' with email address ' + user.email + ' card declined. Unknown error');
      } else {
        console.log('Billing has been updated.');
      }
      // req.flash('success', { msg: 'Billing has been updated.' });
      // res.redirect(req.redirect.success);
    };

      var cardHandler = function(err, customer) {
        // console.log(third);
        if (err) return cb(err);

        // if (!user.stripe) {
        //   console.log("stripe object created on user")
        //   user.stripe = {};
        // }

        if (req.body.shippingAddress) user.shippingAddress = req.body.shippingAddress;

        if(!user.stripe.customer.customerId){
        //   // user.stripe.customer = {};
        //   console.log("Didn't have customer ID yet.  Saving now.")
          user.stripe.customer.customerId = customer.id;
        }

        if(!user.stripe.subscription.status != "active"){

          // user.stripe.customer.customerId = customer.id;
          // user.stripe.subscription = {};
          console.log("Didn't have plan saved yet.  Saving now.")
          //Only part of the 'subscriptions' object when user is first created
          var subData = customer.subscriptions ? customer.subscriptions.data[0] : customer;      
          console.log(subData);    
          // user.stripe.customer.customerId = customer.id;
          user.stripe.subscription.id = subData.id;
          user.stripe.subscription.name = subData.plan.id;
          user.stripe.subscription.amount = subData.plan.amount;
          user.stripe.subscription.startDate = subData.start
          user.stripe.subscription.endDate = subData.current_period_end
          user.stripe.subscription.currency = subData.plan.currency;
          user.stripe.subscription.interval = subData.plan.interval;
          user.stripe.subscription.intervalCount = subData.plan.interval_count;
          user.stripe.subscription.liveMode = subData.plan.livemode;    
          user.stripe.subscription.status = subData.status;    
        }      

        //If going to add card information, have to pull the card information any time update user subscription / card information.  Otherwise, it's incorrect.
      // if (!user.stripe.card) {
        // user.stripe.card = {};
        // if (customer.sources) {
        //   var card = customer.sources.data[0];
        //   user.stripe.card.id = card.id;
        //   user.stripe.card.last4 = card.last4;
        //   user.stripe.card.brand = card.brand;
        //   user.stripe.card.zip = card.address_zip;
        //   user.stripe.card.country = card.country;
        //   user.stripe.card.expMonth = card.exp_month;
        //   user.stripe.card.expYear = card.exp_year;
        //   user.stripe.card.fingerprint = card.fingerprint;  
        // } 
        // else {
        // stripe.customers.retrieve(
        //   customer.id, cardHandler)
        // }
      // }

        user.save(function(err){
          res.json(user)
          if (err) return cb(err);
          return cb(null);
          return
        });
      };

      if(user.stripe.subscription.status === "active"){
        console.log("User " + user.stripe.customer.customerId + " already has ID and subscription. Card updated and customer not charged again.");
        stripe.customers.update(user.stripe.customer.customerId, {source: stripeToken}, cardHandler);
        // if (user.stripe.subscription.status === "active") {
        //   return console.log("Customer " + user.stripe.customer.customerId + " already has subscription. Not charged again");
        // } else {
        //   console.log("Customer " + user.stripe.customer.customerId + " exists, but didn't have subscription.  Resubscribing to basic.")
        //   stripe.customers.updateSubscription(
        //     user.stripe.customer.customerId,
        //     null,
        //     { plan: "basicSubscription"},
        //   cardHandler);
        // }
      } else {     
        if (user.stripe.customer.customerId) {
          console.log("User " + user.stripe.customer.customerId + " didn't have active subscription.  Creating new subscription")
          stripe.customers.createSubscription(
            user.stripe.customer.customerId, {
              source: stripeToken,
              plan: "pilotSubscription"
            }, cardHandler
          );
        } else {
          console.log("Creating new stripe customer and new subscription.")
          stripe.customers.create({
            email: user.email,
            source: stripeToken,
            plan: "pilotSubscription",
            // coupon: "BODY4AMONTH",
            description: "Created subscription during pilot"
          }, cardHandler);
        }
      }
  });
};

exports.getSubscription = function(req, res, next){
  User.findById(req.params.id, function(err, user) {
    if (err) return next(err);
    
    var cb = function(err) {
      if (err) {
        console.log('An unexpected error occurred. ' + err);
      }
      console.log('Subscription retrieved and saved.');
    };

    var subscriptionHandler = function(err, customer) {
      console.log(customer);
      if (err) return cb(err);

      var subData = customer.subscriptions ? customer.subscriptions.data[0] : customer;      
      console.log(subData);    
      // user.stripe.customer.customerId = customer.id;
      user.stripe.subscription.id = subData.id;
      user.stripe.subscription.name = subData.plan.id;
      user.stripe.subscription.amount = subData.plan.amount;
      user.stripe.subscription.startDate = subData.start
      user.stripe.subscription.endDate = subData.current_period_end
      user.stripe.subscription.currency = subData.plan.currency;
      user.stripe.subscription.interval = subData.plan.interval;
      user.stripe.subscription.intervalCount = subData.plan.interval_count;
      user.stripe.subscription.liveMode = subData.plan.livemode;    
      user.stripe.subscription.status = subData.status;    

      user.save(function(err){
        res.json(user)
        if (err) return cb(err);
        return cb(null);
        return
      });
    };

    if (user.stripe.customer.customerId) {
      stripe.customers.retrieve(
        user.stripe.customer.customerId,
        subscriptionHandler
      );
    }
  });
};

exports.cancelSubscription = function(req, res, next) {
  var currentUser = req.body.user
  User.findById(currentUser._id, function(err, user) {
    stripe.customers.cancelSubscription(
      user.stripe.customer.customerId,
      user.stripe.subscription.id,
      function(err, confirmation) {
        if (err) return cb(err)
        console.log(confirmation);
        user.stripe.subscription.status = confirmation.status;
        // .id;
        // delete user.stripe.subscription.name;
        // delete user.stripe.subscription.amount;
        // delete user.stripe.subscription.startDate;
        // delete user.stripe.subscription.endDate;
        // delete user.stripe.subscription.currency;
        // delete user.stripe.subscription.interval;
        // delete user.stripe.subscription.intervalCount;
        // delete user.stripe.subscription.liveMode;
        // user.stripe.card = {};
        user.save(function(err){
          console.log("saving user")
          res.json(user)
          if (err) return cb(err);
          return cb(null);
          return
        });
      }
    )
  })

  var cb = function(err) {
      if (err) {
        console.log('An unexpected error occurred.');
      }
      console.log('Subscription Cancelled.');
    };
}

exports.addIntroClass = function(req, res, next) {
  console.log(req.body);
  var userId = req.user._id;
  var classToAdd = req.body.classToAdd;

  User.findById(userId, function (err, user) {
    if(err) { return err } else { 
      user.classesBooked = user.classesBooked || {};
      user.classesBooked[classToAdd] = true;
      user.bookedIntroClass = true;
      user.completedNewUserFlow = true;
      user.save(function(err) {
        if (err) return validationError(res, err);
        res.status(200).json(user);
      });
    } 
  });
};

exports.cancelIntroClass = function(req, res, next) {
  console.log(req.body)
  var userId = req.user._id;
  var classToCancel = req.body.classToCancel;

  User.findById(userId, function (err, user) {
    if(err) { return err } else { 
      user.bookedIntroClass = false;
      if (user.classesBooked && user.classesBooked[classToCancel]) delete user.classesBooked[classToCancel];
      user.save(function(err) {
        if (err) return validationError(res, err);
        res.status(200).json(user);
      });
    } 
  });
};

exports.takeIntroClass = function(req, res, next) {
  var userId = req.user._id;
  var introClassTaken = req.body.introClassTaken;

  User.findById(userId, function (err, user) {
    if(err) { return err } else { 
      console.log(user);
      user.introClassTaken = true
      user.classesTaken.push(introClassTaken);
      if (user.classesBooked && user.classesBooked[introClassTaken]) delete user.classesBooked[introClassTaken];
      user.level = 1;
      user.save(function(err) {
        if (err) return validationError(res, err);
        res.status(200).json(user);
      });
    } 
  });
};

exports.addBookedClass = function(req, res, next) {
  var userId = req.user._id;
  var classToAdd = req.body.classToAdd;

  User.findById(userId, function (err, user) {
    if(err) { return err } else { 
      user.classesBooked = user.classesBooked || {};
      user.classesBooked[classToAdd.date] = true;
      user.save(function(err) {
        if (err) return validationError(res, err);
        res.status(200).json(user);
      });
    } 
  });
};

exports.cancelBookedClass = function(req, res, next) {
  var userId = req.user._id;
  var classToCancel = req.body.classToCancel;

  User.findById(userId, function (err, user) {
    if(err) { return err } else { 
      if (user.classesBooked && user.classesBooked[classToCancel]) delete user.classesBooked[classToCancel];
      user.save(function(err) {
        if (err) return validationError(res, err);
        res.status(200).json(user);
      });
    } 
  });
};

exports.pushTakenClass = function(req, res, next) {
  var userId = req.user._id;
  var classToPush = req.body.classToPush;

  User.findById(userId, function (err, user) {
    if(err) { return err } else { 
      user.classesTaken.push(classToPush);
      if (user.classesBooked && user.classesBooked[classToPush]) delete user.classesBooked[classToPush];
      user.save(function(err) {
        if (err) return validationError(res, err);
        res.status(200).json(user);
      });
    } 
  });
};

exports.tourtipShown = function(req, res, next) {
  var userId = req.user._id;
  var dateShown = req.body.date;

  User.findById(userId, function (err, user) {
    if(err) { return err } else { 
      user.tourtipShown = dateShown;
      user.save(function(err) {
        if (err) return validationError(res, err);
        res.status(200).json(user);
      });
    } 
  });
};

exports.saveClassTaught = function(req, res, next) {
  var classToAdd = req.body.classToAdd;
  var userToAddClassTo = req.body.userToAddClassTo
  var userId = userToAddClassTo._id

  User.findById(userId, function (err, user) {
    if(err) { return err } else { 
      user.classesTaught.push(classToAdd);
      user.save(function(err) {
        if (err) return validationError(res, err);
        res.status(200).json(user);
      });
    } 
  });
};

exports.addRating = function(req, res, next) {
  console.log(req.body)
  // var userId = req.user._id;
  var trainerId = req.body.trainer;
  var rating = req.body.rating

  User.findById(trainerId, function (err, user) {
    if(err) { return err } else {
      if (!user) return res.status(401).send('Unauthorized');
      var currentRating = user.trainerRating * user.trainerNumRatings;
      console.log(currentRating)
      var newTotal = currentRating + Number(rating);
      console.log(newTotal)
      user.trainerNumRatings += 1;
      console.log(user.trainerNumRatings)
      user.trainerRating = newTotal / user.trainerNumRatings;
      console.log(user.trainerRating)
      user.save(function(err) {
        if (err) return validationError(res, err);
        res.status(200).json({trainerRating: user.trainerRating, trainerNumRatings: user.trainerNumRatings});
        // res.status(200).json({user});
      });
    } 
  });
};

exports.saveResult = function(req, res, next) {
  var userId = req.user._id;

  User.findById(userId, function (err, user) {
    if(err) { return err } else {
      if (!user) return res.status(401).send('Unauthorized');
      user.results = user.results || {};
      user.results[req.body.date] = {
        score: req.body.score,
        comment: req.body.comment,
        wod: req.body.wod,
        dateTime: req.body.dateTime,
        weekOf: req.body.weekOf,
        date: req.body.date
      }
      user.markModified(req.body.date);
      user.save(function(err) {
        if (err) return validationError(res, err);
        res.status(200).json({user});
      });
    } 
  });
};

exports.saveInjuries = function(req, res, next) {
  var injuries = req.body.injuryString;
  var userId = req.user._id

  User.findById(userId, function (err, user) {
    if(err) { return err } else { 
      user.injuries = injuries;
      user.save(function(err) {
        if (err) return validationError(res, err);
        res.status(200).json(user);
      });
    } 
  });
};

exports.createTokBoxSession = function(req, res, next) {
  // The session will the OpenTok Media Router:
  opentok.createSession({mediaMode:"routed"}, function(err, session) {
    if (err) return console.log(err);
    // save the session.sessionId back in firebase
    res.status(200).json(session);
  });
};

exports.createTokBoxToken = function(req, res, next) {

  var token = opentok.generateToken(req.body.sessionId, {
    expireTime: (new Date().getTime() / 1000)+(24 * 60 * 60), // in one day, which is the default
    data: req.user._id.toString(),
    role: "publisher"
  })
  // , function(token) {
    res.json({ token: token }); 
  // })
}

 // Send a message to the specified email address when you navigate to /submit/someaddr@email.com
// The index redirects here
exports.sendWelcomeEmail = function(req,res) {
  var emailAddress = req.body.email;
    //We pass the api_key and domain to the wrapper, or it won't be able to identify + send emails
    var mailgun = new Mailgun({apiKey: api_key, domain: domain});

    var data = {
    //Specify email data
      from: from_who,
    //The email to contact
      to: emailAddress,
    //Subject and text data  
      subject: 'Your BODY Account is Active!',
      html: 'Hello, This is not a plain-text email, I wanted to test some spicy Mailgun sauce in NodeJS! <a href="http://0.0.0.0:3030/validate?' + req.params.mail + '">Click here to add your email address to a mailing list</a>'
    }

    //Invokes the method to send emails given the above data with the helper library
    mailgun.messages().send(data, function (err, body) {
        //If there is an error, render the error page
        if (err) {
          console.log("Error sending welcome email to " + email)
        }
        else {
          User.findById(req.user._id, function (err, user) {
            if(err) { return err } else { 
              user.welcomeEmailSent = new Date();
              user.save(function(err) {
                if (err) return validationError(res, err);
                res.status(200).json(user);
              });
            } 
          });
        }
    });
};
