'use strict';

var express = require('express');
var controller = require('./videoLibrary.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.post('/getstudiovideos', controller.getStudioVideos);
router.post('/getvideo', controller.getVideo);
router.post('/:id/deletestudiovideo', auth.isAuthenticated(), controller.deleteStudioVideo);

module.exports = router;