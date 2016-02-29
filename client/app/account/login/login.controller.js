'use strict';

angular.module('bodyAppApp')
  .controller('LoginCtrl', function ($scope, Auth, $location, $window) {
    $scope.user = {};
    $scope.errors = {};

    $scope.login = function(form) {
      $scope.submitted = true;

      if(form.$valid) {
        Auth.login({
          email: $scope.user.email,
          password: $scope.user.password
        })
        .then( function() {
          // Logged in, redirect to home
          $window.location.reload()
        })
        .catch( function(err) {
          $scope.errors.other = err.message;
        });
      }
    };

    $scope.currentStep = 0

    $scope.loginOauth = function(provider) {
      $window.location.href = '/auth/' + provider;
    };
  });
