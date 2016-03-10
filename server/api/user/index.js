'use strict';

var express = require('express');
var controller = require('./user.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/', auth.hasRole('admin'), controller.index);
router.get('/instructors', auth.hasRole('admin'), controller.getInstructors);
router.get('/admins', auth.hasRole('admin'), controller.getAdmins);
router.delete('/:id', auth.hasRole('admin'), controller.destroy);
router.get('/me', auth.isAuthenticated(), controller.me);
router.put('/:id/password', auth.isAuthenticated(), controller.changePassword);
router.get('/:id', auth.isAuthenticated(), controller.show);
router.post('/', controller.create);
router.put('/:id/addBookedClass', auth.isAuthenticated(), controller.addBookedClass);
router.put('/:id/cancelBookedClass', auth.isAuthenticated(), controller.cancelBookedClass);
router.put('/:id/pushTakenClass', auth.isAuthenticated(), controller.pushTakenClass);
router.put('/:id/addIntroClass', auth.isAuthenticated(), controller.addIntroClass);
router.put('/:id/cancelIntroClass', auth.isAuthenticated(), controller.cancelIntroClass);
router.put('/:id/takeIntroClass', auth.isAuthenticated(), controller.takeIntroClass);
router.put('/:id/saveClassTaught', auth.isAuthenticated(), controller.saveClassTaught);
router.put('/:id/saveInjuriesGoalsEmergency', auth.isAuthenticated(), controller.saveInjuriesGoalsEmergency);
router.put('/:id/saveEmail', auth.isAuthenticated(), controller.saveEmail);
router.put('/:id/getUser', auth.isAuthenticated(), controller.getUser);
router.put('/:id/getUserAndInjuries', auth.isAuthenticated(), controller.getUserAndInjuries);
router.put('/:id/getInjuries', auth.isAuthenticated(), controller.getInjuries);
router.put('/:id/generateReferralCode', auth.isAuthenticated(), controller.generateReferralCode);
router.put('/:id/saveTimezone', auth.isAuthenticated(), controller.saveTimezone);

router.put('/:id/createIntercomHash', auth.isAuthenticated(), controller.createIntercomHash);

router.put('/:id/checkCoupon', auth.isAuthenticated(), controller.checkCoupon);

router.put('/:id/sendWelcomeEmail', auth.isAuthenticated(), controller.sendWelcomeEmail);

router.get('/:id/getSubscription', auth.isAuthenticated(), controller.getSubscription);

router.get('/:id/createTokBoxSession', auth.hasRole('admin'), controller.createTokBoxSession);
router.put('/:id/createTokBoxToken', auth.isAuthenticated(), controller.createTokBoxToken);

router.put('/:id/addRating', auth.isAuthenticated(), controller.addRating);
router.put('/:id/saveResult', auth.isAuthenticated(), controller.saveResult);

router.put('/:id/tourtipShown', auth.isAuthenticated(), controller.tourtipShown);

router.post('/charge', auth.isAuthenticated(), controller.postBilling);

router.post('/cancelsub', auth.isAuthenticated(), controller.cancelSubscription);

// router.post('/charge',
  // setRedirect({auth: '/', success: '/billing', failure: '/billing'}),
  // auth.isAuthenticated(),
  // controller.postPlan);

module.exports = router;
