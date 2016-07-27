'use strict';

angular.module('bodyAppApp')
  .controller('NavbarCtrl', function ($scope, $location, $state, $cookies, $stateParams, $uibModal, $window, $rootScope, Auth, Studios, User, Video) {
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

    //Check and handle if mobile
    if(window.innerWidth <= 990) {
      $scope.clicked = false;
      $scope.isMobile = true;
      if(!$scope.$$phase) $scope.$apply();
   } else {
     $scope.clicked = true;
      if(!$scope.$$phase) $scope.$apply();
   }

    $scope.logoStyle = {"background-color": "white"};
    $scope.imageSrc = "../assets/images/BodyLogo_blue_small.png"

    var modalInstance;
    // $scope.isCurrentStudioAdmin = false;

    var studioId = $stateParams.studioId;

    var accountId;
    var currentUser;

    $scope.stateName = $state.current.name

    // if (!studioId) {
    //   studioId = 'body'
    // }

    var ref = studioId ? firebase.database().ref().child('studios').child(studioId): null;
    // if (studioId) Studios.setCurrentStudio(studioId);
    // currentUser = Auth.getCurrentUser()

    $scope.studioId = studioId;

    if (Auth.getCurrentUser() && Auth.getCurrentUser().$promise) {
      Auth.getCurrentUser().$promise.then(function(data) {
        currentUser = data;

        var auth = firebase.auth();
        auth.onAuthStateChanged(function(user) {
          if (user) {
            console.log("User is authenticated with fb ");
            if (ref) {
              getAccountId()
              getSubscriptionStatus() 
            }
            updateIntercom(currentUser)
            geolocate()
            getStudiosAdmin()
            getTrialStatus()
            // checkIfStudioAdmin()
          } else {
            console.log("User is logged out");
            if (currentUser.firebaseToken) {
              auth.signInWithCustomToken(currentUser.firebaseToken).then(function(user) {
                if (currentUser.role === "admin") console.log("Firebase user authentication succeeded!", user);
                if (ref) {
                  getAccountId()
                  getSubscriptionStatus()  
                }
                updateIntercom(currentUser)
                geolocate()
                getStudiosAdmin()
                getTrialStatus()
                  // checkIfStudioAdmin()
              }); 
            } else {
              User.createFirebaseToken({ id: currentUser._id }, {}, function(token) {
                auth.signInWithCustomToken(token).then(function(user) {
                  if (currentUser.role === "admin") console.log("Firebase user authentication succeeded!", user);
                  if (ref) {
                    getAccountId()
                    getSubscriptionStatus()  
                  }
                  updateIntercom(currentUser)
                  geolocate()
                  getStudiosAdmin()
                  getTrialStatus()
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
          'facebookId': user.facebookId,
          user_id: user._id,
          user_hash: user.intercomHash,
          // "goals": user.goals,
          "emergencyContact": user.emergencyContact,
          // "injuries": user.injuries,
          // "latestClass_at": user.classesBookedArray ? Math.floor(new Date(user.classesBookedArray[user.classesBookedArray.length-1]*1) / 1000) : "",
          // "bookedIntro": user.bookedIntroClass ? user.bookedIntroClass : false,
          // "introTaken": user.introClassTaken ? user.introClassTaken : false,
          "numFriendsOnPlatform": user.friendList ? user.friendList.length : 0,
          // "newUserFlowComplete": user.completedNewUserFlow ? user.completedNewUserFlow : false,
          // "isPayingMember" : user.stripe ? user.stripe.subscription.status === "active" : false,
          // "introClassBooked_at": Math.floor(new Date(user.introClassBooked*1) / 1000),
          // "referredBy": user.referredBy,
          // "referralCode" : user.referralCode,
          // "role": user.role,
          "timezone": user.timezone
        };
      } else {
        User.createIntercomHash({id: user._id}, {}, function(user) {
          Auth.updateUser(user);
          window.intercomSettings = {
            app_id: "daof2xrs",
            name: user.firstName + " " + user.lastName, // Full name
            email: user.email, // Email address
            'facebookId': user.facebookId,
            user_id: user._id,
            user_hash: user.intercomHash,
            // "goals": user.goals,
            "emergencyContact": user.emergencyContact,
            // "injuries": user.injuries,
            // "latestClass_at": user.classesBookedArray ? Math.floor(new Date(user.classesBookedArray[user.classesBookedArray.length-1]*1) / 1000) : "",
            // "bookedIntro": user.bookedIntroClass,
            // "introTaken": user.introClassTaken,
            "numFriendsOnPlatform": user.friendList ? user.friendList.length : 0,
            // "newUserFlowComplete": user.completedNewUserFlow,
            // "isPayingMember" : user.stripe ? user.stripe.subscription.status === "active" : false,
            // "introClassBooked_at": Math.floor(new Date(user.introClassBooked*1) / 1000),
            // "referredBy": user.referredBy,
            // "referralCode" : user.referralCode,
            // "role": user.role,
            "timezone": user.timezone
          };
        }, function(err) {console.log("Error creating Intercom hash: "+err)}).$promise;
      }
    } 


    if (OT.checkSystemRequirements() != 1 || typeof InstallTrigger !== 'undefined') {
      $scope.wrongBrowser = true;
    }

    function getStudiosAdmin() {
      firebase.database().ref().child('fbUsers').child(currentUser.facebookId).child('studiosAdmin').on('value', function(snapshot) {
        if (!snapshot.exists()) {
          $rootScope.adminOf = false;
          if(!$scope.$$phase) $scope.$apply();
          return
        }
        $rootScope.adminOf = snapshot.val();
        $rootScope.numStudiosAdmin = Object.keys(snapshot.val()).length;
        $rootScope.adminSelected = $rootScope.adminSelected || Object.keys(snapshot.val())[0];
        if(!$scope.$$phase) $scope.$apply();
        snapshot.forEach(function(studio) {
          getStudioLogos(studio.key);
          getStudioNames(studio.key);
        })        
        // if(!$scope.$$phase) $scope.$apply();
      })
    }

    function getTrialStatus() {
      firebase.database().ref().child('usersById').child(currentUser._id).on('value', function(snapshot) {
        if (!snapshot.exists()) return;
        var timeLeft = snapshot.val().trialStart*1 + snapshot.val().trialDurationDays*24*60*60*1000 - new Date().getTime();
        if (timeLeft > 0) {
          var minutesLeftInTrial = Math.round(timeLeft / (1000*60),0);
          if (minutesLeftInTrial <= 0) return $rootScope.trialPeriodTime = false;
          if (minutesLeftInTrial > 0) $rootScope.trialPeriodTime = minutesLeftInTrial + " minutes"
          if (minutesLeftInTrial > 60) $rootScope.trialPeriodTime = Math.round(minutesLeftInTrial / 60, 0) + (Math.round(minutesLeftInTrial / 60, 0) < 2 ? " hour" : " hours");
          if (minutesLeftInTrial > 60*24) $rootScope.trialPeriodTime = Math.round(minutesLeftInTrial / 60 / 24, 0) + (Math.round(minutesLeftInTrial / 60 / 24, 0) < 2 ? " day" : " days");
          if (!$rootScope.hideTrialBanner) $rootScope.trialBannerShown = true;
          if(!$scope.$$phase) $scope.$apply();
        }
      })
    }

    $scope.clickedHideTrialBanner = function() {
      $rootScope.hideTrialBanner = true;
    }

    function getStudioLogos(studio) {
      if ($rootScope.adminStudioLogos && $rootScope.adminStudioLogos[studio]) return
      firebase.storage().ref().child('studios').child(studio).child('images/icon.jpg').getDownloadURL().then(function(url) {
        $rootScope.adminStudioLogos = $rootScope.adminStudioLogos || {};
        $rootScope.adminStudioLogos[studio] = url;
        if(!$scope.$$phase) $scope.$apply();
      }).catch(function(error) {
        // console.log(error)
      });
    }

    function getStudioNames(studio) {
      if ($rootScope.studioNames && $rootScope.studioNames[studio]) return
      firebase.database().ref().child('studios').child(studio).child('storefrontInfo').child('studioName').once('value', function(snapshot) {
        $rootScope.studioNames = $rootScope.studioNames || {};
        $rootScope.studioNames[studio] = snapshot.val();
        if(!$scope.$$phase) $scope.$apply();
      }).catch(function(error) {
        console.log(error)
      });
    }

    $scope.goToStorefront = function(studioToSelect) {
      $rootScope.adminSelected = studioToSelect;
      if(!$scope.$$phase) $scope.$apply();
      $location.path('/studios/'+$rootScope.adminSelected)      
    }

    $scope.goToSchedule = function(studioToSelect) {
      $rootScope.adminSelected = studioToSelect;
      if(!$scope.$$phase) $scope.$apply();
      $location.path('/studios/'+$rootScope.adminSelected + '/editschedule')      
    }

    $scope.goToSettings = function(studioToSelect) {
      $rootScope.adminSelected = studioToSelect;
      if(!$scope.$$phase) $scope.$apply();
      $location.path('/studios/'+$rootScope.adminSelected + '/storefrontinfo')
    }

    $scope.goToRecordVideo = function(studioToSelect) {
      $rootScope.adminSelected = studioToSelect;
      if(!$scope.$$phase) $scope.$apply();
      $location.path('/studios/'+$rootScope.adminSelected + '/recordvideo')
    }    

    $scope.goToDiscover = function() {
      $location.path('/discover')
    }

    $scope.goToUpcomingClasses = function() {
      $location.path('/user/dashboard')
    }

    // $scope.openMenu = function(ev) {
    //   $mdOpenMenu(ev)
    // }

    $scope.downloadChrome = function() {
      $window.open("https://www.google.com/chrome/index.html");
    }

    function geolocate() {
      if ($scope.geolocating) return
      $scope.geolocating = true;
      firebase.database().ref().child('fbUsers').child(currentUser.facebookId).child('location').once('value', function(snapshot) {
        var timeOneHourAgo = new Date().getTime() - 1000*60*60
        if (!snapshot.exists() || snapshot.val().lastUpdated < timeOneHourAgo) { //Only run geolocator every hour
          var html5Options = { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 };
          geolocator.locate(onGeoSuccess, function(err) {console.log(err); $scope.geolocating = false;}, true, html5Options, null);    
        }
      })
    }

    function onGeoSuccess(location) {
      $scope.geolocating = false;
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
        $rootScope.subscriptions = $rootScope.subscriptions || {}
        if (!snapshot.exists()) return
        $rootScope.subscriptions[studioId] = snapshot.val().status
        if(!$rootScope.$$phase) $rootScope.$apply();

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
      $cookies.put('loggedInPath', $location.path())
      // $rootScope.loggedInPath = $location.path()
      $state.go('signup', {step: 0, mode: 'login', provider: 'facebook'})
      // $window.location.href = '/auth/' + provider;
    };

    $scope.signUp = function() {
      $cookies.put('loggedInPath', $location.path())
      // $rootScope.loggedInPath = $location.path()
      $state.go('signup', {step: 0, mode: 'signup'})
      // var modalInstance = $uibModal.open({
      //   animation: true,
      //   templateUrl: 'app/account/signup/signup.html',
      //   controller: 'SignupCtrl',
      //   windowClass: "modal-tall"
      // });

      // modalInstance.result.then(function (selectedItem) {
      //   // openStripePayment()
      // }, function () {
      //   // $window.location.href = '/auth/' + 'facebook';
      // });
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

    $scope.closeAlertPushed = function() {
      $rootScope.closedAlert = true;
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