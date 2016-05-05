'use strict';

var express = require('express');
var passport = require('passport');
var auth = require('../auth.service');

var router = express.Router();

router
  .get('/',
      passport.authenticate('stripe', { scope: 'read_write' }))

  .get('/callback',
      passport.authenticate('stripe', { failureRedirect: '/login' }),
      function(req, res) {
        // Successful authentication, redirect home.
        res.redirect('/');
      });

module.exports = router;