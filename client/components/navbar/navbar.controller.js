'use strict';

angular.module('bodyAppApp')
  .controller('NavbarCtrl', function ($scope, $location, $state, $uibModal, $window, Auth) {
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

    $scope.clicked = false;

    var currentUser = Auth.getCurrentUser();

    if (Auth.isLoggedIn() && Auth.getCurrentUser() && Auth.getCurrentUser().$promise) {
      Auth.getCurrentUser().$promise.then(function(user) {
        $scope.completedNewUserFlow = user.completedNewUserFlow;
        if (Auth.getCurrentUser().stripe) $scope.isMember = Auth.getCurrentUser().stripe.subscription.status === "active";
      })
    } else if (Auth.isLoggedIn() && Auth.getCurrentUser()) {
      $scope.completedNewUserFlow = Auth.getCurrentUser().completedNewUserFlow;
    }

    $scope.logoStyle = {"background-color": "white"};
    $scope.imageSrc = "../assets/images/BodyLogo_blue_small.png"

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
        templateUrl: 'app/account/login/login.html',
        controller: 'LoginCtrl',
      });

      modalInstance.result.then(function (selectedItem) {
        // openStripePayment()
      }, function () {
        $window.location.href = '/auth/' + 'facebook';
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
              return "yeah baby"
            }
          }
        });

        modalInstance.result.then(function () {
          // openStripePayment()
        }, function () {
          // openStripePayment()
        });
      }
  });