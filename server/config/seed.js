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
    firstName: "Daniel",
    lastName: "Liebeskind",
    nickName: "Daniel",
    gender: "male",
    picture: "https://scontent.xx.fbcdn.net/hprofile-xap1/v/t1.0-1/s200x200/1484103_10100651628887376_1489797280_n.jpg?oh=51bf0d530da80068bf38f6ae71946bda&oe=56E8DAD8",
    facebookId: "10100958748247716",
    email: "daniel.liebeskind@gmail.com",
    provider: "facebook",
    role: "user",
    __v: 51,
    injuries: "Nope",
    bookedIntroClass: false,
    completedNewUserFlow: true,
    introClassTaken: false,
    // welcomeEmailSent: false,
    welcomeEmailSent: new Date(),
    level: 1
    }, 
    {
    firstName: "Donna",
    lastName: "Letuch",
    nickName: "Donna",
    gender: "female",
    picture: "https://scontent.xx.fbcdn.net/hprofile-xap1/v/t1.0-1/s200x200/1484103_10100651628887376_1489797280_n.jpg?oh=51bf0d530da80068bf38f6ae71946bda&oe=56E8DAD8",
    facebookId: "112747679089662",
    email: "donna_mhsvoea_letuch@tfbnw.net",
    provider: "facebook",
    role: "admin",
    __v: 51,
    injuries: "No problemos",
    bookedIntroClass: false,
    completedNewUserFlow: false,
    introClassTaken: false,
    welcomeEmailSent: true,
    level: 1
    },
    {
    "firstName": "Justin",
    "lastName": "Mendelson",
    "nickName": "Justin",
    "gender": "male",
    "picture": "https://scontent.xx.fbcdn.net/hprofile-xtp1/v/t1.0-1/p200x200/12038409_10100959572480946_3016946238099409288_n.jpg?oh=b5110d7e2ceb46095af05e6858bc8173&oe=573FA2F3",
    "facebookId": "10100966322997856",
    "email": "jmendelson22@gmail.com",
    "provider": "facebook",
    "facebook": {
        "id": "10100966322997856",
        "friends": {
            "summary": {
                "total_count": 1390
            },
            "paging": {
                "next": "https://graph.facebook.com/v2.4/10100966322997856/friends?access_token=CAAHIgAQWChoBAL5JzHxk1faknu6nA21KYZAvbAQvIT6sVLj9chl6E09Ith1BnpjYTE4oEvZA9YtJEhiK7Bvi55MuUODq3EcZCrMfPQ7ZBJSrr6dpG7CvnnmTuRnw8rHj5r6MRv97uJ0R143eQ6AdM5F21juHzGT36N9qHCZCxaZBRa8AUnHcq6WTXY3NjxPRYZD&limit=25&offset=25&__after_id=enc_AdAuzyegHEUSMqdfECECaQJbFuNev0Rx8g0dpUZCIkQArDOXZCNyULkElAwayDqRsoKqV7VmXgomMndXuEcz4aKGZBt"
            },
            "data": [
                {
                    "id": "10102803377216385",
                    "name": "Matt Jones"
                },
                {
                    "id": "10102197121188327",
                    "name": "Tivan Amour"
                }
            ]
        },
        "picture": {
            "data": {
                "url": "https://scontent.xx.fbcdn.net/hprofile-xta1/v/t1.0-1/p200x200/12038409_10100959572480946_3016946238099409288_n.jpg?oh=b5110d7e2ceb46095af05e6858bc8173&oe=573FA2F3",
                "is_silhouette": false
            }
        },
        "gender": "male",
        "email": "jmendelson22@gmail.com",
        "name": "Justin Mendelson"
    },
    "trainerCredential1": "CF-L1 Trainer",
    "trainerRating": 5,
    "trainerNumRatings": 14,
    "friendList": [
        {
            "name": "Matt Jones",
            "id": "10102803377216385"
        },
        {
            "name": "Tivan Amour",
            "id": "10102197121188327"
        }
    ],
    "classesTaught": [
        1452812400000,
        1452826800000,
        1453226400000,
        1453554000000,
        1453572000000,
        1453575600000,
        1453557600000,
        1452892500000,
        1453042800000,
        1452990000000,
        1452993000000,
        1452995700000,
        1453048740000,
        1453049160000,
        1453057800000,
        1453236540000,
        1453250820000,
        1453251600000
    ],
    "classesTaken": [
        1452805200000
    ],
    "role": "admin",
    "__v": 72,
    "injuries": "asdf",
    "bookedIntroClass": false,
    "tourtipShown": "1452838410731",
    welcomeEmailSent: true,
    "classesBooked": {
        "1452898800000": true
    },
    "completedNewUserFlow": true
    },
    {
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