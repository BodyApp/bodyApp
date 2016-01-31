'use strict';

var express = require('express');
var controller = require('./email.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

// Send a message to the specified email address when you navigate to /submit/someaddr@email.com
router.get('/submit/:mail', controller.submitEmail)
router.get('/validate/:mail', controller.validateEmail)
router.get('/invoice/:mail', controller.invoiceEmail)

module.exports = router;