'use strict';

var express = require('express');
var passport = require('passport');
var auth = require('../auth.service');

var router = express.Router();

router
  .get('/', passport.authenticate('facebook', {
    scope: ['email', 'public_profile', 'user_friends'], // Permissions asked to user
    failureRedirect: '/signup',
    session: false
  }))

  .get('/askfordeclined', passport.authenticate('facebook', {
    authType: 'rerequest',
    scope: ['email', 'public_profile', 'user_friends'], // Permissions asked to user
    failureRedirect: '/signup',
    session: false
  }))

  .get('/callback', passport.authenticate('facebook', {
    failureRedirect: '/signup',
    session: false
  }), auth.setTokenCookie);

module.exports = router;