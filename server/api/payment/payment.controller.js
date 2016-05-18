'use strict';

// var Stripe = require('stripe')
var config = require('../../config/environment');
// var stripe = require("stripe")(config.stripeOptions.apiKey);
var stripe = require("stripe")('sk_live_8luONSHGbKYTd50ODzxQ5v0X');
// var stripe = require("stripe")("sk_test_FcBN0w7tedfz76of38xr0qr4");
var User = require('../user/user.model');

var Firebase = require('firebase');
var ref = new Firebase("https://bodyapp.firebaseio.com/");

//Formatted for use with Mongoose plugin (user.model.js)
// module.exports = exports = function stripeCustomer (schema, options) {
//   schema.add({
//     stripe: {
//       customer: {
//         customerId: String
//       },
//       subscriptions: Object,
//       subscription: {
//         name: String,
//         id: String,
//         startDate: Number,
//         endDate: Number,
//         amount: Number,
//         currency: String,
//         interval: String,
//         intervalCount: Number,
//         livemode: Boolean,
//         status: String
//       }
//     }
//   });
// };

exports.updateCustomerSubscriptionStatus = function(req, res, next){
  var studioId = req.body.studioId;
  var accessCode = req.body.accessCode;

  User.findById(req.user._id, '-salt -hashedPassword', function(err, user) {
    if (err) return next(err);
    // ref.child('studios').child(studioId).child("stripeConnected").child('access_token').once('value', function(retrievedAccessToken) {
      // if (!retrievedAccessToken) {
      //   console.log("No access token found for this studio")
      //   return res.status(400).send("No access token found")
      // }
      var stripe = require('stripe')(accessCode)
      if (user.studioSubscriptions && user.studioSubscriptions[studioId] && user.studioSubscriptions[studioId].customerId) {
        stripe.customers.retrieve(
          user.studioSubscriptions[studioId].customerId,
          function(err, customer) {
            if (err) return res.status(400).send("Error retrieving customer.")
            var subData = customer.subscriptions ? customer.subscriptions.data[0] : customer;      
            // user.stripe[studioId].subscription = user.stripe[studioId].subscription || {};   
            // user.stripe[studioId].planId = subData.id;
            // user.stripe[studioId].name = subData.plan.id;
            // user.stripe[studioId].amount = subData.plan.amount;
            // user.stripe[studioId].startDate = subData.start
            // user.stripe[studioId].endDate = subData.current_period_end
            // user.stripe[studioId].currency = subData.plan.currency;
            // user.stripe[studioId].interval = subData.plan.interval;
            // user.stripe[studioId].intervalCount = subData.plan.interval_count;
            // user.stripe[studioId].liveMode = subData.plan.livemode;    
            user.studioSubscriptions[studioId].status = subData.status;    

            user.save(function(err){
              return res.status(200).json(user)
            });
          }
        );
      } else {
        console.log("User " + user._id + " is not a customer of " + studioId);
        return res.status(400).send("User " + user._id + " is not a customer of " + studioId);
      }
    // })   
  })
};

