'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');
var authTypes = ['github', 'twitter', 'facebook', 'google'];
var stripeCustomer = require('../payment/payment.controller');
var config = require('../../config/environment');

var UserSchema = new Schema({
  firstName: String,
  lastName: String,
  nickName: String,
  gender: String,
  email: { type: String, lowercase: true },
  role: {
    type: String,
    default: 'user'
  },
  hashedPassword: String,
  provider: String,
  salt: String,
  picture: String,
  birthday: String,
  friendListObject: Object,
  classesTaken: [],
  classesTaught: [],
  classesBooked: Object,
  dropInClasses: Object,
  classesCancelled: Object,
  facebookId: String,
  friendList: Array,
  injuries: String,
  trainerCredential1: String,
  trainerCredential2: String,
  trainerCredential3: String,
  trainerCredential4: String,
  funFact: String,
  bio: String,
  trainerRating: Number,
  trainerNumRatings: Number,
  bookedIntroClass: Boolean,
  introClassBooked: Number,
  completedNewUserFlow: Boolean,
  introClassTaken: Boolean,
  tourtipShown: String,
  shippingAddress: Object,
  level: Number,
  goals: String,
  emergencyContact: Object,
  intercomHash: Object,
  signUpDate: Date,
  lastLoginDate: Date,
  welcomeEmailSent: Date,
  timezone: String,
  results: Schema.Types.Mixed,
  ratingsSubmitted: Array,
  mostRecentCoupon: String,
  referralCode: String,
  singleParentCode: String,
  referredBy: String,
  usersReferred: Object,
  referrals: Object,
  facebook: {},
  twitter: {},
  google: {},
  github: {},
  firebaseToken: String,
  studioEmployee: Object,
  studioSubscriptions: Object
});

//Sets up Stripe
var stripeOptions = config.stripeOptions;
UserSchema.plugin(stripeCustomer, stripeOptions);

/**
 * Virtuals
 */
UserSchema
  .virtual('password')
  .set(function(password) {
    this._password = password;
    this.salt = this.makeSalt();
    this.hashedPassword = this.encryptPassword(password);
  })
  .get(function() {
    return this._password;
  });

// Public profile information
UserSchema
  .virtual('profile')
  .get(function() {
    return {
      'nickName': this.nickName,
      'firstName': this.firstName,
      'lastName': this.lastName.charAt(0),
      'gender': this.gender,
      'role': this.role,
      'picture': this.picture,
      'facebookId': this.facebookId,
      'trainerCredential1': this.trainerCredential1,
      'trainerCredential2': this.trainerCredential2,
      'trainerCredential3': this.trainerCredential3,
      'trainerCredential4': this.trainerCredential4,
      'trainerRating': this.trainerRating,
      'trainerNumRatings': this.trainerNumRatings,
    };
  });

// Injury information kept out of public profile
UserSchema
  .virtual('injuryInfo')
  .get(function() {
    return this.injuries
  });

// Non-sensitive info we'll be putting in the token
UserSchema
  .virtual('token')
  .get(function() {
    return {
      '_id': this._id,
      'role': this.role
    };
  });

/**
 * Validations
 */

// Validate empty email
UserSchema
  .path('email')
  .validate(function(email) {
    if (authTypes.indexOf(this.provider) !== -1) return true;
    return email.length;
  }, 'Email cannot be blank');

// Validate empty password
UserSchema
  .path('hashedPassword')
  .validate(function(hashedPassword) {
    if (authTypes.indexOf(this.provider) !== -1) return true;
    return hashedPassword.length;
  }, 'Password cannot be blank');

// Validate user email address doesn't exist
// UserSchema
//   .path('email')
//   .validate(function(value, respond) {
//     var self = this;
//       this.constructor.findOne({facebookId: value}, function(err, user) {
//       if(err) throw err;
//       if(user) {
//         if(self.id === user.id) return respond(true);
//         return respond(false);
//       }
//       respond(true);
//     });
// }, 'The specified email address is already in use.');

UserSchema
  .path('facebookId')
  .validate(function(value, respond) {
    var self = this;
      this.constructor.findOne({facebookId: value}, function(err, user) {
      if(err) throw err;
      if(user) {
        if(self.id === user.id) return respond(true);
        return respond(false);
      }
      respond(true);
    });
}, 'The user has already authenticated with facebook.');

var validatePresenceOf = function(value) {
  return value && value.length;
};

/**
 * Pre-save hook
 */
UserSchema
  .pre('save', function(next) {
    if (!this.isNew) return next();

    if (!validatePresenceOf(this.hashedPassword) && authTypes.indexOf(this.provider) === -1)
      next(new Error('Invalid password'));
    else
      next();
  });

/**
 * Methods
 */
UserSchema.methods = {
  /**
   * Authenticate - check if the passwords are the same
   *
   * @param {String} plainText
   * @return {Boolean}
   * @api public
   */
  authenticate: function(plainText) {
    return this.encryptPassword(plainText) === this.hashedPassword;
  },

  /**
   * Make salt
   *
   * @return {String}
   * @api public
   */
  makeSalt: function() {
    return crypto.randomBytes(16).toString('base64');
  },

  /**
   * Encrypt password
   *
   * @param {String} password
   * @return {String}
   * @api public
   */
  encryptPassword: function(password) {
    if (!password || !this.salt) return '';
    var salt = new Buffer(this.salt, 'base64');
    return crypto.pbkdf2Sync(password, salt, 10000, 64).toString('base64');
  }
};

module.exports = mongoose.model('User', UserSchema);
