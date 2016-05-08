
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
      });
    } else {
      return res.status(400).send("Your studio doesn't have a valid account ID associated with it.");
    }
  })
};

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