exports.addCustomerSubscription = function(req, res, next){
  var stripeToken = req.body.stripeToken.id;
  var shippingAddress = req.body.shippingAddress;
  var coupon = req.body.coupon;
  var studioId = req.body.studioId;
  var userEmail = req.body.stripeToken.email;
  var planInfo = req.body.planInfo;
  var accountId = req.body.accountId;
  // var accessCode = req.body.accessCode;

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
      if (err) return console.log(err);
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
        if (studioId && accountId) {
          // ref.child("studios").child(studioId).child("stripeConnected").child('stripe_user_id').once('value', function(retrievedId) {
          //   if (!retrievedId.exists()) {
          //     res.status(201).send("Customer and billing created, but no subscription added.")
          //     return cb(null)
          //   }
            // ref.child('studios').child(studioId).child("stripeConnected").child('access_token').once('value', function(retrievedAccessToken) {
              createCustomerSubscription(accountId)    
            // })
          // })  
        } else {
          res.status(201).send("Customer and billing created, but no subscription added.")
          return cb(null)
        }
        // sendShippingInfo(user) //Sends email to admins about subscriber
      });
    }

    var updatePlatformCustomerHandler = function(err, customer) {
      if (studioId && accountId) {
        // ref.child("studios").child(studioId).child("stripeConnected").child('stripe_user_id').once('value', function(retrievedId) {
        //   if (!retrievedId.exists()) {
        //     res.status(201).send("Customer and billing updated, but no subscription added.")
        //     return cb(null)
        //   }
          // ref.child('studios').child(studioId).child("stripeConnected").child('access_token').once('value', function(retrievedAccessToken) {
            createCustomerSubscription(accountId)    
          // })
        // })  
      } else {
        res.status(201).send("Customer and billing updated, but no subscription added.")
        return cb(null)
      }
    }

    var createCustomerSubscriptionHandler = function(err, customer, connectedAccountId) {
      if (err) return cb(err);

      // if (!user.stripe || !user.stripe[studioId] || !user.stripe[studioId].customerId) {
      //   // user.stripe = user.stripe || {};
      //   user.stripe[studioId] = user.stripe[studioId] || {};
      //   user.stripe[studioId].customerId = customer.id;
      // }

      if (coupon) {
        user.firstCouponUsed = user.firstCouponUsed ? userr.firstCouponUsed: coupon.id; 
        user.mostRecentCoupon = coupon.id;

        ref.child('studios').child(studioId).child("couponsUsed").child(coupon.id).child('usedBy').child(user._id.toString()).update({"dateTimeUsed": new Date().getTime(), "customerId": customer.id})

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

      // if(user.stripe[studioId].subscription.status != "active"){
        //Only part of the 'subscriptions' object when user is first created
        var subData = customer.subscriptions ? customer.subscriptions.data[0] : customer;

        
        // user.stripe = user.stripe || {};
        // user.stripe = user.stripe || {};
        // user.stripe[studioId] = user.stripe[studioId] || {};
        // user.stripe[studioId].subscription = user.stripe[studioId].subscription || {};   

        // user.stripe[studioId].planId = subData.id;
        // user.stripe[studioId].name = subData.plan.id;
        // user.stripe[studioId].amount = subData.plan.amount;
        // user.stripe[studioId].startDate = subData.start
        // user.stripe[studioId].endDate = subData.current_period_end
        // user.stripe[studioId].currency = subData.plan.currency;
        // user.stripe[studioId].interval = subData.plan.interval;
        // user.stripe[studioId].intervalCount = subData.plan.interval_count;
        // user.stripe[studioId].liveMode = subData.plan.livemode;
        user.studioSubscriptions = user.studioSubscriptions || {};
        user.studioSubscriptions[studioId] = user.studioSubscriptions[studioId] || {};
        user.studioSubscriptions[studioId].customerId = customer.id;    
        user.studioSubscriptions[studioId].status = subData.status;    
      // }s

      user.save(function(err){
        // sendSubscriberEmail(user) //Email sent to user about how they are a member now.
        res.status(200).json(user)
        if (err) return cb(err);
        return cb(null);
        return
      });
    };

    var createCustomerId = function() {
      stripe.customers.create({
        email: userEmail,
        source: stripeToken,
        description: "BODY Consumer",
        metadata: {
          "facebookId": user.facebookId.toString(),
          "mongoId": user._id.toString()
        }
      }, createPlatformCustomerHandler)
    };

    var updateCustomer = function(customerId) {
      stripe.customers.update(customerId, {
        source: stripeToken,
        description: "BODY Consumer"
      }, updatePlatformCustomerHandler);
    };

    var createCustomerSubscription = function(connectedAccountId) {
      // var connectedStripe = require("stripe")(connectedAccountAccessToken)

      stripe.tokens.create(
        { customer: user.stripe.customer.customerId },
        // connectedAccountAccessToken,
        { stripe_account: connectedAccountId },
        function(err, newToken) {
          if (err) return console.log(err)
          // var connectedStripe = require("stripe")(connectedAccountAccessToken)
          //If user already has a customer Id with the connected account
          if (user.studioSubscriptions && user.studioSubscriptions[studioId] && user.studioSubscriptions[studioId].customerId) {
            if (coupon) {
              stripe.customers.update(user.studioSubscriptions[studioId].customerId, {
                source: newToken.id,
                description: "BODY Consumer",
                plan: planInfo.id,
                application_fee_percent: 30-3,
                coupon: coupon.id,
                metadata: {
                  "facebookId": user.facebookId.toString(),
                  "mongoId": user._id.toString()
                }
              }, 
              { stripe_account: connectedAccountId },
              function(err, customer) {
                if (err) return console.log(err)
                createCustomerSubscriptionHandler(err, customer, connectedAccountId);
                // createSubscription(newToken, customer, connectedAccountId, connectedAccountAccessToken)
              })  
            } else {
              stripe.customers.update(user.studioSubscriptions[studioId].customerId, {
                source: newToken.id,
                description: "BODY Consumer",
                plan: planInfo.id,
                application_fee_percent: 30-3,
                metadata: {
                  "facebookId": user.facebookId.toString(),
                  "mongoId": user._id.toString()
                }
              }, 
              { stripe_account: connectedAccountId },
              function(err, customer) {
                if (err) return console.log(err)
                createCustomerSubscriptionHandler(err, customer, connectedAccountId);
                // createSubscription(newToken, customer, connectedAccountId, connectedAccountAccessToken)
              })
            }
          } else { //Create new customer
            if (coupon) {
              stripe.customers.create({
                email: userEmail,
                source: newToken.id,
                description: "BODY Consumer",
                plan: planInfo.id,
                application_fee_percent: 30-3,
                coupon: coupon.id,
                metadata: {
                  "facebookId": user.facebookId.toString(),
                  "mongoId": user._id.toString()
                }
              }, 
              { stripe_account: connectedAccountId },
              function(err, customer) {
                if (err) return console.log(err)
                createCustomerSubscriptionHandler(err, customer, connectedAccountId);
                // createSubscription(newToken, customer, connectedAccountId, connectedAccountAccessToken)
              })  
            } else {
              stripe.customers.create({
                email: userEmail,
                source: newToken.id,
                description: "BODY Consumer",
                plan: planInfo.id,
                application_fee_percent: 30-3,
                metadata: {
                  "facebookId": user.facebookId.toString(),
                  "mongoId": user._id.toString()
                }
              }, 
              { stripe_account: connectedAccountId },
              function(err, customer) {
                if (err) return console.log(err)
                createCustomerSubscriptionHandler(err, customer, connectedAccountId);
                // createSubscription(newToken, customer, connectedAccountId, connectedAccountAccessToken)
              })
            }
          }
        }
      );

      // var createSubscription = function(newToken, connectedAccountCustomer, connectedAccountId, connectedAccountAccessToken) {
      //   var connectedStripe = require("stripe")(connectedAccountAccessToken)
      //   ref.child('studios').child(studioId).child('stripeConnected').child('applicationFeePercent').once('value', function(feeSnapshot) {
      //     if (coupon) {
      //       stripe.customers.createSubscription({
      //         plan: planInfo.id.toString(),
      //         customer: connectedAccountCustomer.id,
      //         application_fee_percent: feeSnapshot.val(),
      //         coupon: coupon.id
      //       }, 
      //       { stripe_account: connectedAccountId },
      //       function(err, customer) {
      //         if (err) return console.log(err)
      //         createCustomerSubscriptionHandler(err, customer, connectedAccountId);    
      //       })  
      //     } else {
      //       console.log(planInfo.id)
      //       stripe.customers.createSubscription({
      //         plan: planInfo.id.toString(),
      //         customer: connectedAccountCustomer.id, 
      //         application_fee_percent: feeSnapshot.val()
      //       }, 
      //       { stripe_account: connectedAccountId },
      //       function(err, customer) {
      //         if (err) return console.log(err)
      //         createCustomerSubscriptionHandler(err, customer, connectedAccountId);    
      //       })  
      //     }
      //   })
      // }     
    }

    if (user.stripe && user.stripe.customer && user.stripe.customer.customerId) {
      updateCustomer(user.stripe.customer.customerId)
    } else {
      createCustomerId()
    }

  })
};

