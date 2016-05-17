'use strict';

angular.module('bodyAppApp')
  .controller('NavbarCtrl', function ($scope, $location, $state, $stateParams, $uibModal, $window, Auth, Studios) {
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
    var accessCode;
    
    var ref;
    Studios.setCurrentStudio(studioId);
    // currentUser = Auth.getCurrentUser()
    if (studioId) {
      ref = new Firebase("https://bodyapp.firebaseio.com/studios").child(studioId);
    } else {
      studioId = 'ralabala';
      // $location.path('/ralabala/admin')
      ref = new Firebase("https://bodyapp.firebaseio.com/studios").child("ralabala");
    }

    $scope.studioId = studioId;

    if (Auth.getCurrentUser() && Auth.getCurrentUser().$promise) {
      Auth.getCurrentUser().$promise.then(function(currentUser) {
        ref.onAuth(function(authData) {
          if (authData) {
            console.log("User is authenticated with fb ");
            getAccessCode()
            // checkIfStudioAdmin()
          } else {
            console.log("User is logged out");
            if (currentUser.firebaseToken) {
              ref.authWithCustomToken(currentUser.firebaseToken, function(error, authData) {
                if (error) {
                  Auth.logout();
                  $window.location.reload()
                  console.log("Firebase currentUser authentication failed", error);
                } else {
                  if (currentUser.role === "admin") console.log("Firebase user authentication succeeded!", authData);
                  getAccessCode()
                  // checkIfStudioAdmin()
                }
              }); 
            } else {
              // Auth.logout();
              // $window.location.reload()
            }
          }
        })
      })
    }
      
    // }

    

    // function checkIfStudioAdmin() {
    //   $scope.isCurrentStudioAdmin = Studios.isAdmin();
    //   if(!$scope.$$phase) $scope.$apply();
    // }

    function getAccessCode() {
      ref.child('stripeConnected').child('access_token').once('value', function(snapshot) {
        if (!snapshot.exists()) return console.log("No access token exists")
        accessCode = snapshot.val()
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
            accessCode: function() {
              return accessCode
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