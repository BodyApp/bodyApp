'use strict';

var User = require('./user.model');
var passport = require('passport');
var config = require('../../config/environment');
var jwt = require('jsonwebtoken');
var stripe = require("stripe")(config.stripeOptions.apiKey);
// var flash = require('req-flash');
var fs = require('fs')
var moment = require('moment-timezone')

var OpenTok = require('opentok'),
    opentok = new OpenTok(config.tokBoxApiKey, config.tokBoxApiSecret);

var Mailgun = require('mailgun-js');
var api_key = config.mailgunApiKey;
var from_who = config.mailgunFromWho;
var domain = 'getbodyapp.com';  
var mailgun = new Mailgun({apiKey: api_key, domain: domain});
// var classBookedMailingList = mailgun.lists('classbooked@getbodyapp.com').info().address;

var firebase = require('firebase');
var ref = firebase.database().ref()
var auth = firebase.auth();

// var FirebaseTokenGenerator = require("firebase-token-generator");
// var tokenGenerator = new FirebaseTokenGenerator(config.firebaseSecret);

// var ref = new Firebase("https://bodyapp.firebaseio.com/");

const crypto = require("crypto");

  // console.log(__dirname)

// var welcomeEmailHtml = require('../emails/welcomeEmail')
// console.log(welcomeEmailHtml)

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

exports.getMembersOfStudio = function(req, res) {
  var studio = req.body.studioId;
  // User.find({stripe: 
  //   {
  //     subscription: {
  //       status: "active"
  //     }
  //   }
  // }, '-salt -hashedPassword', function (err, users) {
  //   console.log(users)
  //   if(err) return res.status(500).send(err);
  //   res.status(200).json(users);
  // });
  User.find({'stripe.subscription.status': 'active'}, '-salt -hashedPassword', function (err, users) {
    console.log(users)
    if(err) return res.status(500).send(err);
    res.status(200).json(users);
  }).sort('lastName');
};

exports.getInstructorByEmail = function(req, res, next) {
  var email = req.body.email;
  console.log("getting instructor with email " + email)
  User.findOne({email: email}, '-salt -hashedPassword', function(err, user) { // don't ever give out the password or salt
    if (err) return next(err);
    if (!user) return res.status(200).send('No instructor found');
    if (user) return res.json(user.instructorProfile);
  });
}

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

exports.getInjuries = function(req, res, next) {
  var toFindId = req.body.userToGet;
  User.findOne({_id: req.user._id}, '-salt -hashedPassword', function(err, user) {
    if (err) return next(err);
    if (user.role === "admin" || user.role === "instructor") {
      User.findOne({_id: toFindId}, '-salt -hashedPassword', function(err, user) { // don't ever give out the password or salt
        if (err) return next(err);
        if (!user) return res.status(200).send('No user found');
        if (user) return res.json({injuries: user.injuries});
      });    
    }
  })
}