exports.chargeDropin = function(req, res, next){
  var stripeToken = req.body.stripeToken.id;
  var shippingAddress = req.body.shippingAddress;
  var studioId = req.body.studioId;
  var userEmail = req.body.stripeToken.email;
  // var accessCode = req.body.accessCode;
  var slot = req.body.slot;
  var amount = req.body.amount;
  var accountId = req.body.accountId;

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
      if (err) return console.log(err);
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
        if (studioId && accountId) {
          // ref.child("studios").child(studioId).child("stripeConnected").child('stripe_user_id').once('value', function(retrievedId) {
            // if (!retrievedId.exists()) {
              // res.status(201).send("Customer and billing created, but no subscription added.")
              // return cb(null)
            // }
            // ref.child('studios').child(studioId).child("stripeConnected").child('access_token').once('value', function(retrievedAccessToken) {
              createCustomerCharge(accountId)    
            // })
          // })  
        } else {
          res.status(201).send("Customer and billing created, but no Charge added.")
          return cb(null)
        }
        // sendShippingInfo(user) //Sends email to admins about subscriber
      });
    }

    var updatePlatformCustomerHandler = function(err, customer) {
      if (studioId && accountId) {
        // ref.child("studios").child(studioId).child("stripeConnected").child('stripe_user_id').once('value', function(retrievedId) {
        //   if (!retrievedId.exists()) {
        //     res.status(201).send("Customer and billing updated, but no subscription added.")
        //     return cb(null)
        //   }
          // ref.child('studios').child(studioId).child("stripeConnected").child('access_token').once('value', function(retrievedAccessToken) {
            createCustomerCharge(accountId)    
          // })
        // })  
      } else {
        res.status(201).send("Customer and billing updated, but no subscription added.")
        return cb(null)
      }
    }

    var createCustomerChargeHandler = function(err, charge, connectedAccountId, customer) {
      if (err) return cb(err);

      if (charge) {
        user.charges = user.charges || {};
        user.charges[studioId] = user.charges[studioId] || {};
        user.charges[studioId][charge.id] = charge.created;
      } else {
        console.log("No charge returned")
      }

      if (customer && customer.id) {
        user.studioSubscriptions = user.studioSubscriptions || {};
        user.studioSubscriptions[studioId] = user.studioSubscriptions[studioId] || {};
        user.studioSubscriptions[studioId].customerId = customer.id;
      }

      user.save(function(err){
        // sendSubscriberEmail(user) //Email sent to user about how they are a member now.
        res.status(200).json(user)
        if (err) return cb(err);
        return cb(null);
        return
      });
    };

    var createCustomerId = function() {
      stripe.customers.create({
        email: userEmail,
        source: stripeToken,
        description: "BODY Consumer",
        metadata: {
          "facebookId": user.facebookId.toString(),
          "mongoId": user._id.toString()
        }
      }, createPlatformCustomerHandler)
    };

    var updateCustomer = function(customerId) {
      stripe.customers.update(customerId, {
        source: stripeToken,
        description: "BODY Consumer"
      }, updatePlatformCustomerHandler);
    };

    var createCustomerCharge = function(connectedAccountId) {
      // var connectedStripe = require("stripe")(connectedAccountAccessToken)

      stripe.tokens.create(
        { customer: user.stripe.customer.customerId },
        // connectedAccountAccessToken,
        { stripe_account: connectedAccountId },
        function(err, newToken) {
          if (err) return console.log(err)
          // var connectedStripe = require("stripe")(connectedAccountAccessToken)
          //If user already has a customer Id with the connected account
          if (user.studioSubscriptions && user.studioSubscriptions[studioId] && user.studioSubscriptions[studioId].customerId) {
            stripe.customers.update(user.studioSubscriptions[studioId].customerId, 
            {
              source: newToken.id,
              metadata: {
                "facebookId": user.facebookId.toString(),
                "mongoId": user._id.toString()
              }
            }, 
            { stripe_account: connectedAccountId },
            function(err, customer) {
              if (err) return console.log(err)
              stripe.charges.create( 
              {
                customer: customer.id,
                description: "BODY Consumer",
                amount: amount,
                currency: "usd",
                application_fee: Math.max(Math.round(amount*.3 - amount*0.029 - 30), 0),
                metadata: {
                  "facebookId": user.facebookId.toString(),
                  "mongoId": user._id.toString()
                }
              }, 
              { stripe_account: connectedAccountId },
              function(err, charge) {
                if (err) return console.log(err)
                createCustomerChargeHandler(err, charge, connectedAccountId, customer);
              })  
            })  
          } else { //Create new customer first
            stripe.customers.create({
              email: userEmail,
              source: newToken.id,
              description: "BODY Consumer",
              // application_fee_percent: 30-3,
              metadata: {
                "facebookId": user.facebookId.toString(),
                "mongoId": user._id.toString()
              }
            }, 
            { stripe_account: connectedAccountId },
            function(err, customer) {
              if (err) return console.log(err)
              stripe.charges.create( 
              {
                customer: customer.id,
                description: "BODY Consumer",
                amount: amount,
                currency: "usd",
                application_fee: Math.max(Math.round(amount*.3 - amount*0.029 - 30), 0),
                metadata: {
                  "facebookId": user.facebookId.toString(),
                  "mongoId": user._id.toString()
                }
              }, 
              { stripe_account: connectedAccountId },
              function(err, charge) {
                if (err) return console.log(err)
                createCustomerChargeHandler(err, charge, connectedAccountId, customer);
              })  
            })
          }
        }
      );
    }

    if (user.stripe && user.stripe.customer && user.stripe.customer.customerId) {
      updateCustomer(user.stripe.customer.customerId)
    } else {
      createCustomerId()
    }

  })
};

