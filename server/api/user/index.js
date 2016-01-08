'use strict';

var express = require('express');
var controller = require('./user.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/', auth.hasRole('admin'), controller.index);
router.get('/instructors', controller.getInstructors);
router.get('/admins', controller.getAdmins);
router.delete('/:id', auth.hasRole('admin'), controller.destroy);
router.get('/me', auth.isAuthenticated(), controller.me);
router.put('/:id/password', auth.isAuthenticated(), controller.changePassword);
router.get('/:id', auth.isAuthenticated(), controller.show);
router.post('/', controller.create);
router.put('/:id/addBookedClass', auth.isAuthenticated(), controller.addBookedClass);
router.put('/:id/addIntroClass', auth.isAuthenticated(), controller.addIntroClass);
router.put('/:id/saveClassTaught', auth.isAuthenticated(), controller.saveClassTaught);
router.put('/:id/saveInjuries', auth.isAuthenticated(), controller.saveInjuries);
router.put('/:id/saveEmailAddress', auth.isAuthenticated(), controller.saveEmail);
router.put('/:id/getUser', auth.isAuthenticated(), controller.getUser);

router.get('/:id/getSubscription', controller.getSubscription);

router.get('/:id/createTokBoxSession', controller.createTokBoxSession);
router.put('/:id/createTokBoxToken', auth.isAuthenticated(), controller.createTokBoxToken);

router.put('/:id/addRating', auth.isAuthenticated(), controller.addRating);

router.post('/charge',
//   // setRedirect({auth: '/', success: '/billing', failure: '/billing'}),
//   // auth.isAuthenticated(),
  controller.postBilling);

router.post('/cancelsub', controller.cancelSubscription);


// router.post('/charge',
  // setRedirect({auth: '/', success: '/billing', failure: '/billing'}),
  // auth.isAuthenticated(),
  // controller.postPlan);

module.exports = router;
