'use strict';

var express = require('express');
var passport = require('passport');
var auth = require('../auth.service');

var router = express.Router();

router
  .get('/', 
    function(req, res, next) {
      passport.authenticate('stripe', { scope: 'read_write' , state: req.query.studioid})(req, res, next)
    }
  )

  .get('/callback',  
    passport.authenticate('stripe', { failureRedirect: '/login' }),
    function(req, res) {
      // console.log(req)
      // console.log(res);
      // Successful authentication, redirect home.
      res.redirect('/');
    }
  )

module.exports = router;