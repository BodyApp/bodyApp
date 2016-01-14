/**
 * Main application file
 */

'use strict';

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var express = require('express');
var mongoose = require('mongoose');
var config = require('./config/environment');
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
var forceSsl = function (req, res, next) {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(['https://', req.get('Host'), req.url].join(''));
  }
  return next();
};

if (config.env === 'production') {
  app.use(forceSsl);
}

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

//Cron job that checks classes and flags past classes with 'past' and full classes with classFull. Should run every 30 seconds
new CronJob('29 * * * * *', function() {
	var todayDate = new Date();
  var sunDate = new Date();
  sunDate.setDate(todayDate.getDate() - todayDate.getDay());
  var sunGetDate = sunDate.getDate();
  var sunGetMonth = sunDate.getMonth()+1;
  var sunGetYear = sunDate.getFullYear();
  var weekOf = "weekof"+ (sunGetMonth<10?"0"+sunGetMonth:sunGetMonth) + (sunGetDate<10?"0"+sunGetDate:sunGetDate) + sunGetYear;
  var firebaseRef = new Firebase("https://bodyapp.firebaseio.com/")
	var weeklyFirebaseRef = firebaseRef.child(weekOf);

	weeklyFirebaseRef.once("value", function(currentWeek) {
		currentWeek = currentWeek.val()
	  for (var day in currentWeek) {
    	for (var slot in currentWeek[day].slots) {
        if (!currentWeek[day].slots[slot].past && slot <= (todayDate.getTime() - 45*60*1000)) { //Can book (and join) a class up to 45 minutes into class starting
          weeklyFirebaseRef.child(day).child("slots").child(slot).update({past: true})
          console.log("class " + slot + " is now in the past")
          firebaseRef.child("upcomingIntros").child(slot).remove(function(error){
            if (!error) return console.log(slot + " removed from intro classes because in past");
            if (error) return console.log(error);
          })
	      } else if (!currentWeek[day].slots[slot].past && currentWeek[day].slots[slot].bookedUsers && Object.keys(currentWeek[day].slots[slot].bookedUsers).length >= slot.spots) { //Prevents more than 15 people from joining
          weeklyFirebaseRef.child(day).child("slots").child(slot).update({classFull: true})
          console.log("class " + slot + " is now full")
          firebaseRef.child("upcomingIntros").child(slot).remove(function(error){if (!error)console.log(slot + " removed from intro classes because full")})
	      }
	    }
    }
	})

  // var upcomingIntroFirebaseRef = new Firebase("https://bodyapp.firebaseio.com/upcomingIntros");  
  // upcomingIntroFirebaseRef.once('value', function(upcomingIntros) {
  //   var intros = upcomingIntros.val()
  //   for (var intro in intros) {
  //     if (intros[intro] + 1000*60*10 < todayDate) { // Intro considered upcoming up to 10 minutes into it.
  //       console.log("Intro Class " + intros[intro] + " removed because it is in the past")
  //       upcomingIntroFirebaseRef.child(intro).remove()
  //     }
  //   }
  // })

}, null, true, 'America/New_York');

// Expose app
exports = module.exports = app;
