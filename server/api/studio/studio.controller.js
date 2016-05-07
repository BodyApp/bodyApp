
var config = require('../../config/environment');
var stripe = require("stripe")(config.stripeOptions.apiKey);

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

  ref.child('studios').child(studioId).child("stripeConnected").child('stripe_user_id').once('value', function(snapshot) {
    if (snapshot.exists()) {
      // stripe = require("stripe")(snapshot.val());

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
      }, {
        stripe_account: snapshot.val()
      }, function(err, plan) {
        if (err) {console.log(err); return res.status(400).send(err);}
        ref.child('studios').child(studioId).child('subscriptionPlans').child(plan.id).update(plan, function(err) {
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

  ref.child('studios').child(studioId).child("stripeConnected").child('stripe_user_id').once('value', function(snapshot) {
    if (snapshot.exists()) {

      stripe.plans.del(planId,
      {
        stripe_account: snapshot.val()
      }, function(err, plan) {
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

router.put('/:id/listSubscriptionPlans', auth.isAuthenticated(), controller.listSubscriptionPlans);
router.put('/:id/listActiveSubscriptions', auth.isAuthenticated(), controller.listActiveSubscriptions);
router.put('/:id/listCoupons', auth.isAuthenticated(), controller.listCoupons);

