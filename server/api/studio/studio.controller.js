
var config = require('../../config/environment');
// var stripe = require("stripe")(config.stripeOptions.apiKey);

var Mailgun = require('mailgun-js');
var api_key = config.mailgunApiKey;
var from_who = config.mailgunFromWho;
var domain = 'getbodyapp.com';  
var mailgun = new Mailgun({apiKey: api_key, domain: domain});

var Firebase = require('firebase');
var ref = new Firebase("https://bodyapp.firebaseio.com/");

exports.createSubscriptionPlan = function(req, res, next){
  var studioId = req.body.studioId;
  var amount = req.body.amount;
  var name = req.body.name;
  var currency = req.body.currency;
  var interval = req.body.interval;
  var statement_descriptor = req.body.statement_descriptor;
  var metadata = req.body.metadata;
  var userThatCreatedPlan = req.body.userThatCreatedPlan;

  ref.child('studios').child(studioId).child("stripeConnected").child('access_token').once('value', function(snapshot) {
    if (snapshot.exists()) {
      // stripe = require("stripe")(snapshot.val());

      var stripe = require("stripe")(snapshot.val())

      stripe.plans.create({
        id: studioId + amount/100 + "v" + new Date().getTime(),
        amount: amount,
        interval: interval,
        name: name,
        currency: currency,
        statement_descriptor: statement_descriptor,
        metadata: {
          "studioId": studioId,
          "userThatCreatedPlan": userThatCreatedPlan,
        }
      }, 
      // {
      //   stripe_account: snapshot.val()
      // }, 
      function(err, plan) {
        if (err) {console.log(err); return res.status(400).send(err);}
        ref.child('studios').child(studioId).child('stripeConnected').child('subscriptionPlans').child(plan.id).update(plan, function(err) {
          if (err) return res.status(400).send(err);
          res.status(200).json(plan);  
        })
      });
    } else {
      return res.status(400).send("Your studio doesn't have a valid account ID associated with it.");
    }
  })
};

exports.deleteSubscriptionPlan = function(req, res, next){
  var studioId = req.body.studioId;
  var planId = req.body.planId;

  ref.child('studios').child(studioId).child("stripeConnected").child('access_token').once('value', function(snapshot) {
    if (snapshot.exists()) {

      var stripe = require("stripe")(snapshot.val())

      stripe.plans.del(planId,
      // {
      //   stripe_account: snapshot.val()
      // }, 
      function(err, plan) {
        if (err) {console.log(err); return res.status(400).send(err);}
        ref.child('studios').child(studioId).child('subscriptionPlans').child(plan.id).remove(function(err) {
          if (err) return res.status(400).send(err);
          res.status(200).send("Plan " + planId + " successfully deleted");  
        })
      });
    } else {
      return res.status(400).send("Your studio doesn't have a valid account ID associated with it.");
    }
  })
};

exports.listSubscriptionPlans = function(req, res, next){
  var studioId = req.body.studioId;

  ref.child('studios').child(studioId).child("stripeConnected").child('access_token').once('value', function(snapshot) {
    if (snapshot.exists()) {

      var stripe = require("stripe")(snapshot.val())

      stripe.plans.list(
        // { stripe_account: snapshot.val() }, 
        function(err, plans) {
        if (err) {console.log(err); return res.status(400).send(err);}
        console.log(plans.data.length + " subscription plans pulled.")
        res.status(200).send(plans.data);  
        syncSubscriptionPlans(plans.data, studioId) 
      });
    } else {
      return res.status(400).send("Your studio doesn't have a valid account ID associated with it.");
    }
  })
};

var syncSubscriptionPlans = function(plans, studioId) {
  ref.child('studios').child(studioId).child('stripeConnected').child('subscriptionPlans').once('value', function(snapshot) {
    snapshot.forEach(function(plan) { //Makes sure don't have extra subscriptions in firebase if delete them in Stripe.
      var idToCheck = plan.val().id;
      var toDelete = true;
      for (var i = 0; i < plans.length; i++) {
        if (plans[i].id === idToCheck) toDelete = false;
      }
      if (toDelete) {
        plan.ref().remove(function(err) {
          if (err) return console.log(err)
          console.log("Deleting subscription plan in firebase as doesn't exist in Stripe")
        })
      } else {
        console.log("Subscription " + idToCheck + " exists in Stripe, so not deleting from Firebase.")
      }
    })
    for (var i = 0; i < plans.length; i++) { //Makes sure any subscriptions created directly in Stripe are saved to Firebase.
      var idToCheck = plans[i].id
      if (!snapshot.val() || !snapshot.val()[idToCheck]) {
        ref.child('studios').child(studioId).child('stripeConnected').child('subscriptionPlans').child(idToCheck).update(plans[i], function(err) {
          if (err) return console.log(err)
          console.log("Adding subscription plan in firebase because exists in Stripe")
        })
      } else {
        console.log("Subscription " + idToCheck + " already exists in Firebase, so not adding to Firebase.")
      }
    }
  })
}

