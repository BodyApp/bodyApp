'use strict';

angular.module('bodyAppApp')
  .controller('NavbarCtrl', function ($scope, $location, $state, $stateParams, $uibModal, $window, $rootScope, Auth, Studios, User, Video) {
    $scope.menu = [{
      'title': 'Home',
      'link': '/'
    }
    // ,
    // {
    //   'title': 'Join Class',
    //   'link': '/consumervideo'
    // },
    // {
    //   'title': 'Lead Class',
    //   'link': '/trainervideo'
    // },
    // {
    //   'title': 'Schedule',
    //   'link': '/schedule'
    // }
    ];

    $scope.isCollapsed = true;
    $scope.isLoggedIn = Auth.isLoggedIn;
    $scope.isAdmin = Auth.isAdmin;
    $scope.isInstructor = Auth.isInstructor;
    $scope.getCurrentUser = Auth.getCurrentUser;
    $scope.isCurrentStudioAdmin = Studios.isAdmin;

    $scope.clicked = false;

    $scope.logoStyle = {"background-color": "white"};
    $scope.imageSrc = "../assets/images/BodyLogo_blue_small.png"

    var modalInstance;
    // $scope.isCurrentStudioAdmin = false;

    var studioId = $stateParams.studioId;
    var accountId;
    var currentUser;

    if (!studioId) {
      studioId = 'body'
    }

    var ref = firebase.database().ref().child('studios').child(studioId);
    Studios.setCurrentStudio(studioId);
    // currentUser = Auth.getCurrentUser()

    $scope.studioId = studioId;

    if (Auth.getCurrentUser() && Auth.getCurrentUser().$promise) {
      Auth.getCurrentUser().$promise.then(function(data) {
        currentUser = data;

        var auth = firebase.auth();
        auth.onAuthStateChanged(function(user) {
          if (user) {
            console.log("User is authenticated with fb ");
            getAccountId()
            getSubscriptionStatus()
            updateIntercom(currentUser)
            geolocate()
            // checkIfStudioAdmin()
          } else {
            console.log("User is logged out");
            if (currentUser.firebaseToken) {
              auth.signInWithCustomToken(currentUser.firebaseToken).then(function(user) {
                if (currentUser.role === "admin") console.log("Firebase user authentication succeeded!", user);
                getAccountId()
                getSubscriptionStatus()
                updateIntercom(currentUser)
                geolocate()
                  // checkIfStudioAdmin()
              }); 
            } else {
              User.createFirebaseToken({ id: currentUser._id }, {}, function(token) {
                auth.signInWithCustomToken(token).then(function(user) {
                  if (currentUser.role === "admin") console.log("Firebase user authentication succeeded!", user);
                  getAccountId()
                  getSubscriptionStatus()
                  updateIntercom(currentUser)
                  geolocate()
                    // checkIfStudioAdmin()
                }); 
              })
              // Auth.logout();
              // $window.location.reload()
            }
          }
        })
      })
    }
      
    // }

    function updateIntercom(user) {
      if (user.intercomHash) {
        window.intercomSettings = {
          app_id: "daof2xrs",
          name: user.firstName + " " + user.lastName, // Full name
          email: user.email, // Email address
          user_id: user._id,
          user_hash: user.intercomHash,
          "goals": user.goals,
          "emergencyContact": user.emergencyContact,
          "injuries": user.injuries,
          // "latestClass_at": user.classesBookedArray ? Math.floor(new Date(user.classesBookedArray[user.classesBookedArray.length-1]*1) / 1000) : "",
          // "bookedIntro": user.bookedIntroClass ? user.bookedIntroClass : false,
          // "introTaken": user.introClassTaken ? user.introClassTaken : false,
          "numFriendsOnPlatform": user.friendList ? user.friendList.length : 0,
          "newUserFlowComplete": user.completedNewUserFlow ? user.completedNewUserFlow : false,
          // "isPayingMember" : user.stripe ? user.stripe.subscription.status === "active" : false,
          // "introClassBooked_at": Math.floor(new Date(user.introClassBooked*1) / 1000),
          "referredBy": user.referredBy,
          "referralCode" : user.referralCode,
          "role": user.role,
          "timezone": user.timezone
        };
      } else {
        User.createIntercomHash({id: user._id}, {}, function(user) {
          Auth.updateUser(user);
          window.intercomSettings = {
            app_id: "daof2xrs",
            name: user.firstName + " " + user.lastName, // Full name
            email: user.email, // Email address
            user_id: user._id,
            user_hash: user.intercomHash,
            "goals": user.goals,
            "emergencyContact": user.emergencyContact,
            "injuries": user.injuries,
            // "latestClass_at": user.classesBookedArray ? Math.floor(new Date(user.classesBookedArray[user.classesBookedArray.length-1]*1) / 1000) : "",
            // "bookedIntro": user.bookedIntroClass,
            // "introTaken": user.introClassTaken,
            "numFriendsOnPlatform": user.friendList ? user.friendList.length : 0,
            "newUserFlowComplete": user.completedNewUserFlow,
            // "isPayingMember" : user.stripe ? user.stripe.subscription.status === "active" : false,
            // "introClassBooked_at": Math.floor(new Date(user.introClassBooked*1) / 1000),
            "referredBy": user.referredBy,
            "referralCode" : user.referralCode,
            "role": user.role,
            "timezone": user.timezone
          };
        }, function(err) {console.log("Error creating Intercom hash: "+err)}).$promise;
      }
    } 


    if (OT.checkSystemRequirements() != 1 || typeof InstallTrigger !== 'undefined') {
      $scope.wrongBrowser = true;
    }

    $scope.downloadChrome = function() {
      $window.open("https://www.google.com/chrome/index.html");
    }

    function geolocate() {
      firebase.database().ref().child('fbUsers').child(currentUser.facebookId).child('location').once('value', function(snapshot) {
        var timeOneHourAgo = new Date().getTime() - 1000*60*60
        if (!snapshot.exists() || snapshot.val().lastUpdated < timeOneHourAgo) { //Only run geolocator every hour
          var html5Options = { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 };
          geolocator.locate(onGeoSuccess, function(err) {console.log(err)}, true, html5Options);    
        }
      })
    }

    function onGeoSuccess(location) {
      // console.log(location)
      if (location && location.address) {
        firebase.database().ref().child('fbUsers').child(currentUser.facebookId).child('location').update({
          'lastUpdated': new Date().getTime(),
          'city': location.address.city, 
          'region': location.address.region, 
          'postalCode': location.address.postalCode, 
          'countryCode': location.address.countryCode,
          'country': location.address.country
        }, function(err) { 
          if (err) return console.log(err); 
          return console.log("user location updated")
        })
      }
    }
    

    // function checkIfStudioAdmin() {
    //   $scope.isCurrentStudioAdmin = Studios.isAdmin();
    //   if(!$scope.$$phase) $scope.$apply();
    // }

    function getSubscriptionPlan() {
      ref.child("stripeConnected").child('subscriptionPlans').once('value', function(snapshot) {
        snapshot.forEach(function(plan) {
          $scope.subscriptionPlan = plan.val()
        })
      })

      // firebase.database().ref().child('fbUsers').child(currentUser.facebookId).child('studioSubscriptions').child(studioId).child('subscription').on('value', function(snapshot) {
      //   $rootScope.subscriptions = $rootScope.subscriptions || {}
      //   $rootScope.subscriptions[studioId] = snapshot.val().status
      //   console.log($rootScope.subscriptions)
      // })
    }

    function getSubscriptionStatus() {
      firebase.database().ref().child('fbUsers').child(Auth.getCurrentUser().facebookId).child('studioSubscriptions').child(studioId).child('subscription').on('value', function(snapshot) {
        if (!snapshot.exists()) return
        $rootScope.subscriptions = $rootScope.subscriptions || {}
        $rootScope.subscriptions[studioId] = snapshot.val().status
        // console.log($rootScope.subscriptions)
      })
    }

    function getAccountId() {
      ref.child("stripeConnected").child('stripe_user_id').once('value', function(snapshot) {
        if (!snapshot.exists()) return console.log("No account ID exists")
        accountId = snapshot.val()
      })
    }

    $scope.hover = function(element) {
      $scope.imageSrc = "assets/images/BodyLogo_white_small.png";
      $scope.logoStyle = {"background-color": "black"};
    }

    $scope.unhover = function(element) {
      $scope.imageSrc = "assets/images/BodyLogo_blue_small.png";
      $scope.logoStyle = {"background-color": "white"};
    }

    $scope.logout = function() {
      Auth.logout();
      $window.location.reload()
    };

    $scope.loginOauth = function(provider) {
      $window.location.href = '/auth/' + provider;
    };

    $scope.signUp = function() {
      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: 'app/account/signup/signup.html',
        controller: 'SignupCtrl',
        windowClass: "modal-tall"
      });

      modalInstance.result.then(function (selectedItem) {
        // openStripePayment()
      }, function () {
        // $window.location.href = '/auth/' + 'facebook';
      });
    }

    $scope.openSpreadTheWordModal = function() {
      modalInstance = $uibModal.open({
        animation: true,
        templateUrl: 'components/navbar/spreadTheWordModal.html',
        controller: 'SpreadWordCtrl',
        windowClass: "modal-tall"
      });
    }

    $scope.closeModal = function() {
      if (modalInstance) modalInstance.close()
    }

    $scope.login = function() {
      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: 'app/account/login/login.html',
        controller: 'LoginCtrl',
        windowClass: "modal-tall"
      });

      modalInstance.result.then(function (selectedItem) {
        // openStripePayment()
      }, function () {
        // $window.location.href = '/auth/' + 'facebook';
      });
    }

    $scope.isActive = function(route) {
      return route === $location.path();
    };

    $scope.checkClickCorrect = function() {
      $scope.clicked = !$scope.clicked;
    }

    $scope.showMembershipModal = function() {
      if ($rootScope.subscribing) return
      var modalInstance = $uibModal.open({
          animation: true,
          templateUrl: 'app/membership/membership.html',
          controller: 'MembershipCtrl',
          windowClass: "modal-wide",
          resolve: {
            slot: function() {
              return undefined
            },
            studioId: function() {
              return studioId
            },
            accountId: function() {
              return accountId
            }
          }
        });

        modalInstance.result.then(function () {
          // if (Auth.getCurrentUser().stripe) $scope.isMember = Auth.getCurrentUser().stripe.subscription.status === "active";
        }, function () {
          // if (Auth.getCurrentUser().stripe) $scope.isMember = Auth.getCurrentUser().stripe.subscription.status === "active";
        });
      }
  });