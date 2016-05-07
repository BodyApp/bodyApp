'use strict';

var express = require('express');
var controller = require('./studio.controller');

var router = express.Router();

router.put('/:id', controller.update);

//Customer billing
router.put('/:id/createSubscriptionPlan', auth.isAuthenticated(), controller.createSubscriptionPlan);
router.put('/:id/deleteSubscriptionPlan', auth.isAuthenticated(), controller.deleteSubscriptionPlan);
router.put('/:id/listSubscriptionPlans', auth.isAuthenticated(), controller.listSubscriptionPlans);
router.put('/:id/listActiveSubscriptions', auth.isAuthenticated(), controller.listActiveSubscriptions);
router.put('/:id/listCoupons', auth.isAuthenticated(), controller.listCoupons);

module.exports = router;