//Saves email address if there wasn't one provided by Facebook
exports.saveEmail = function (req, res, next) {
  var userId = req.user._id;
  var email = req.body.email.toLowerCase()  

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
  console.log(req.body)
  User.findOne({
    email: req.body.email.toLowerCase()
  },
  function(err, user) {
    if (err) {
      return done(err);
    }
    if (!user) {
      var newUser = new User(req.body);
      newUser.provider = 'local';
      newUser.role = 'user';
      newUser.level = newUser.level || 0;

      var firebaseToken = tokenGenerator.createToken({ uid: "local", mdbId: newUser._id, role: newUser.role, firstName: newUser.firstName, lastName: newUser.lastName.charAt(0), gender: newUser.gender })
      newUser.firebaseToken = firebaseToken;
      newUser.lastLoginDate = newUser.signUpDate;
      newUser.signUpDate = new Date();
      newUser.picture = newUser.gender === 'male' ? 'https://www.getbodyapp.com/assets/images/big-guy-overlay.png' : 'https://www.getbodyapp.com/assets/images/icons/fit-girl.png';

      newUser.save(function(err, user) {
        if (err) return validationError(res, err);
        
        ref.authWithCustomToken(firebaseToken, function(error, authData) {
          if (error) {
            console.log("Firebase authentication failed", error);
          } else {
            console.log("Firebase authentication succeeded!", authData);
          }
        // }, { remember: "sessionOnly" }); //Session expires upon browser shutdown
        }); 

        var token = jwt.sign({_id: user._id }, config.secrets.session, { expiresIn: '5d'});
        res.json({ token: token });
      });
    } else {
      res.send("That email address is already in use.")
    }
  })
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

exports.checkCoupon = function(req, res, next){
  var couponString = req.body.couponString;

  if(!couponString){
    return console.log("error retrieving coupon code.")
    res.status(400).send("No coupon sent")
  }

  stripe.coupons.retrieve(couponString, function(err, coupon) {
    console.log(coupon)
    res.status(200).json(coupon);
  })
};

exports.generateReferralCode = function(req, res, next){
  User.findById(req.user._id, '-salt -hashedPassword', function(err, user) {
    if (err) return next(err);

    stripe.coupons.create({
      percent_off: 50,
      duration: 'once',
      metadata: {
        "referrerId": user._id.toString(),
        "type": "referralCode",
        "referrerFirstName": user.firstName,
        "referrerLastName": user.lastName,
        "referrerEmail": user.email,
        "referrerFacebookId": user.facebookId,
        "text": "50% off first month!"
      }
      // id: randomString
    }, function(err, coupon) {
      
      // console.log("Coupon " + coupon.id + " created in Stripe")
      if (err) {console.log(err); return res.status(400).send(err);}
      console.log(coupon)
      user.referralCode = coupon.id;
      user.save(function(err){
        if (err) return console.log(err);
        return res.status(200).json(user)
      });
    });
  })
};

exports.referredBy = function(req, res, next) {
  var referredBy = req.body.referredBy;

  User.findById(req.user._id, '-salt -hashedPassword', function(err, user) {
    if (err) return next(err);
    user.referredBy = referredBy;
    user.save(function(err) {
    if (err) return console.log(err)
      User.findById(user._id, '-salt -hashedPassword', function(err, referringUser) {
        referringUser.usersReferred = referringUser.usersReferred || {};
        referringUser.usersReferred[user.id];
        referringUser.save(function(err) {
          if(err) return console.log(err)
            return res.status(200).json(user);
        })
      })
    })
  })
}

exports.generateSingleParentCoupon = function(req, res, next){
  User.findById(req.user._id, '-salt -hashedPassword', function(err, user) {
    if (err) return next(err);
    if (user.stripe.subscription.status === "active") {
      stripe.coupons.create({
        percent_off: 100,
        duration: 'repeating',
        duration_in_months: 3,
        max_redemptions: 1,
        redeem_by: 1458619199,
        metadata: {
          "referrerId": user._id.toString(),
          "type": "singleParentCampaign",
          "text": "3 months free!",
          "referrerFirstName": user.firstName,
          "referrerLastName": user.lastName,
          "referrerEmail": user.email
        }
        // id: randomString
      }, function(err, coupon) {
        
        // console.log("Coupon " + coupon.id + " created in Stripe")
        if (err) {console.log(err); return res.status(400).send(err);}
        user.singleParentCode = coupon.id;
        user.save(function(err){          
          res.status(200).json(user)
          sendSubscriberEmail(user)
          if (err) return console.log(err);
          return
        });
      });
    }
  })
};

// Adds or updates a users card using Stripe integration.
exports.postBilling = function(req, res, next){
  var stripeToken = req.body.stripeToken.id;
  var shippingAddress = req.body.shippingAddress;
  var coupon = req.body.coupon;
  var studioId = req.body.studioId;

  if(!stripeToken){
    return console.log("error retrieving stripe token.")
    // req.flash('errors', { msg: 'Please provide a valid card.' });
    // res.redirect(req.redirect.failure);
  }

  User.findById(req.user._id, '-salt -hashedPassword', function(err, user) {
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
        
        user.level = 1;
        // if (!user.stripe) {
        //   console.log("stripe object created on user")
        //   user.stripe = {};
        // }

        if (coupon) {
          user.mostRecentCoupon = coupon.id
          console.log(coupon.id)
          User.findOne({referralCode: coupon.id}, '-salt -hashedPassword', function (err, pulledUser) {
            if(err) return console.log(err);
            if(pulledUser) {
              pulledUser.referrals = pulledUser.referrals || {}
              pulledUser.referrals[user._id] = {"timeUsed":new Date().getTime(), "facebookId":user.facebookId}

              pulledUser.save(function(err){
                console.log("Successfully saved referral of user " + user._id + " by user " + pulledUser._id)
                if (err) return console.log(err);
                return
              });
            }

          });
        }

        if (shippingAddress) {
          user.shippingAddress = shippingAddress;
          sendShippingInfo(user)
        }

        // if(!user.stripe.customer.customerId){
        //   // user.stripe.customer = {};
        //   console.log("Didn't have customer ID yet.  Saving now.")
          // user.stripe.customer.customerId = customer.id;
        // }

        // if(!user.stripe.subscription.status != "active"){

          // user.stripe.customer.customerId = customer.id;
          // user.stripe.subscription = {};
          // console.log("Didn't have plan saved yet.  Saving now.")
          //Only part of the 'subscriptions' object when user is first created
          // var subData = customer.subscriptions ? customer.subscriptions.data[0] : customer;      
          // console.log(subData);    
          // user.stripe.customer.customerId = customer.id;
          // user.stripe.subscription.id = subData.id;
          // user.stripe.subscription.name = subData.plan.id;
          // user.stripe.subscription.amount = subData.plan.amount;
          // user.stripe.subscription.startDate = subData.start
          // user.stripe.subscription.endDate = subData.current_period_end
          // user.stripe.subscription.currency = subData.plan.currency;
          // user.stripe.subscription.interval = subData.plan.interval;
          // user.stripe.subscription.intervalCount = subData.plan.interval_count;
          // user.stripe.subscription.liveMode = subData.plan.livemode;    
          // user.stripe.subscription.status = subData.status;    
        // }

        user.save(function(err){
          sendSubscriberEmail(user)
          res.json(user)
          if (err) return cb(err);
          return cb(null);
          return
        });
      };

      var chargeCard = function(connectedAccount) {
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
        } else if (coupon) {     
          if (user.stripe && user.stripe.customer && user.stripe.customer.customerId) {
            console.log("User " + user.stripe.customer.customerId + " didn't have active subscription.  Creating new subscription")
            stripe.customers.createSubscription(
              user.stripe.customer.customerId, {
                source: stripeToken,
                plan: "ralabala30",
                coupon: coupon.id
              }, cardHandler
            );
          } else {
            console.log("Creating new stripe customer and new subscription.")
            stripe.customers.create({
              email: user.email,
              source: stripeToken,
              plan: "ralabala30",
              coupon: coupon.id,
              description: "Created subscription during pilot"
            }, cardHandler);
          }
        } else { //No coupon
          if (user.stripe && user.stripe.customer && user.stripe.customer.customerId) {
            console.log("User " + user.stripe.customer.customerId + " didn't have active subscription.  Creating new subscription")
            stripe.customers.createSubscription(
              user.stripe.customer.customerId, {
                source: stripeToken,
                plan: "ralabala30"
              }, cardHandler
            );
          } else {
            console.log("Creating new stripe customer and new subscription.")
            stripe.customers.create({
              email: user.email,
              source: stripeToken,
              plan: "ralabala30",
              description: "Created subscription during pilot"
            }, cardHandler);
          }
        }    
      }

    if (studioId) {
      ref.child("studios").child(studioId).child("stripeConnected").once('value', function(snapshot) {
        if (!snapshot.exists()) return chargeCard()
        chargeCard(snapshot.val())  
      })  
    } else {
      chargeCard()
    }
      
  });
};

