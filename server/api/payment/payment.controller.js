'use strict';

// var Stripe = require('stripe')
var config = require('../../config/environment');
var stripe = require("stripe")(config.stripeOptions.apiKey);
var User = require('../user/user.model');

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

exports.updateCustomerSubscriptionStatus = function(req, res, next){
  var studioId = req.body.studioId;

  User.findById(req.user._id, '-salt -hashedPassword', function(err, user) {
    if (err) return next(err);
    ref.child('studios').child(studioId).child("stripeConnected").child('access_token').once('value', function(retrievedAccessToken) {
      var stripe = require('stripe')(retrievedAccessToken)
      if (user.stripe && user.stripe.studios && user.stripe.studios[studioId] && user.stripe.studios[studioId].customer) {
        stripe.customers.retrieve(
          user.stripe.studios[studioId].customer.customerId,
          function(err, customer) {
            var subData = customer.subscriptions ? customer.subscriptions.data[0] : customer;      
            user.stripe.studios[studioId].subscription = user.stripe.studios[studioId].subscription || {};   
            user.stripe.studios[studioId].subscription.id = subData.id;
            user.stripe.studios[studioId].subscription.name = subData.plan.id;
            user.stripe.studios[studioId].subscription.amount = subData.plan.amount;
            user.stripe.studios[studioId].subscription.startDate = subData.start
            user.stripe.studios[studioId].subscription.endDate = subData.current_period_end
            user.stripe.studios[studioId].subscription.currency = subData.plan.currency;
            user.stripe.studios[studioId].subscription.interval = subData.plan.interval;
            user.stripe.studios[studioId].subscription.intervalCount = subData.plan.interval_count;
            user.stripe.studios[studioId].subscription.liveMode = subData.plan.livemode;    
            user.stripe.studios[studioId].subscription.status = subData.status;    

            user.save(function(err){
            return res.json(user)
          });
          }
        );
      }
    }   
  })
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

      if (!user.stripe || !user.stripe.customer || !user.stripe.customer.customerId){
        user.stripe = user.stripe || {};
        user.stripe.customer = user.stripe.customer || {}
        user.stripe.customer.customerId = customer.id;
      }

      user.save(function(err){
        if (studioId) {
          ref.child("studios").child(studioId).child("stripeConnected").child('stripe_user_id').once('value', function(retrievedId) {
            if (!retrievedId.exists()) {
              res.status(201).send("Customer and billing created, but no subscription added.")
              return cb(null)
            }
            ref.child('studios').child(studioId).child("stripeConnected").child('access_token').once('value', function(retrievedAccessToken) {
              createCustomerSubscription(retrievedId.val(), retrievedAccessToken.val())    
            })
          })  
        } else {
          res.status(201).send("Customer and billing created, but no subscription added.")
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

    var createCustomerSubscriptionHandler = function(err, customer, connectedAccountId) {
      if (err) return cb(err);

      if (!user.stripe || !user.stripe.studios || !user.stripe.studios[studioId] || !user.stripe.studios[studioId].customer || !user.stripe.studios[studioId].customer.customerId) {
        user.stripe = user.stripe || {};
        user.stripe.studios = user.stripe.studios || {};
        user.stripe.studios[studioId] = user.stripe.studios[studioId] || {};
        user.stripe.studios[studioId].customer = customer;
      }

      if (coupon) {
        user.firstCouponUsed = user.firstCouponUsed ? userr.firstCouponUsed: coupon.id; 
        user.mostRecentCoupon = coupon.id;

        ref.child('studios').child(studioId).child("couponsUsed").child(coupon.id).child('usedBy').child(user._id).update({"dateTimeUsed": new Date().getTime(), "customerId": customer.customerId})

        User.findOne({referralCode: coupon.id}, '-salt -hashedPassword', function (err, pulledUser) {
          if(err) return console.log(err);
          if(pulledUser) {
            pulledUser.referrals = pulledUser.referrals || {}
            pulledUser.referrals[studioId] = pulledUser.referrals[studioId] || {};
            pulledUser.referrals[studioId][user._id] = {"timeUsed":new Date().getTime(), "facebookId":user.facebookId}

            pulledUser.save(function(err){
              console.log("Successfully saved referral of user " + user._id + " to studio " + studioId + " by user " + pulledUser._id)
              ref.child('studios').child(studioId).child("couponsUsed").child(coupon.id).child('couponOwner').update({'id': pulledUser._id, 'firstName': pulledUser.firstName, 'lastName': pulledUser.lastName, 'facebookId': pulledUser.facebookId, 'email': pulledUser.email})
              if (err) return console.log(err);
              return
            });
          }
        });
      }    

      if(!user.stripe.studios[studioId].subscription.status != "active"){
        //Only part of the 'subscriptions' object when user is first created
        var subData = customer.subscriptions ? customer.subscriptions.data[0] : customer;      
        
        user.stripe = user.stripe || {};
        user.stripe.studios = user.stripe.studios || {};
        user.stripe.studios[studioId] = user.stripe.studios[studioId] || {};
        user.stripe.studios[studioId].subscription = user.stripe.studios[studioId].subscription || {};   

        user.stripe.studios[studioId].subscription.id = subData.id;
        user.stripe.studios[studioId].subscription.name = subData.plan.id;
        user.stripe.studios[studioId].subscription.amount = subData.plan.amount;
        user.stripe.studios[studioId].subscription.startDate = subData.start
        user.stripe.studios[studioId].subscription.endDate = subData.current_period_end
        user.stripe.studios[studioId].subscription.currency = subData.plan.currency;
        user.stripe.studios[studioId].subscription.interval = subData.plan.interval;
        user.stripe.studios[studioId].subscription.intervalCount = subData.plan.interval_count;
        user.stripe.studios[studioId].subscription.liveMode = subData.plan.livemode;    
        user.stripe.studios[studioId].subscription.status = subData.status;    
      }

      user.save(function(err){
        // sendSubscriberEmail(user) //Email sent to user about how they are a member now.
        res.status(201).json(user)
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
          if (user.stripe.studios && user.stripe.studios[studioId] && user.stripe.studios[studioId].customer && user.stripe.studios[studioId].customer.customerId) {
            connectedStripe.customers.update(user.stripe.studios[studioId].customer.customerId {
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
              createSubscription(newToken, connectedAccountCustomer, connectedAccountId)
            })
          }
        }
      );

      var createSubscription = function(tokenToUse, connectedAccountCustomer, connectedAccountId) {
        var connectedStripe = require("stripe")(connectedAccountAccessCode)
        ref.child('studios').child(studioId).child('stripeConnected').child('applicationFeePercent').once('value', function(feeSnapshot) {
          stripe.customers.createSubscription(connectedAccountCustomer.customerId, {
            source: newToken,
            plan: planInfo.id,
            application_fee: feeSnapshot.val(),
            coupon: coupon.id || null
          }, function(err, customer) {
            createCustomerSubscriptionHandler(err, customer, connectedAccountId);    
          }    
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