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
          if (err) console.log(err)
          console.log(req.query.state)
          if (studioId) return res.redirect('/studios/'+studioId+'/editschedule');
          if (req.query.state) return res.redirect('/studios/'+req.query.state+'/editschedule');
          res.redirect('/');
        }
      )(req, res, next)
    } 
  )

module.exports = router;