'use strict';

var path = require('path');
var _ = require('lodash');

function requiredProcessEnv(name) {
  if(!process.env[name]) {
    throw new Error('You must set the ' + name + ' environment variable');
  }
  return process.env[name];
}

// All configurations will extend these options
// ============================================
var all = {
  env: process.env.NODE_ENV,

  // Root path of server
  root: path.normalize(__dirname + '/../../..'),

  // Server port
  port: process.env.PORT || 9000,

  // Server IP
  ip: process.env.IP || '0.0.0.0',

  // Should we populate the DB with sample data?
  seedDB: false,

  // Secret for session, you will want to change this and make it an environment variable
  secrets: {
    session: process.env.Session_Secret || "bodyAppTestSecret"
  },

  // List of user roles
  userRoles: ['guest', 'user', 'admin'],

  // MongoDB connection options
  mongo: {
    options: {
      db: {
        safe: true
      }
    }
  },

  iceIdent: process.env.iceIdent,
  iceSecret: process.env.iceSecret,
  iceDomain: process.env.iceDomain,

  tokBoxApiSecret: process.env.tokBoxApiSecret || 'secret',
  tokBoxApiKey: process.env.tokBoxApiKey || 'key',

  mailgunApiKey: process.env.mailgunApiKey || 'key',
  mailgunFromWho: 'BODY Concierge <concierge@getbodyapp.com>',

  stripeOptions: {
    apiKey: process.env.STRIPE_KEY || 'key',
    stripePubKey: process.env.STRIPE_PUB_KEY || 'pubKey',
    // defaultPlan: 'basicSubscription',
    // plans: ['basicSubscription'],
    // planData: {
    //   'basicSubscription': {
    //     name: 'Monthly Subscription',
    //     price: 40
    //   }
    // }
  },

  firebaseSecret: process.env.firebaseSecret,

  intercomSecret: process.env.intercomSecret,

  awsKey: process.env.AWS_ACCESS_KEY_ID || 'key',
  awsSecret: process.env.AWS_SECRET_ACCESS_KEY || 'secret',

  ziggeo: {
    token: process.env.ziggeo_token,
    private_key: process.env.ziggeo_private_key,
    encryption_key: process.env.ziggeo_encryption_key
  },
  
  facebook: {
    clientID:     process.env.FACEBOOK_ID || 'id',
    clientSecret: process.env.FACEBOOK_SECRET || 'secret',
    callbackURL:  (process.env.DOMAIN || '') + '/auth/facebook/callback'
  },

  stripe: {
    clientID:     process.env.STRIPE_ID || 'id',
    clientSecret: process.env.STRIPE_KEY || 'secret',
    callbackURL:  (process.env.DOMAIN || '') + '/auth/stripe/callback'
  },

  twitter: {
    clientID:     process.env.TWITTER_ID || 'id',
    clientSecret: process.env.TWITTER_SECRET || 'secret',
    callbackURL:  (process.env.DOMAIN || '') + '/auth/twitter/callback'
  },

  google: {
    clientID:     process.env.GOOGLE_ID || 'id',
    clientSecret: process.env.GOOGLE_SECRET || 'secret',
    callbackURL:  (process.env.DOMAIN || '') + '/auth/google/callback'
  }
};

// Export the config object based on the NODE_ENV
// ==============================================
module.exports = _.merge(
  all,
  require('./' + process.env.NODE_ENV + '.js') || {});
