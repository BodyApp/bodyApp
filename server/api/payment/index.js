'use strict';

var express = require('express');
var controller = require('./payment.controller');
var config = require('../../config/environment');

var router = express.Router();
var stripe = require("stripe")(config.stripeOptions.apiKey);

// router.get('/', controller.index);
// router.get('/:id', controller.show);
// router.post('/', controller.create);
// router.put('/:id', controller.update);
// router.patch('/:id', controller.update);
// router.delete('/:id', controller.destroy);

module.exports = router;