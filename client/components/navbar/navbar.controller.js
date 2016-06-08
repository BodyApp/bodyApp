'use strict';

angular.module('bodyAppApp')
  .controller('NavbarCtrl', function ($scope, $location, $state, $stateParams, $uibModal, $window, $rootScope, Auth, Studios) {
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
    
    var ref;
    Studios.setCurrentStudio(studioId);
    // currentUser = Auth.getCurrentUser()
    if (!studioId) {
      studioId = 'body'
    }

    ref = firebase.database().ref().child('studios').child(studioId);

    $scope.studioId = studioId;

    if (Auth.getCurrentUser() && Auth.getCurrentUser().$promise) {
      Auth.getCurrentUser().$promise.then(function(currentUser) {
        var auth = firebase.auth();
        auth.onAuthStateChanged(function(user) {
          if (user) {
            console.log("User is authenticated with fb ");
            getAccountId()
            getSubscriptionStatus()
            // checkIfStudioAdmin()
          } else {
            console.log("User is logged out");
            if (currentUser.firebaseToken) {
              auth.signInWithCustomToken(currentUser.firebaseToken).then(function(user) {
                if (currentUser.role === "admin") console.log("Firebase user authentication succeeded!", user);
                getAccountId()
                getSubscriptionStatus()
                  // checkIfStudioAdmin()
              }); 
            } else {
              User.createFirebaseToken({ id: currentUser._id }, {}, function(token) {
                auth.signInWithCustomToken(token).then(function(user) {
                  if (currentUser.role === "admin") console.log("Firebase user authentication succeeded!", user);
                  getAccountId()
                  getSubscriptionStatus()
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


    if (OT.checkSystemRequirements() != 1 || typeof InstallTrigger !== 'undefined') {
      $scope.wrongBrowser = true;
    }

    $scope.downloadChrome = function() {
      $window.open("https://www.google.com/chrome/index.html");
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
        $rootScope.subscriptions[studioId] = snapshot.val().status
        console.log($rootScope.subscriptions)
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