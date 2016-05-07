
var config = require('../../config/environment');
var stripe = require("stripe")(config.stripeOptions.apiKey);

var Mailgun = require('mailgun-js');
var api_key = config.mailgunApiKey;
var from_who = config.mailgunFromWho;
var domain = 'getbodyapp.com';  
var mailgun = new Mailgun({apiKey: api_key, domain: domain});

var Firebase = require('firebase');
var ref = new Firebase("https://bodyapp.firebaseio.com/");

exports.createSubsciptionPlan = function(req, res, next){
  var studioId = req.body.studioId
  var amount = req.body.amount
  var name = req.body.name
  var currency = req.body.currency
  var interval = req.body.interval
  var statement_descriptor = req.body.statement_descriptor
  var metadata = req.body.metadata
  var userThatCreatedPlan = req.body.userThatCreatedPlan
  
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
  }, function(err, plan) {
    if (err) {console.log(err); return res.status(400).send(err);}
    ref.child('studios').child(studioId).child('subscriptionPlans').child(plan.id).update(plan, function(err) {
      if (err) return res.status(400).send(err)
      res.status(200).json(plan);  
    })
  });
};



router.put('/:id/deleteSubscriptionPlan', auth.isAuthenticated(), controller.deleteSubscriptionPlan);
router.put('/:id/listSubscriptionPlans', auth.isAuthenticated(), controller.listSubscriptionPlans);
router.put('/:id/listActiveSubscriptions', auth.isAuthenticated(), controller.listActiveSubscriptions);
router.put('/:id/listCoupons', auth.isAuthenticated(), controller.listCoupons);