// Adds or updates a users card using Stripe integration.
exports.postDropInBilling = function(req, res, next){
  var stripeToken = req.body.stripeToken.id;
  var shippingAddress = req.body.shippingAddress;
  var slot = req.body.slot;

  if(!stripeToken){
    return console.log("error retrieving stripe token.")
    // req.flash('errors', { msg: 'Please provide a valid card.' });
    // res.redirect(req.redirect.failure);
  }

  User.findById(req.user._id, '-salt -hashedPassword', function(err, user) {
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
        
        // user.level = 1;
        // if (!user.stripe) {
        //   console.log("stripe object created on user")
        //   user.stripe = {};
        // }

        if (shippingAddress) {
          user.shippingAddress = shippingAddress;
          // sendShippingInfo(user)
        }

        // if(!user.stripe.customer.customerId){
        //   // user.stripe.customer = {};
        //   console.log("Didn't have customer ID yet.  Saving now.")
          // user.stripe.customer.customerId = customer.id;
        // }

        user.dropInClasses = user.dropInClasses || {};
        user.dropInClasses[slot.date] = true;

        user.save(function(err){
          res.json(user)
          if (err) return cb(err);
          return cb(null);
          return
        });
      };

      if (user.stripe && user.stripe.customer && user.stripe.customer.customerId) {
        stripe.charges.create({
          amount: 1000, // amount in cents, again
          currency: "usd",
          customer: user.stripe.customer.customerId, // Previously stored, then retrieved
          metadata: {
            "classBooked": slot.date,
            "timeBooked": new Date().getTime()
          }
        }, cardHandler);
      } else {
        console.log("Creating new stripe customer for drop in class.")
        stripe.customers.create({
          email: user.email,
          source: stripeToken,
          description: "Created customer for drop in class."
        }).then(function(customer){
          stripe.charges.create({
            amount: 1000, // amount in cents, again
            currency: "usd",
            customer: customer.id, // Previously stored, then retrieved
            metadata: {
              "classBooked": slot.date,
              "timeBooked": new Date().getTime()
            }
          }, cardHandler)
        })
      }
  });
};

