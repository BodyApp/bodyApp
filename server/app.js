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
var seojs = require('express-seojs');
var FirebaseTokenGenerator = require("firebase-token-generator");
var tokenGenerator = new FirebaseTokenGenerator(config.firebaseSecret);
var helmet = require('helmet');
var cluster = require('cluster'); //For worker clustering.
const numCPUs = require('os').cpus().length; //For worker clustering
var throng = require('throng'); //For worker clustering.
var WORKERS = process.env.WEB_CONCURRENCY || 1;

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

app.use(helmet()) //Sets various HTTP headers for increased security

app.use(require('prerender-node').set('prerenderToken', '0xk2UugZ3MhosEzMYKrg'));

//For google crawler
// app.use(seojs('0c4rjwdahyypq4vvuiz1jnibo'));

var forceSsl = function (req, res, next) {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(['https://', req.get('Host'), req.url].join(''));
  }
  return next();
};

if (config.env === 'production') {
  app.use(forceSsl);
}

// require('./config/socketio')(socketio);
require('./config/express')(app);
require('./routes')(app);

// throng({
//   workers: WORKERS,
//   master: startMaster,
//   start: startWorker
// });

// // This will only be called once
// function startMaster() {
//   console.log('Started master');
// }

// // This will be called four times
// function startWorker(id) {
//   console.log(`Started worker ${ id }`);

//   process.on('SIGTERM', () => {
//     console.log(`Worker ${ id } exiting...`);
//     console.log('(cleanup would happen here)');
//     process.exit();
//   });
// }

app.listen(config.port, function() {console.log("Listening on", config.port)})

// throng({
//   start: start,
//   master: startMaster,
//   workers: WORKERS
//   // lifetime: Infinity
//   }
// );

function startMaster() {
  console.log('Started master');
}

// // app.listen(config.port)

function start() {
  process.on('SIGTERM', function() {
    console.log('Worker exiting');
    process.exit();
  });

  
  // // var crypto = require('crypto');
  // // var express = require('express');
  // // var blitz = require('blitzkrieg');
  // // var app = express();
  // // console.log("hello")
  app
  //   // .use(blitz(BLITZ_KEY))
  //   // .get('/cpu', cpuBound)
  //   // .get('/memory', memoryBound)
  //   // .get('/io', ioBound)
    .listen(config.port, onListen);

//   // function cpuBound(req, res, next) {
//   //   var key = Math.random() < 0.5 ? 'ninjaturtles' : 'powerrangers';
//   //   var hmac = crypto.createHmac('sha512WithRSAEncryption', key);
//   //   var date = Date.now() + '';
//   //   hmac.setEncoding('base64');
//   //   hmac.end(date, function() {
//   //     res.send('A hashed date for you! ' + hmac.read());
//   //   });
//   // }

//   // function memoryBound(req, res, next) {
//   //   var hundredk = new Array(100 * 1024).join('X');
//   //   setTimeout(function sendResponse() {
//   //     res.send('Large response: ' + hundredk);
//   //   }, 20).unref();
//   // }

//   // function ioBound(req, res, next) {
//   //   setTimeout(function SimulateDb() {
//   //     res.send('Got response from fake db!');
//   //   }, 300).unref();
//   // }

  function onListen() {
    console.log('Listening on', config.port);
  }
}

// var server;
// if (cluster.isMaster) {
//   // Fork workers.
//   for (var i = 0; i < numCPUs; i++) {
//     cluster.fork();
//   }

//   cluster.on('exit', (worker, code, signal) => {
//     console.log(`worker ${worker.process.pid} died`);
//   });
// } else {
//   // Workers can share any TCP connection
//   // In this case it is an HTTP server
//   //Create server
//   server = require('http').createServer(app);

//   // Start server
//   server.listen(config.port, config.ip, function () {
//     console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
//   });

//   var socketio = require('socket.io')(server, {
//     serveClient: config.env !== 'production',
//     path: '/socket.io-client'
//   });

//   var socketServer = require('socket.io').listen(server, {"log level":1})
// }
 
// var firebaseToken = tokenGenerator.createToken({ uid: "excellentBodyServer" });
var ref = new Firebase("https://bodyapp.firebaseio.com/");
ref.authWithCustomToken(config.firebaseSecret, function(error, authData) {
  if (error) {
    console.log("Firebase server authentication failed", error);
  } else {
    // console.log("Firebase server authentication succeeded!", authData);
    console.log("Firebase server authentication succeeded!");
  }
// }, { remember: "sessionOnly" }); //Session expires upon browser shutdown
}); 

//Cron job that checks classes and flags past classes with 'past' and full classes with classFull. Should run every 30 seconds
// new CronJob('29 * * * * *', function() {
//   var ref = new Firebase("https://bodyapp.firebaseio.com/");
//   ref.onAuth(function(authData) {
//     if (!authData) {
//       console.log("Server authenticating with firebase.");
//       ref.authWithCustomToken(config.firebaseSecret, function(error, authData) {
//         if (error) {
//           console.log("Firebase server authentication failed", error);
//         } else {
//           console.log("Firebase server authentication successful")
//           var introRef = new Firebase("https://bodyapp.firebaseio.com/upcomingIntros/")
//           var todayDate = new Date();
//           introRef.once('value', function(snapshot) {
//             for (var introClass in snapshot.val()) {
//               if (introClass < todayDate.getTime() - 45*60*1000) {
//                 introRef.child(introClass).remove(function(error) {
//                   if (error) console.log(error)
//                   if (!error) console.log("Removed " + introClass + " from intro classes because in past.")
//                 })
//               }
//             }
//           })
//         }
//       }); 
//     } else {
//       var introRef = new Firebase("https://bodyapp.firebaseio.com/upcomingIntros/")
//       var todayDate = new Date();
//       introRef.once('value', function(snapshot) {
//         for (var introClass in snapshot.val()) {
//           if (introClass < todayDate.getTime() - 45*60*1000) {
//             introRef.child(introClass).remove(function(error) {
//               if (error) console.log(error)
//               if (!error) console.log("Removed " + introClass + " from intro classes because in past.")
//             })
//           }
//         }
//       })
//     }
//   })
// }, null, true, 'America/New_York');

// Expose app
exports = module.exports = app;
