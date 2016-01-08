/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

'use strict';

var Thing = require('../api/thing/thing.model');
var User = require('../api/user/user.model');

// Thing.find({}).remove(function() {
//   Thing.create({
//     name : 'Development Tools',
//     info : 'Integration with popular tools such as Bower, Grunt, Karma, Mocha, JSHint, Node Inspector, Livereload, Protractor, Jade, Stylus, Sass, CoffeeScript, and Less.'
//   }, {
//     name : 'Server and Client integration',
//     info : 'Built with a powerful and fun stack: MongoDB, Express, AngularJS, and Node.'
//   }, {
//     name : 'Smart Build System',
//     info : 'Build system ignores `spec` files, allowing you to keep tests alongside code. Automatic injection of scripts and styles into your index.html'
//   },  {
//     name : 'Modular Structure',
//     info : 'Best practice client and server structures allow for more code reusability and maximum scalability'
//   },  {
//     name : 'Optimized Build',
//     info : 'Build process packs up your templates as a single JavaScript payload, minifies your scripts/css/images, and rewrites asset names for caching.'
//   },{
//     name : 'Deployment Ready',
//     info : 'Easily deploy your app to Heroku or Openshift with the heroku and openshift subgenerators'
//   });
// });

User.find({}).remove(function() {
  User.create({
    provider: 'local',
    role: 'instructor',
    firstName: 'Bern',
    lastName: 'Prince',
    nickname: 'Bern',
    birthday: new Date(),
    email: 'instructor@getbodyapp.com',
    gender: 'Male',
    picture: 'http://reebokcrossfitbackbay.com/wp-content/uploads/bfi_thumb/Bern-md2r7u98gqeubrj7basntqfgut1vy3s9jt2m7v2w3w.jpg',
    password: 'delts',
    trainerCredential1: "Qual1",
    trainerCredential2: "Qual2",
    trainerCredential3: "Qual3",
    trainerCredential4: "Qual4",
    trainerRating: 5.0,
    trainerNumRatings: 0
  }, {
    provider: 'local',
    role: 'admin',
    firstName: 'Body',
    lastName: 'Admin',
    nickname: 'Admin',
    birthday: new Date(),
    email: 'admin@getbodyapp.com',
    gender: 'Male',
    password: 'delts'
  }, function() {
      console.log('finished populating users');
    }
  );
});