'use strict';

var express = require('express');
var controller = require('./payment.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.post('/addcustomersubscription', auth.isAuthenticated(), controller.addCustomerSubscription);
router.post('/chargedropin', auth.isAuthenticated(), controller.chargeDropin);
router.post ('/updatecustomersubscriptionstatus', auth.isAuthenticated(), controller.updateCustomerSubscriptionStatus);

module.exports = router;