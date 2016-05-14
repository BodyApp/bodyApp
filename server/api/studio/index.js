'use strict';

var express = require('express');
var controller = require('./studio.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

// router.put('/:id', controller.update);

//Customer billing
router.put('/:id/createSubscriptionPlan', auth.isAuthenticated(), controller.createSubscriptionPlan);
router.put('/:id/deleteSubscriptionPlan', auth.isAuthenticated(), controller.deleteSubscriptionPlan);
router.put('/:id/listSubscriptionPlans', auth.isAuthenticated(), controller.listSubscriptionPlans);
router.put('/:id/listCustomers', auth.isAuthenticated(), controller.listCustomers);
router.put('/:id/listCoupons', auth.isAuthenticated(), controller.listCoupons);
router.put('/:id/createCoupon', auth.isAuthenticated(), controller.createCoupon);
router.put('/:id/deleteCoupon', auth.isAuthenticated(), controller.deleteCoupon);

router.put('/:id/getUserRevenue', auth.isAuthenticated(), controller.getUserRevenue);

module.exports = router;