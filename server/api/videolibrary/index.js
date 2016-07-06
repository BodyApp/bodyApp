'use strict';

var express = require('express');
var controller = require('./videoLibrary.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.post('/getstudiovideos', auth.isAuthenticated(), controller.getStudioVideos);

module.exports = router;