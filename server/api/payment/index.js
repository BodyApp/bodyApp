'use strict';

var express = require('express');
var controller = require('./payment.controller');
var config = require('../../config/environment');

var router = express.Router();

router.post('/addcustomersubscription', auth.isAuthenticated(), controller.addCustomerSubscription);

module.exports = router;