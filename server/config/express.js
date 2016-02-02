/**
 * Express configuration
 */

'use strict';

var express = require('express');
var favicon = require('serve-favicon');
var morgan = require('morgan');
var compression = require('compression');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var cookieParser = require('cookie-parser');
var errorHandler = require('errorhandler');
var path = require('path');
var config = require('./environment');
var passport = require('passport');
var session = require('express-session');
var mongoStore = require('connect-mongo')(session);
var mongoose = require('mongoose');

module.exports = function(app) {
  var env = app.get('env');

  app.set('views', config.root + '/server/views');
  app.engine('html', require('ejs').renderFile);
  app.set('view engine', 'html');
  
  app.use(compression());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(methodOverride());
  app.use(cookieParser());
  app.use(passport.initialize());

  //Allow Javascript website to be crawled perfectly by search engines.
  app.use(require('prerender-node').set('prerenderToken', '0xk2UugZ3MhosEzMYK0rg'));

  // Persist sessions with mongoStore
  // We need to enable sessions for passport twitter because its an oauth 1.0 strategy
  app.use(session({
    secret: config.secrets.session,
    resave: true,
    saveUninitialized: true,
    store: new mongoStore({
      mongooseConnection: mongoose.connection,
      db: 'body-app'
    })
  }));

// app.use(function(req, res, next) {
//   var fragment = req.query._escaped_fragment_;
 
//   // If there is no fragment in the query params
//   // then we're not serving a crawler
//   if (!fragment) return next();
 
//   // If the fragment is empty, serve the
//   // index page
//   if (fragment === "" || fragment === "/")
//     fragment = "/snapshot__index.html";
 
//   // If fragment does not start with '/'
//   // prepend it to our fragment
//   if (fragment.charAt(0) !== "/") {
//     fragment = '/snapshot__' + fragment;
//   } else if (fragment.charAt(0) === "/") {
//     fragment = '/snapshot__' + fragment.substring(1);
//   }
 
//   // If fragment does not end with '.html'
//   // append it to the fragment
//   if (fragment.indexOf('.html') == -1)
//     fragment += ".html";
 
//   // Serve the static html snapshot
//   try {
//     var file = __dirname + "/snapshots" + fragment;
//     console.log(file)
//     res.sendFile(file);
//   } catch (err) {
//     res.send(404);
//   }
// });
  
  if ('production' === env) {
    app.use(favicon(path.join(config.root, 'public', 'favicon.ico')));
    app.use(express.static(path.join(config.root, 'public')));
    app.set('appPath', path.join(config.root, 'public'));
    app.use(morgan('dev'));
  }

  if ('development' === env || 'test' === env) {
    app.use(require('connect-livereload')());
    app.use(express.static(path.join(config.root, '.tmp')));
    app.use(express.static(path.join(config.root, 'client')));
    app.set('appPath', path.join(config.root, 'client'));
    app.use(morgan('dev'));
    app.use(errorHandler()); // Error handler - has to be last
  }

};