// exports.chargeDropin = function(req, res, next){
//   var stripeToken = req.body.stripeToken.id;
//   var shippingAddress = req.body.shippingAddress;
//   var slot = req.body.slot;
//   var accessCode = req.body.accessCode;
//   var amount = req.body.amount;
//   var studioId = req.body.studioId;

//   if(!stripeToken){
//     return console.log("error retrieving stripe token.")
//     // req.flash('errors', { msg: 'Please provide a valid card.' });
//     // res.redirect(req.redirect.failure);
//   }

//   User.findById(req.user._id, '-salt -hashedPassword', function(err, user) {
//     if (err) return next(err);
    
//     var cb = function(err) {
//       if (err && err.statusCode) {
//         res.status(err.statusCode).send(err)
//         if(err.code){
//           console.log('User ' + user._id + ' with email address ' + user.email + ' card declined. Status code ' + err.statusCode + ' - Error: ' + err.code);
//         } else {
//           console.log('User ' + user._id + ' with email address ' + user.email + ' card declined. Status code ' + err.statusCode + '. Unknown error');
//         }
//       } else if (err) {
//         res.status(400).send(err)
//         console.log('User ' + user._id + ' with email address ' + user.email + ' card declined. Unknown error');
//       } else {
//         console.log('Billing has been updated.');
//       }
//       // req.flash('success', { msg: 'Billing has been updated.' });
//       // res.redirect(req.redirect.success);
//     };

