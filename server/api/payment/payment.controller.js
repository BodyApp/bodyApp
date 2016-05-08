'use strict';

// var Stripe = require('stripe')
var config = require('../../config/environment');
var stripe = require("stripe")(config.stripeOptions.apiKey);

//Formatted for use with Mongoose plugin (user.model.js)
module.exports = exports = function stripeCustomer (schema, options) {
  schema.add({
    stripe: {
      customer: {
        customerId: String
      },
      subscriptions: Object,
      subscription: {
        name: String,
        id: String,
        startDate: Number,
        endDate: Number,
        amount: Number,
        currency: String,
        interval: String,
        intervalCount: Number,
        livemode: Boolean,
        status: String
      }
    }
  });
};

exports.addCustomerSubscription = function(req, res, next){
  var stripeToken = req.body.stripeToken.id;
  var shippingAddress = req.body.shippingAddress;
  var coupon = req.body.coupon;
  var studioId = req.body.studioId;
  var userEmail = req.body.stripeToken.email;
  var planInfo = req.body.planInfo;

  if(!stripeToken){
    return console.log("error retrieving stripe token.")
  }

  User.findById(req.user._id, '-salt -hashedPassword', function(err, user) {
    if (err) return next(err);
    
    var cb = function(err) {
      if (err && err.statusCode) {
        res.status(err.statusCode).send(err)
        if(err.code){
          console.log('User ' + user._id + ' with email address ' + userEmail + ' card declined. Status code ' + err.statusCode + ' - Error: ' + err.code);
        } else {
          console.log('User ' + user._id + ' with email address ' + userEmail + ' card declined. Status code ' + err.statusCode + '. Unknown error');
        }
      } else if (err) {
        res.status(400).send(err)
        console.log('User ' + user._id + ' with email address ' + userEmail + ' card declined. Unknown error');
      } else {
        console.log('Billing has been updated.');
      }
    };

    var createPlatformCustomerHandler = function(err, customer) {
      if (userEmail) {
        user.email = userEmail;
      }

      if (shippingAddress) {
        user.shippingAddress = shippingAddress;
      }

      if (!user.stripe.customer.customerId){
        user.stripe.customer.customerId = customer.id;
      }

      user.save(function(err){
        if (studioId) {
          ref.child("studios").child(studioId).child("stripeConnected").child('stripe_user_id').once('value', function(retrievedId) {
            if (!retrievedId.exists()) {
              res.status(200).send("Customer and billing created, but no subscription added.")
              return cb(null)
            }
            ref.child('studios').child(studioId).child("stripeConnected").child('access_token').once('value', function(retrievedAccessToken) {
              createCustomerSubscription(retrievedId.val(), retrievedAccessToken.val())    
            })
          })  
        } else {
          res.status(200).send("Customer and billing created, but no subscription added.")
          return cb(null)
        }
        // sendShippingInfo(user) //Sends email to admins about subscriber
      });
    }

    var updatePlatformCustomerHandler = function(err, customer) {
      if (studioId) {
        ref.child("studios").child(studioId).child("stripeConnected").child('stripe_user_id').once('value', function(retrievedId) {
          if (!retrievedId.exists()) {
            res.status(201).send("Customer and billing updated, but no subscription added.")
            return cb(null)
          }
          ref.child('studios').child(studioId).child("stripeConnected").child('access_token').once('value', function(retrievedAccessToken) {
            createCustomerSubscription(retrievedId.val(), retrievedAccessToken.val())    
          })
        })  
      } else {
        res.status(201).send("Customer and billing updated, but no subscription added.")
        return cb(null)
      }
    }

    var createCustomerSubscriptionHandler = function(err, customer) {
      if (err) return cb(err);

      // if (coupon) {
      //   user.mostRecentCoupon = coupon.id
      //   User.findOne({referralCode: coupon.id}, '-salt -hashedPassword', function (err, pulledUser) {
      //     if(err) return console.log(err);
      //     if(pulledUser) {
      //       pulledUser.referrals = pulledUser.referrals || {}
      //       pulledUser.referrals[user._id] = {"timeUsed":new Date().getTime(), "facebookId":user.facebookId}

      //       pulledUser.save(function(err){
      //         console.log("Successfully saved referral of user " + user._id + " by user " + pulledUser._id)
      //         if (err) return console.log(err);
      //         return
      //       });
      //     }
      //   });
      // }

      

      // if(!user.stripe.subscription.status != "active"){
      //   console.log("Didn't have plan saved yet.  Saving now.")
      //   //Only part of the 'subscriptions' object when user is first created
      //   var subData = customer.subscriptions ? customer.subscriptions.data[0] : customer;      
      //   console.log(subData);    
      //   // user.stripe.customer.customerId = customer.id;
      //   user.stripe.subscription.id = subData.id;
      //   user.stripe.subscription.name = subData.plan.id;
      //   user.stripe.subscription.amount = subData.plan.amount;
      //   user.stripe.subscription.startDate = subData.start
      //   user.stripe.subscription.endDate = subData.current_period_end
      //   user.stripe.subscription.currency = subData.plan.currency;
      //   user.stripe.subscription.interval = subData.plan.interval;
      //   user.stripe.subscription.intervalCount = subData.plan.interval_count;
      //   user.stripe.subscription.liveMode = subData.plan.livemode;    
      //   user.stripe.subscription.status = subData.status;    
      // }

      user.save(function(err){
        // sendSubscriberEmail(user) //Email sent to user about how they are a member now.
        res.json(user)
        if (err) return cb(err);
        return cb(null);
        return
      });
    };

    var createCustomerId = function() {
      stripe.customers.create({
        email: userEmail,
        source: stripeToken,
        description: "BODY Consumer"
      }, createPlatformCustomerHandler)
    }

    var updateCustomer = function(customerId) {
      stripe.customers.update(customerId, {
        source: stripeToken,
        description: "BODY Consumer"
      }, updatePlatformCustomerHandler);
    }

    var createCustomerSubscription = function(connectedAccountId, connectedAccountAccessToken) {
      stripe.tokens.create(
        { customer: user.stripe.customer.customerId },
        { stripe_account: connectedAccountId },
        function(err, newToken) {
          var connectedStripe = require("stripe")(connectedAccountAccessCode)
          //If user already has a customer Id with the connected account
          if (user.stripe.studios && user.stripe.studios[connectedAccountId] && user.stripe.studios[connectedAccountId].customer && user.stripe.studios[connectedAccountId].customer.customerId) {
            connectedStripe.customers.update(user.stripe.studios[connectedAccountId].customer.customerId {
              source: newToken,
              description: "BODY Consumer"
            }, function(err, connectedAccountCustomer) {
              createSubscription(newToken, connectedAccountCustomer)
            })
          } else {
            connectedStripe.customers.create({
              email: userEmail,
              source: newToken,
              description: "BODY Consumer"
            }, function(err, connectedAccountCustomer) {
              createSubscription(newToken, connectedAccountCustomer)
            })
          }
        }
      );

      var createSubscription = function(tokenToUse, connectedAccountCustomer) {
        var connectedStripe = require("stripe")(connectedAccountAccessCode)
        ref.child('studios').child(studioId).child('stripeConnected').child('applicationFeePercent').once('value', function(feeSnapshot) {
          stripe.customers.createSubscription(connectedAccountCustomer.customerId, {
            source: newToken,
            plan: planInfo.id,
            application_fee: feeSnapshot.val(),
            coupon: coupon.id || null
          }, createCustomerSubscriptionHandler);        
        })
      }     
    }

    if (user.customer.customerId) {
      updateCustomer(user.customer.customerId)
    } else {
      createCustomerId()
    }
  });
};