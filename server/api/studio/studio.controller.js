
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
  });
};


router.put('/:id/createSubscriptionPlan', auth.isAuthenticated(), controller.createSubscriptionPlan);
router.put('/:id/deleteSubscriptionPlan', auth.isAuthenticated(), controller.deleteSubscriptionPlan);
router.put('/:id/listSubscriptionPlans', auth.isAuthenticated(), controller.listSubscriptionPlans);
router.put('/:id/listActiveSubscriptions', auth.isAuthenticated(), controller.listActiveSubscriptions);
router.put('/:id/listCoupons', auth.isAuthenticated(), controller.listCoupons);