//       var cardHandler = function(err, customer) {

//         // console.log(third);
//         if (err) return cb(err);
        
//         // user.level = 1;
//         // if (!user.stripe) {
//         //   console.log("stripe object created on user")
//         //   user.stripe = {};
//         // }

//         if (shippingAddress) {
//           user.shippingAddress = shippingAddress;
//           // sendShippingInfo(user)
//         }

//         // if(!user.stripe.customer.customerId){
//         //   // user.stripe.customer = {};
//         //   console.log("Didn't have customer ID yet.  Saving now.")
//           // user.stripe.customer.customerId = customer.id;
//         // }

//         user.dropInClasses = user.dropInClasses || {};
//         user.dropInClasses[studioId] = user.dropInClasses[studioId] || {};
//         user.dropInClasses[studioId][slot.date] = true;

//         user.save(function(err){
//           res.json(user)
//           if (err) return cb(err);
//           return cb(null);
//           return
//         });
//       };

//       if (user.stripe && user.stripe.customer && user.stripe.customer.customerId) {
//         stripe.charges.create({
//           amount: amount, // amount in cents, again
//           currency: "usd",
//           customer: user.stripe.customer.customerId, // Previously stored, then retrieved
//           metadata: {
//             "classBooked": slot.date,
//             "timeBooked": new Date().getTime()
//           }
//         }, cardHandler);
//       } else {
//         console.log("Creating new stripe customer for drop in class.")
//         stripe.customers.create({
//           email: user.email,
//           source: stripeToken,
//           description: "Created customer for drop in class."
//         }).then(function(customer){
//           stripe.charges.create({
//             amount: amount, // amount in cents, again
//             currency: "usd",
//             source: stripeToken
//             // customer: customer.id, // Previously stored, then retrieved
//             metadata: {
//               "classBooked": slot.date,
//               "timeBooked": new Date().getTime()
//             }
//           }, cardHandler)
//         })
//       }
//   });
// };