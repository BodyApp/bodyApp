/**
 * Main application file
 */

'use strict';

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var express = require('express');
var mongoose = require('mongoose');
var config = require('./config/environment');
var easyrtc = require("easyrtc"); 
var CronJob = require('cron').CronJob;
var Firebase = require('firebase');

// Module to call XirSys servers
var request = require("request");

// Connect to database
mongoose.connect(config.mongo.uri, config.mongo.options);
mongoose.connection.on('error', function(err) {
	console.error('MongoDB connection error: ' + err);
	process.exit(-1);
	}
);
// Populate DB with sample data
if(config.seedDB) { require('./config/seed'); }

// Setup server
var app = express();
var server = require('http').createServer(app);

// require('./config/socketio')(socketio);
require('./config/express')(app);
require('./routes')(app);

// Start server
server.listen(config.port, config.ip, function () {
  console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
});

var socketio = require('socket.io')(server, {
  serveClient: config.env !== 'production',
  path: '/socket.io-client'
});

var socketServer = require('socket.io').listen(server, {"log level":1})

	// ,
 //        function(err, rtc) {

 //            // After the server has started, we can still change the default room name
 //            rtc.setOption("appIceServers", 
 //            	[{url: "stun:stun.l.google.com:19302"},
	// 						{url: "stun:stun.sipgate.net"},
	// 						{url: "stun:217.10.68.152"},
	// 						{url: "stun:stun.sipgate.net:10000"},
	// 						{url: "stun:217.10.68.152:10000"}]);

 //            // // Creates a new application called MyApp with a default room named "SectorOne".
 //            // rtc.createApp(
 //            //     "easyrtc.instantMessaging",
 //            //     {"roomDefaultName":"SectorOne"},
 //            //     myEasyrtcApp
 //            // );
 //        });

easyrtc.on("getIceConfig", function(connectionObj, callback) {
  
    // This object will take in an array of XirSys STUN and TURN servers
    var iceConfig = [];

    request.post('https://service.xirsys.com/ice', {
        form: {
            ident: config.iceIdent,
            secret: config.iceSecret,
            domain: config.iceDomain,
            application: "default",
            room: "default",
            secure: 1
        },
        json: true
    },
    function (error, response, body) {
        if (!error && response.statusCode == 200) {
        	console.log(body);
            // body.d.iceServers is where the array of ICE servers lives
          iceConfig = body.d.iceServers;  
          console.log(iceConfig);
          callback(null, iceConfig);
        }
    });
});

// Start EasyRTC server
var rtc = easyrtc.listen(app, socketServer, {logLevel:1})

//Cron job that checks classes and flags past classes with 'past' and full classes with classFull. Should run every 30 seconds
new CronJob('29 * * * * *', function() {
	var todayDate = new Date();
  var sunDate = new Date();
  sunDate.setDate(todayDate.getDate() - todayDate.getDay());
  var weekOf = "weekof"+(sunDate.getMonth()+1)+sunDate.getDate()+sunDate.getFullYear()
	var weeklyFirebaseRef = new Firebase("https://bodyapp.firebaseio.com/"+(weekOf));

	weeklyFirebaseRef.once("value", function(currentWeek) {
		currentWeek = currentWeek.val()
	  for (var day in currentWeek) {
    	for (var slot in currentWeek[day].slots) {
        if (slot <= (todayDate.getTime() - 45*60*1000) && !currentWeek[day].slots[slot].past) { //Can book (and join) a class up to 45 minutes into class starting
          weeklyFirebaseRef.child(day).child("slots").child(slot).update({past: true})
          console.log("class " + slot + " is now in the past")
	      } else if (!currentWeek[day].slots[slot].past && currentWeek[day].slots[slot].bookedUsers && Object.keys(currentWeek[day].slots[slot].bookedUsers).length >= 12) { //Prevents more than 12 people from joining
          weeklyFirebaseRef.child(day).child("slots").child(slot).update({classFull: true})
          console.log("class " + slot + " is now full")
	      }
	    }
    }
	})
}, null, true, 'America/New_York');

// Expose app
exports = module.exports = app;