exports.getSubscription = function(req, res, next){
  User.findById(req.params.id, '-salt -hashedPassword', function(err, user) {
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
  var userId = req.user._id
  User.findById(userId, '-salt -hashedPassword', function(err, user) {
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

exports.saveTimezone = function(req, res, next) {
  var userId = req.user._id;
  var timezone = req.body.timezone;
  console.log(userId);

  User.findById(userId, '-salt -hashedPassword', function (err, user) {
    if(err) { return err } else { 
      user.timezone = timezone;
      user.save(function(err) {
        if (err) return validationError(res, err);
        res.status(200).json(user);
      });
    } 
  });
}

exports.createIntercomHash = function(req, res, next) {
  var userId = req.user._id;
  var hmac = crypto.createHmac('sha256', config.intercomSecret);
  User.findById(userId, '-salt -hashedPassword', function (err, user) {
    if(err) { return err } else { 
     //Used for intercom secure mode
      if (!user.intercomHash) {
        hmac.update(user._id.toString());
        user.intercomHash = hmac.digest('hex');
      }
      user.save(function(err) {
        if (err) return validationError(res, err);
        console.log("Created intercom hash for " + user.firstName + " " + user.lastName)
        res.status(200).json(user);
      });
    } 
  });
}

exports.createFirebaseToken = function(req, res, next) {
  var userId = req.user._id;
  User.findById(userId, '-salt -hashedPassword', function (err, user) {
    if(err) return console.log(err)
    
    user.firebaseToken = firebase.auth().createCustomToken(user._id.toString(), { uid: user.facebookId, role: user.role, mdbId: user._id, firstName: user.firstName, lastName: user.lastName.charAt(0), gender: user.gender, picture: user.picture });

    user.save(function(err) {
      if (err) return validationError(res, err);
      res.status(200).json(user.firebaseToken);
    });
  });
}

function sendSubscriberEmail(user) {
  if (!user.email) return;
  var emailAddress = user.email;
  fs.readFile(__dirname + '/emails/subscribedEmail.html', function (err, html) {
    if (err) throw err; 
    var subscribedTemplate = html
    fs.readFile(__dirname + '/emails/subscribedEmailHeader.html', function (err, html) {
      if (err) throw err;
      var subscribedHeader = html
      var data = {
        from: from_who,
        to: emailAddress,
        subject: "You're a Member Now!",
        html: subscribedHeader.toString() + '<h1 style="padding-bottom: 5px; font-family: Helvetica, sans-serif; letter-spacing: 0.01em; line-height: 30px; font-weight: 200; font-size: 30px; color: #224893; margin: 0px;">Thanks for subscribing, ' + user.firstName + '!</h1><h4 style="font-family: sans-serif, arial; letter-spacing: 0.01em; line-height: 18px; font-weight: 200; font-size: 14px; color: #747475; margin: 0px;">Now that you are a member, please consider becoming an ambassador by sharing your unique code <strong><a href = "https://www.getbodyapp.com/referral/'+ user.referralCode + '">https://www.getbodyapp.com/referral/'+user.referralCode+'</a></strong> with anyone you think would love BODY. For each new member that arrived at BODY using your url, you will get $15 towards future subscriptions and they will get 50% off their first month!</h4></td></tr></tbody></table></td></tr></tbody></table>' + subscribedTemplate.toString()
      }
      //Invokes the method to send emails given the above data with the helper library
      mailgun.messages().send(data, function (err, body) {
        //If there is an error, render the error page
        if (err) {
          console.log(err)
          console.log("Error sending subscription email to " + emailAddress)
        }
        else {
          console.log("Sent subscription email to " + emailAddress)
        }
      });
    }); 
  });   
}

function sendClassBookedEmailToStudio(studioId, userFirstName, userLastName, classDateTime, classType) {
  var toSendTo = [];
  var dateTime = formattedDateTime(classDateTime)

  ref.child('studios').child(studioId).child('admins').once('value', function(snapshot) {
    snapshot.forEach(function(admin) {
      ref.child('fbUsers').child(admin.val().facebookId).once('value', function(info) {
        console.log(admin.val())
        var data = {
          from: from_who,
          to: info.val().email,
          bcc: "concierge@getbodyapp.com",
          subject: "Booked: " + dateTime.date + " " + dateTime.classTime + " " + classType,
          text: "Hey " + info.val().firstName + ", " + userFirstName + ' ' + userLastName + " just booked " + classType + " for " + dateTime.date + " at " + dateTime.classTime + ". \n\nHave a great class!\n\n--BODY Team" 
        };

        mailgun.messages().send(data, function (error, body) {
          console.log("Sent email to " + info.val().email + " that " + userFirstName + " " + userLastName + " booked a " + classType + " class.");
        });
      })
    })
  })
}

// function sendClassBookedEmailToAdmins(userFirstName, userLastName, classDateTime, level) {
//   var dateTime = formattedDateTime(classDateTime)
//   var data = {
//     from: from_who,
//     to: 'classbooked@getbodyapp.com',
//     subject: dateTime.date + " " + dateTime.classTime + " " + level + " Class Booked",
//     text: userFirstName + ' ' + userLastName + " booked a " + level + " class for " + dateTime.date + " at " + dateTime.classTime 
//   };

//   mailgun.messages().send(data, function (error, body) {
//     console.log("Sent email to admins that " + userFirstName + " " + userLastName + " booked a " + level + " class.");
//   });
// }

function sendClassCancelledEmailToAdmins(userFirstName, userLastName, classDateTime, studioId) {
  console.log(classDateTime)
  var dateTime = formattedDateTime(classDateTime)
  var data = {
    from: from_who,
    to: 'classbooked@getbodyapp.com',
    subject: "User cancelled class: " + dateTime.date + " " + dateTime.classTime,
    text: userFirstName + ' ' + userLastName + " cancelled their class on " + dateTime.date + " at " + dateTime.classTime + "."
  };
  // setTimeout(function() {
  //   var rightNow = new Date().getTime()
  //   console.log(rightNow);
  //   ref.child('studios').child(studioId).child("bookings").orderByKey().startAt(rightNow.toString()).once('value', function(snapshot) { //Have to do this because can't specifically reference something that doesn't exist
  //     console.log("yeah")
  //     if (snapshot.child(classDateTime).exists()) { 
  //       data.text = userFirstName + ' ' + userLastName + " cancelled their class on " + dateTime.date + " at " + dateTime.classTime + ". There are still "+ snapshot.numChildren() + " users booked for the class."
  //     } else {
  //       data.text = userFirstName + ' ' + userLastName + " cancelled their class on " + dateTime.date + " at " + dateTime.classTime + ". There is no longer anyone signed up for this class."    
  //     }
      mailgun.messages().send(data, function (error, body) {
        console.log("Sent email to admins that " + userFirstName + " " + userLastName + " cancelled their class.");
      });
    // })
  // }, 1000)
}

function sendShippingInfo(userInfo) {
  var shippingAddress = userInfo.shippingAddress;
  var data = {
    from: from_who,
    to: 'classbooked@getbodyapp.com',
    subject: "New subscriber: " + userInfo.firstName + " " + userInfo.lastName,
    text: "Referred by code: "+ userInfo.mostRecentCoupon + " Goals: " + userInfo.goals + ". Email: " + userInfo.email + ". Shipping Information: " + shippingAddress.shipping_name + " " + shippingAddress.shipping_address_line1 + " " + shippingAddress.shipping_address_city + " " + shippingAddress.shipping_address_state + " " + shippingAddress.shipping_address_zip + " " + shippingAddress.shipping_address_country 
  };

  mailgun.messages().send(data, function (error, body) {
    console.log("Sent email to admins that " + userInfo.firstName + " " + userInfo.lastName + " became a new subscriber.");
  });
}

exports.addIntroClass = function(req, res, next) {
  var userId = req.user._id;
  var classToAdd = req.body.classToAdd;

  User.findById(userId, '-salt -hashedPassword', function (err, user) {
    if(err) { return err } else { 
      user.classesBooked = user.classesBooked || {};
      user.classesBooked[classToAdd] = true;
      user.introClassBooked = classToAdd,
      user.classesBookedArray = user.classesBookedArray || [];
      user.classesBookedArray.push(classToAdd)
      user.bookedIntroClass = true;
      user.completedNewUserFlow = true;
      user.save(function(err) {
        if (err) return validationError(res, err);
        sendEmail(user)
        ref.child("bookings").child(classToAdd).once('value', function(snapshot) {
          console.log("There are " + snapshot.numChildren() + " people booked for this class.")
          if (snapshot.numChildren() < 2) sendClassBookedEmailToAdmins(user.firstName, user.lastName, classToAdd, "Intro")
        })
        res.status(200).json(user);
      });
    } 
  });



  function sendEmail(user) {
    if (!user.email) return;
    var emailAddress = user.email;
    var recipientName = user.firstName;
    // var mailgun = new Mailgun({apiKey: api_key, domain: domain});
    var dateTime = formattedDateTime(classToAdd, user)
    fs.readFile(__dirname + '/emails/classReserved.html', function (err, html) {
      if (err) throw err; 
      var classReservedTemplate = html
      fs.readFile(__dirname + '/emails/classReservedHeader.html', function (err, html) {
        if (err) throw err;
        var classReservedHeader = html
        var data = {
          from: from_who,
          to: emailAddress,
          subject: 'Your Intro Class Is Booked!',
          html: classReservedHeader.toString() + '<h1 style="padding-bottom: 5px; font-family: Helvetica, sans-serif; letter-spacing: 0.01em; line-height: 30px; font-weight: 200; font-size: 30px; color: #224893; margin: 0px;">High fives!</h1><h3 style="font-family: sans-serif, arial; letter-spacing: 0.01em; line-height: 18px; font-weight: 200; font-size: 18px; color: #747475; margin: 0px;">You’ve registered for the following class:</h3></td></tr></tbody></table></td></tr></tbody></table><!-- RESERVATION --><table style="border-collapse: collapse; border-spacing: 0; margin-left: auto; margin-right: auto; width: 600px;"><tbody><tr><td style="vertical-align: middle; background-color: #fff; padding: 0;" bgcolor="#fff" valign="middle"><table style="border-collapse: collapse; border-spacing: 0;" align="middle"><tbody><tr><td style="vertical-align: middle; text-align: center; width: 600px; margin: 0 auto; padding: 0px 25px;" align="center" valign="middle"><hr style="color: #DCDCDC; width: 550px; margin: 0px auto;"><h4 style="padding-top: 20px; font-family: Helvetica, sans-serif; letter-spacing: 0.01em; line-height: 22px; font-weight: 400; font-size: 20px; color: #0d1c45; margin: 0px;">Introductory Session<h5 style="padding-bottom: 10px; font-family: Helvetica, sans-serif; letter-spacing: 0.01em; line-height: 20px; font-weight: 200; font-size: 16px; color: #747475; margin: 0px;"><a>' + dateTime.date+'<br>'+ dateTime.classTime +'</a><br><a href="https://www.getbodyapp.com/" style="font-family: Helvetica, Arial, sans-serif; height: auto; min-width: 150px; line-height: 36px; font-size: 16px; font-weight: 100; letter-spacing: 1px; background-color: #224893; border-radius: 0; color: #fff; text-align: center; transition: all 0.3s ease; -webkit-transition: all 0.3s ease; -moz-transition: all 0.3s ease; text-decoration: none; padding: 10px 25px; border: 1px solid #fff; margin-top: 16px;">Your chariot awaits (Click this to join class)</a>' + classReservedTemplate.toString()
        }
        //Invokes the method to send emails given the above data with the helper library
        mailgun.messages().send(data, function (err, body) {
          //If there is an error, render the error page
          if (err) {
            console.log(err)
            console.log("Error sending intro booked email to " + emailAddress)
          }
          else {
            console.log("Sent booking confirmation email to " + emailAddress)
            if (classToAdd > new Date().getTime() + 6*60*60*1000) { //If it's further than 6 hours out
              var deliveryDate = new Date(classToAdd - 2*60*60*1000)
              var delayedData = {
                from: from_who,
                to: emailAddress,
                "o:deliverytime": deliveryDate.toUTCString(), // Send 2 hours before class
                subject: 'Reminder: Your Intro Class',
                html: classReservedHeader.toString() + '<h1 style="padding-bottom: 5px; font-family: Helvetica, sans-serif; letter-spacing: 0.01em; line-height: 30px; font-weight: 200; font-size: 30px; color: #224893; margin: 0px;">Your class reminder</h1><h3 style="font-family: sans-serif, arial; letter-spacing: 0.01em; line-height: 18px; font-weight: 200; font-size: 18px; color: #747475; margin: 0px;">Looks like you have a class coming up:</h3></td></tr></tbody></table></td></tr></tbody></table><!-- RESERVATION --><table style="border-collapse: collapse; border-spacing: 0; margin-left: auto; margin-right: auto; width: 600px;"><tbody><tr><td style="vertical-align: middle; background-color: #fff; padding: 0;" bgcolor="#fff" valign="middle"><table style="border-collapse: collapse; border-spacing: 0;" align="middle"><tbody><tr><td style="vertical-align: middle; text-align: center; width: 600px; margin: 0 auto; padding: 0px 25px;" align="center" valign="middle"><hr style="color: #DCDCDC; width: 550px; margin: 0px auto;"><h4 style="padding-top: 20px; font-family: Helvetica, sans-serif; letter-spacing: 0.01em; line-height: 22px; font-weight: 400; font-size: 20px; color: #0d1c45; margin: 0px;">Introductory Session<h5 style="padding-bottom: 10px; font-family: Helvetica, sans-serif; letter-spacing: 0.01em; line-height: 20px; font-weight: 200; font-size: 16px; color: #747475; margin: 0px;"><a>' + dateTime.date+'<br>'+ dateTime.classTime +'</a><br><a href="https://www.getbodyapp.com/" style="font-family: Helvetica, Arial, sans-serif; height: auto; min-width: 150px; line-height: 36px; font-size: 16px; font-weight: 100; letter-spacing: 1px; background-color: #224893; border-radius: 0; color: #fff; text-align: center; transition: all 0.3s ease; -webkit-transition: all 0.3s ease; -moz-transition: all 0.3s ease; text-decoration: none; padding: 10px 25px; border: 1px solid #fff; margin-top: 16px;">Your chariot awaits (Click this to join class)</a>' + classReservedTemplate.toString()
              }
              mailgun.messages().send(delayedData, function (err, body) {
              //If there is an error, render the error page
                if (err) {
                  console.log(err)
                  console.log("Error scheduling reminder email for " + emailAddress)
                }
                else {
                  console.log("Class reminder email will be sent to "+emailAddress+" on " +deliveryDate)
                }
              })
            }
          }
        });
      }); 
    });   
  }
};

exports.cancelIntroClass = function(req, res, next) {
  var userId = req.user._id;
  var classToCancel = req.body.classToCancel;

  User.findById(userId, '-salt -hashedPassword', function (err, user) {
    if(err) { return err } else { 
      user.bookedIntroClass = false;
      user.classesCancelled = user.classesCancelled || {}
      user.classesCancelled[classToCancel] = new Date().getTime()
      if (user.classesBooked && user.classesBooked[classToCancel]) delete user.classesBooked[classToCancel];
      user.save(function(err) {
        if (err) return validationError(res, err);
        console.log(user.firstName + " " + user.lastName + " just cancelled an intro class at " + classToCancel)
        res.status(200).json(user);
      });
    } 
  });
};

exports.takeIntroClass = function(req, res, next) {
  var userId = req.user._id;
  var introClassTaken = req.body.introClassTaken;

  User.findById(userId, '-salt -hashedPassword', function (err, user) {
    if(err) { return err } else { 
      console.log(user);
      user.introClassTaken = true;
      user.classesTaken.push(introClassTaken);
      if (user.classesBooked && user.classesBooked[introClassTaken]) delete user.classesBooked[introClassTaken];
      user.level = 1;
      user.save(function(err) {
        if (err) return validationError(res, err);
        sendEmail(user)
        res.status(200).json(user);
      });
    } 
  });

  function sendEmail(user) {
    if (!user.email) return;
    var emailAddress = user.email;
    var recipientName = user.firstName;
    // var mailgun = new Mailgun({apiKey: api_key, domain: domain});
    fs.readFile(__dirname + '/emails/postIntroEmail.html', function (err, html) {
      if (err) throw err; 
      var postIntroTemplate = html
      fs.readFile(__dirname + '/emails/postIntroEmailHeader.html', function (err, html) {
        if (err) throw err; 
        var postIntroHeader = html
        var data = {
          from: from_who,
          to: emailAddress,
          subject: 'You Rocked Our World!',
          html: postIntroHeader.toString() + '<p style="font-family: sans-serif, arial; letter-spacing: 0.01em; line-height: 16px; font-weight: 400; font-size: 14px; color: #1f1f1f; margin: 0px;">Hi '+user.firstName+',<br><br>We hope you had a wonderful time getting gleefully fit during our Introductory Session. After class, we hired the local high school marching band and threw a parade in your honor, waving a giant banner with your name for all to see. In commemoration of your achievements today in class, we have placed your picture on our wall as “Client of the Year.” We’re totally exhausted but can’t wait for you to come back and join the BODY club.<br><br>Thank you, thank you, thank you!<br><br>Sigh...<br><br>We miss you already. We’ll be right here at <a style="color: #224893; text-decoration: none;" href="https://www.getbodyapp.com" target="_blank">getbodyapp.com</a> patiently awaiting your return.<br><br>Love,<br>Your besties at BODY</p>' + postIntroTemplate.toString()
        }
        //Invokes the method to send emails given the above data with the helper library
        mailgun.messages().send(data, function (err, body) {
            //If there is an error, render the error page
            if (err) {
              console.log(err)
              console.log("Error sending booking confirmation email to " + emailAddress)
            }
            else {
              console.log("Sent 'intro class taken' email to " + emailAddress)
            }
        });
      }); 
    });   
  }

};

exports.addBookedClass = function(req, res, next) {
  var userId = req.user._id;
  var classToAdd = req.body.classToAdd;
  var className = req.body.className;
  var studioName = req.body.studioName;
  var studioId = req.body.studioId;
  var instructorFullName = req.body.instructorFullName;
  var classStartingUrl = req.body.classStartingUrl;
  var equipmentUnformatted = req.body.equipmentRequired;
  var classDescription = req.body.classDescription;
  var studioIconUrl = req.body.studioIconUrl;

  var equipmentRequired = "";

  if (equipmentUnformatted && equipmentUnformatted.length > 0) {
    for (var i = 0; i < equipmentUnformatted.length; i++) {
      if (i > 0) equipmentRequired += ", "
      equipmentRequired += equipmentUnformatted[i].name
    }
  }

  User.findById(userId, '-salt -hashedPassword', function (err, user) {
    if(err) return res.status(400).json(err) 
      // user.classesBooked = user.classesBooked || {};
      // user.classesBooked[classToAdd] = new Date().getTime();
      // user.classesBookedArray = user.classesBookedArray || [];
      // user.classesBookedArray.push(classToAdd)
      // user.save(function(err) {
      //   if (err) return validationError(res, err);
      sendEmail(user)
      sendClassBookedEmailToStudio(studioId, user.firstName, user.lastName, classToAdd, className);
      // ref.child("bookings").child(classToAdd).once('value', function(snapshot) {
      //   if (snapshot.numChildren() < 2) sendClassBookedEmailToAdmins(user.firstName, user.lastName, classToAdd, "Level 1")
      // })
      res.status(200).json(user);
      // });
    // } 
  });
  
  function sendEmail(user) {
    if (!user.email) return;
    var dateTime = formattedDateTime(classToAdd, user)
    var emailAddress = user.email;
    // var recipientName = user.firstName;
    // var mailgun = new Mailgun({apiKey: api_key, domain: domain});
    fs.readFile(__dirname + '/emails/classReserved.html', function (err, html) {
      if (err) throw err; 
      var classReservedTemplate = html
      fs.readFile(__dirname + '/emails/classReservedHeader.html', function (err, html) {
        if (err) throw err; 
        var classReservedHeader = html
        var data = {
          from: from_who,
          to: emailAddress,
          subject: 'Your '+ studioName + ' Class Is Booked!',
          html: classReservedHeader.toString() + '<table style="border-collapse: collapse; border-spacing: 0; margin-left: auto; margin-right: auto; width: 600px;"<tbody><tr><td style="vertical-align: middle; background-color: #fff; padding: 0;" bgcolor="#fff" valign="left"><table style="border-collapse: collapse; border-spacing: 0;" align="middle"><tbody><tr><td style="vertical-align: middle; text-align: center; width: 600px; padding: 10px 0;" align="center" valign="left"><h2 style="font-family: Helvetica, sans-serif; letter-spacing: 0.01em; line-height: 30px; font-weight: 400; font-size: 24px; color: #565a5c; margin-top: 4px;">'+studioName+' Class Reservation</h2><img src="'+studioIconUrl+'" style="border-radius: 50%; margin: 10px 0;" width="100" height="100"><h3 style="font-family: Helvetica, sans-serif; letter-spacing: 0.01em; line-height: 26px; font-weight: 400; font-size: 20px; color: #565a5c; margin-top: 4px;">You are attending '+className+' with '+instructorFullName+'</h3><h3 style="font-family: Helvetica, sans-serif; letter-spacing: 0.01em; line-height: 26px; font-weight: 400; font-size: 20px; color: #3E7EDF; margin-top: 4px;">'+dateTime.classTime+' - '+dateTime.date+'</h3><a href="'+classStartingUrl+'" style="color: white; background: #3E7EDF; font-size: 14px; padding: 7px 0; width:200px; display: inline-block; margin-top: 15px; margin-bottom: 0; -webkit-border-radius: 2px; -moz-border-radius: 2px; border-radius: 2px; border: 1px solid #3E7EDF; text-align: center; vertical-align: middle; font-weight: bold; line-height: 1.43; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; white-space: nowrap; cursor: pointer; text-decoration: none;">Join class</a></td></tr><tr><td style="vertical-align: middle; background-color: #fff; padding: 10px 0 10px 0;" bgcolor="#fff" valign="middle"><table style="border-collapse: collapse; border-spacing: 0;" align="middle"><tbody><tr><td style="text-align: left; width: 600px; padding: 0;" align="left"><hr style="clear:both; max-width:600px; border-right:0; border-bottom:1px solid #cacaca; border-left:0; border-top:0; background-color:#dbdbdb; min-height:2px; width:600px; border:none; margin:auto"></td></tr></tbody></table></td></tr><tr><td style="vertical-align: middle; background-color: #fff; padding: 0 0 10px 0;" bgcolor="#fff" valign="middle"><table style="border-collapse: collapse; border-spacing: 0;" align="middle"><tbody><tr><td style="text-align: left; width: 600px; padding: 0;" align="left"><h4 style="font-family: Helvetica, sans-serif; letter-spacing: 0.01em; line-height: 20px; font-weight: 600; font-size: 14px; color: #565a5c; margin-top: 4px;">Equipment Required:</h4><h4 style="font-family: Helvetica, sans-serif; letter-spacing: 0.01em; line-height: 20px; font-weight: 400; font-size: 14px; color: #565a5c; margin-top: 4px;">'+equipmentRequired+'</h4><h4 style="font-family: Helvetica, sans-serif; letter-spacing: 0.01em; line-height: 20px; font-weight: 600; font-size: 14px; color: #565a5c; margin-top: 15px;">Class Details:</h4><h4 style="font-family: Helvetica, sans-serif; letter-spacing: 0.01em; line-height: 20px; font-weight: 400; font-size: 14px; color: #565a5c; margin-top: 4px;">'+classDescription+'</h4></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table>' + classReservedTemplate.toString()
        }
        //Invokes the method to send emails given the above data with the helper library
        mailgun.messages().send(data, function (err, body) {
          //If there is an error, render the error page
          if (err) {
            console.log(err)
            console.log("Error sending class booked email to " + emailAddress)
          }
          else {
            console.log("Sent booking confirmation email to " + emailAddress)
            if (classToAdd > new Date().getTime() + 6*60*60*1000) { //If it's further than 6 hours out
              var deliveryDate = new Date(classToAdd - 2*60*60*1000)
              var delayedData = {
                from: from_who,
                to: emailAddress,
                "o:deliverytime": deliveryDate.toUTCString(), // Send 2 hours before class
                subject: 'Reminder: Your '+ studioName + ' Class',
                html: classReservedHeader.toString() + '<table style="border-collapse: collapse; border-spacing: 0; margin-left: auto; margin-right: auto; width: 600px;"<tbody><tr><td style="vertical-align: middle; background-color: #fff; padding: 0;" bgcolor="#fff" valign="left"><table style="border-collapse: collapse; border-spacing: 0;" align="middle"><tbody><tr><td style="vertical-align: middle; text-align: center; width: 600px; padding: 10px 0;" align="center" valign="left"><h2 style="font-family: Helvetica, sans-serif; letter-spacing: 0.01em; line-height: 30px; font-weight: 400; font-size: 24px; color: #565a5c; margin-top: 4px;">'+studioName+' Class Reservation</h2><img src="'+studioIconUrl+'" style="border-radius: 50%; margin: 10px 0;" width="100" height="100"><h3 style="font-family: Helvetica, sans-serif; letter-spacing: 0.01em; line-height: 26px; font-weight: 400; font-size: 20px; color: #565a5c; margin-top: 4px;">You are attending '+className+' with '+instructorFullName+'</h3><h3 style="font-family: Helvetica, sans-serif; letter-spacing: 0.01em; line-height: 26px; font-weight: 400; font-size: 20px; color: #3E7EDF; margin-top: 4px;">'+dateTime.classTime+' - '+dateTime.date+'</h3><a href="'+classStartingUrl+'" style="color: white; background: #3E7EDF; font-size: 14px; padding: 7px 0; width:200px; display: inline-block; margin-top: 15px; margin-bottom: 0; -webkit-border-radius: 2px; -moz-border-radius: 2px; border-radius: 2px; border: 1px solid #3E7EDF; text-align: center; vertical-align: middle; font-weight: bold; line-height: 1.43; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; white-space: nowrap; cursor: pointer; text-decoration: none;">Join class</a></td></tr><tr><td style="vertical-align: middle; background-color: #fff; padding: 10px 0 10px 0;" bgcolor="#fff" valign="middle"><table style="border-collapse: collapse; border-spacing: 0;" align="middle"><tbody><tr><td style="text-align: left; width: 600px; padding: 0;" align="left"><hr style="clear:both; max-width:600px; border-right:0; border-bottom:1px solid #cacaca; border-left:0; border-top:0; background-color:#dbdbdb; min-height:2px; width:600px; border:none; margin:auto"></td></tr></tbody></table></td></tr><tr><td style="vertical-align: middle; background-color: #fff; padding: 0 0 10px 0;" bgcolor="#fff" valign="middle"><table style="border-collapse: collapse; border-spacing: 0;" align="middle"><tbody><tr><td style="text-align: left; width: 600px; padding: 0;" align="left"><h4 style="font-family: Helvetica, sans-serif; letter-spacing: 0.01em; line-height: 20px; font-weight: 600; font-size: 14px; color: #565a5c; margin-top: 4px;">Equipment Required:</h4><h4 style="font-family: Helvetica, sans-serif; letter-spacing: 0.01em; line-height: 20px; font-weight: 400; font-size: 14px; color: #565a5c; margin-top: 4px;">'+equipmentRequired+'</h4><h4 style="font-family: Helvetica, sans-serif; letter-spacing: 0.01em; line-height: 20px; font-weight: 600; font-size: 14px; color: #565a5c; margin-top: 15px;">Class Details:</h4><h4 style="font-family: Helvetica, sans-serif; letter-spacing: 0.01em; line-height: 20px; font-weight: 400; font-size: 14px; color: #565a5c; margin-top: 4px;">'+classDescription+'</h4></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table>' + classReservedTemplate.toString()
              }
              mailgun.messages().send(delayedData, function (err, body) {
                //If there is an error, render the error page
                if (err) {
                  console.log(err)
                  console.log("Error scheduling reminder email for " + emailAddress)
                }
                else {
                  console.log("Class reminder email will be sent to "+emailAddress+" on " +deliveryDate)
                }
              })
            }
          }
        });
      }); 
    });   
  }
};

exports.cancelBookedClass = function(req, res, next) {
  var userId = req.user._id;
  var classToCancel = req.body.classToCancel;
  var studioId = req.body.studioId

  User.findById(userId, '-salt -hashedPassword', function (err, user) {
    if(err) { return err } else { 
      if (user.classesBooked && user.classesBooked[classToCancel]) delete user.classesBooked[classToCancel];
      user.save(function(err) {
        if (err) return validationError(res, err);
        console.log(user.firstName + " " + user.lastName + " just cancelled a class at " + classToCancel)        
        sendClassCancelledEmailToAdmins(user.firstName, user.lastName, classToCancel, studioId)
        res.status(200).json(user);
      });
    } 
  });
};

exports.pushTakenClass = function(req, res, next) {
  var userId = req.user._id;
  var classToPush = req.body.classToPush;

  User.findById(userId, '-salt -hashedPassword', function (err, user) {
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

  User.findById(userId, '-salt -hashedPassword', function (err, user) {
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
  var userId = req.user._id
  // var userToAddClassTo = req.body.userToAddClassTo
  // var userId = userToAddClassTo._id

  User.findById(userId, '-salt -hashedPassword', function (err, user) {
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
  var userId = req.user._id;
  //Should add something to prevent single user from submitting more than 1 rating per day.  Could be abused otherwise since giving access to trainer object.
  //Added ratingsSubmitted array, so will be easier to Dx if someone abusing.
  // var userId = req.user._id;
  var trainerId = req.body.trainer;
  var rating = req.body.rating

  User.findById(userId, '-salt -hashedPassword', function (err, user) {
    if(err) { return err } else {
      if (!user) return res.status(401).send('Unauthorized');
      console.log(user)
      user.ratingsSubmitted = user.ratingsSubmitted || [];
      user.ratingsSubmitted.push({trainer: trainerId, rating: rating})
      user.save(function(err) {
        console.log("user saved")
        if (err) return validationError(res, err);
        User.findById(trainerId, '-salt -hashedPassword', function (err, trainer) {
          if(err) { return err } else {
            if (!trainer) return res.status(401).send('Unauthorized');
            if (!trainer.trainerRating) trainer.trainerRating = 0
            if (!trainer.trainerNumRatings) trainer.trainerNumRatings = 0
            var currentRating = trainer.trainerRating * trainer.trainerNumRatings || 0;
            var newTotal = currentRating + Number(rating);
            trainer.trainerNumRatings += 1;
            trainer.trainerRating = newTotal / trainer.trainerNumRatings;
            trainer.save(function(err) {
              console.log("saved trainer");
              if (err) return validationError(res, err);
              res.status(200).json({trainerRating: trainer.trainerRating, trainerNumRatings: trainer.trainerNumRatings});
            });
          } 
        });
      });
    } 
  });
};

exports.saveResult = function(req, res, next) {
  var userId = req.user._id;

  User.findById(userId, '-salt -hashedPassword', function (err, user) {
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
        console.log("Results saved for " + userId)
        if (err) return validationError(res, err);
        res.status(200).json({user});
      });
    } 
  });
};

exports.saveInjuriesGoalsEmergency = function(req, res, next) {
  var userId = req.user._id;
  var injuries = req.body.injuryString;
  var goals = req.body.goals;
  var emergencyContact = req.body.emergencyContact;

  User.findById(userId, '-salt -hashedPassword', function (err, user) {
    if(err) { return err } else { 
      user.injuries = injuries;
      user.goals = goals;
      user.emergencyContact = emergencyContact;
      user.save(function(err) {
        if (err) return validationError(res, err);
        res.status(200).json(user);
      });
    } 
  });
};

exports.saveEmergency = function(req, res, next) {
  var userId = req.user._id;
  var emergencyContact = req.body.emergencyContact;

  User.findById(userId, '-salt -hashedPassword', function (err, user) {
    if(err) { return err } else { 
      user.emergencyContact = emergencyContact;
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
    if (err) return res.status(400).send(err);
    // save the session.sessionId back in firebase
    res.status(200).json(session);
  });
};

exports.createTokBoxToken = function(req, res, next) {
  var token;
  User.findById(req.user._id, '-salt -hashedPassword', function (err, user) {
    if(err) { return err } else { 
      if (user.role === "admin") {
        token = opentok.generateToken(req.body.sessionId, {
          expireTime: (new Date().getTime() / 1000)+(24 * 60 * 60), // in one day, which is the default
          data: req.user._id.toString(),
          role: "moderator"
        })
      } else {
        token = opentok.generateToken(req.body.sessionId, {
          expireTime: (new Date().getTime() / 1000)+(24 * 60 * 60), // in one day, which is the default
          data: req.user._id.toString(),
          role: "publisher"
        })
      }
      res.json({ token: token }); 
    } 
  });
}

 // Send a message to the specified email address when you navigate to /submit/someaddr@email.com
// The index redirects here
exports.sendWelcomeEmail = function(req,res) {
  // var mailgun = new Mailgun({apiKey: api_key, domain: domain});

  //Makes sure intro email wasn't sent.  Extra server-side security to prevent spamming.
  User.findById(req.user._id, '-salt -hashedPassword', function (err, user) {
    if(err) { return err } else { 
      sendEmail(user)
    } 
  });

  function sendEmail(user) {
    if (!user.email || user.welcomeEmailSent) return res.status(500).send("User welcome email has previously been sent or no email address.");
    var emailAddress = user.email
    if (!emailAddress) return res.status(400).send("Couldn't send welcome email to " + user._id + " because user doesn't have a valid email.");
    fs.readFile(__dirname + '/emails/welcomeEmail.html', function (err, html) {
      if (err) throw err; 
      var welcomeEmail = html
      // fs.readFile(__dirname + '/emails/welcomeEmailHeader.html', function (err, html) {
      //   if (err) throw err; 
      //   var welcomeEmailHeader = html
      var data = {
        from: from_who,
        to: emailAddress,
        subject: 'Welcome To The Club',
        html: welcomeEmail.toString()
      }
      // if (!user.welcomeEmailSent) {
      mailgun.messages().send(data, function (err, body) {
        //If there is an error, render the error page
        if (err) {
          console.log("Error sending welcome email to " + emailAddress)
          console.log(err)
          res.status(400).send("Error sending welcome email to " + emailAddress);
        }
        else {
          user.welcomeEmailSent = new Date();
          console.log("Sent welcome email to " + emailAddress)
          user.save(function(err) {
            if (err) return validationError(res, err);
            res.status(200).json(user);
          });    
        }
      });
      // } else {
      //   res.status(500).send("User welcome email has previously been sent.")
      // }
      // }); 
    });  
  } 
};

function formattedDateTime(dateTime, user) {
  var timezoneName;
  if (user && user.timezone) {
    timezoneName = user.timezone;
  } else {
    timezoneName = "America/New_York"; //Defaults to ET if no timezone set on user.
  }
  var formatted = {}

  formatted.date = moment.tz(dateTime, timezoneName).format('dddd, MMM Do');
  formatted.classTime = moment.tz(dateTime, timezoneName).format('h:mma z');      
  return formatted;
}
