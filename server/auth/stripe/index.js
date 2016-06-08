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
    function(req, res, next) {
      passport.authenticate('stripe',   
        function(err, studioId) {
          res.redirect('/studios/'+studioId+'/pricing');
        }
      )(req, res, next)
    } 
  )

module.exports = router;