exports.listCustomers = function(req, res, next){
  var studioId = req.body.studioId;
  var limit = req.body.limit;

  ref.child('studios').child(studioId).child("stripeConnected").child('access_token').once('value', function(snapshot) {
    if (snapshot.exists()) {

      var stripe = require("stripe")(snapshot.val())

      stripe.customers.list( { limit: limit },
        // { stripe_account: snapshot.val() }, 
        function(err, customers) {
        if (err) {console.log(err); return res.status(400).send(err);}
        console.log(customers.data.length + " customers pulled.")
        res.status(200).send(customers.data);  
        
      });
    } else {
      return res.status(400).send("Your studio doesn't have a valid account ID associated with it.");
    }
  })
};

exports.listCoupons = function(req, res, next){
  var studioId = req.body.studioId;
  var limit = req.body.limit;

  ref.child('studios').child(studioId).child("stripeConnected").child('access_token').once('value', function(snapshot) {
    if (snapshot.exists()) {

      var stripe = require("stripe")(snapshot.val())

      stripe.coupons.list( { limit: limit },
        // { stripe_account: snapshot.val() }, 
        function(err, coupons) {
        if (err) {console.log(err); return res.status(400).send(err);}
        console.log(coupons.data.length + " active coupons pulled.")
        res.status(200).send(coupons.data);  
        
      });
    } else {
      return res.status(400).send("Your studio doesn't have a valid account ID associated with it.");
    }
  })
};

exports.createCoupon = function(req, res, next){
  var studioId = req.body.studioId;
  var couponToCreate = req.body.couponToCreate;
  var currentUserId = req.user._id;
  delete couponToCreate.couponType;
  delete couponToCreate.unformattedDate;
  // console.log(currentUserId)
  // couponToCreate.metadata = {
  //   "studioId": studioId,
  //   "userThatCreatedCoupon": currentUserId
  // }
  if (couponToCreate.max_redemptions) couponToCreate.max_redemptions *= 1;

  // if (couponToCreate.redeem_by) couponToCreate.redeem_by = new Date(couponToCreate.redeemBy).getTime()

  ref.child('studios').child(studioId).child("stripeConnected").child('access_token').once('value', function(snapshot) {
    if (snapshot.exists()) {

      var stripe = require("stripe")(snapshot.val())

      stripe.coupons.create(couponToCreate, 
      function(err, coupon) {
        if (err) {console.log(err); return res.status(400).send(err);}
        console.log("Successfully created coupon " + coupon.id + " for studio " + studioId);
        res.status(200).json(coupon);  
        // ref.child('studios').child(studioId).child('stripeConnected').child('subscriptionPlans').child(plan.id).update(plan, function(err) {
        //   if (err) return res.status(400).send(err);
        //   res.status(200).json(plan);  
        // })
      });
    } else {
      return res.status(400).send("Your studio doesn't have a valid account ID associated with it.");
    }
  })
};

exports.deleteCoupon = function(req, res, next){
  var studioId = req.body.studioId;
  var couponId = req.body.couponId;

  ref.child('studios').child(studioId).child("stripeConnected").child('access_token').once('value', function(snapshot) {
    if (snapshot.exists()) {

      var stripe = require("stripe")(snapshot.val())

      stripe.coupons.del(couponId,
      // {
      //   stripe_account: snapshot.val()
      // }, 
      function(err, plan) {
        if (err) {console.log(err); return res.status(400).send(err);}
        // ref.child('studios').child(studioId).child('subscriptionPlans').child(plan.id).remove(function(err) {
          if (err) return res.status(400).send(err);
          console.log("Coupon " + couponId + " successfully deleted by studio " + studioId);
          res.status(200).send("Coupon " + couponId + " successfully deleted");  
        // })
      });
    } else {
      return res.status(400).send("Your studio doesn't have a valid account ID associated with it.");
    }
  })
};

exports.checkCoupon = function(req, res, next){
  var studioId = req.body.studioId;
  var couponString = req.body.couponString;

  if(!couponString){
    return console.log("error retrieving coupon code.")
    res.status(400).send("No coupon sent")
  }

  ref.child('studios').child(studioId).child("stripeConnected").child('access_token').once('value', function(snapshot) {
    if (snapshot.exists()) {

      var stripe = require("stripe")(snapshot.val())
      stripe.coupons.retrieve(couponString, function(err, coupon) {
        if (err) res.status(400).send("Could not retrieve coupon")
        res.status(200).json(coupon);
      })
    } else {
      return res.status(400).send("Your studio doesn't have a valid account ID associated with it.");
    }
  })
};

exports.getUserRevenue = function(req, res, next) {
  var customerToGet = req.body.customerToGet;
  var studioId = req.body.studioId;

  ref.child('studios').child(studioId).child("stripeConnected").child('access_token').once('value', function(snapshot) {
    var stripe = require("stripe")(snapshot.val())

    var totalRevenue = 0;
    stripe.charges.list({customer: customerToGet}, function(err, charges) {
      for (var i = 0; i < charges.data.length; i++) {
        totalRevenue += charges.data[i].amount;
      }
      return res.status(200).send(totalRevenue);
    })
  })
}

