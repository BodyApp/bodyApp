'use strict';

angular.module('bodyAppApp')
  .controller('SignupCtrl', function ($scope, Auth, $location, $window) {
    $scope.user = {};
    $scope.errors = {};

    $scope.register = function(form) {
      $scope.submitted = true;
      if(form.$valid) {
        Auth.createUser({
          firstName: $scope.user.firstName,
          lastName: $scope.user.lastName,
          // nickName: $scope.user.nickName,
          // birthday: $scope.user.birthday,
          email: $scope.user.email,
          gender: $scope.user.gender,
          password: $scope.user.password
        })
        .then( function(result) {
          console.log(result.toString())
          if (!result) {
            $window.location.reload()
          } else {
            $scope.emailInUse = true;
          }
          // Account created, redirect to home
          // $location.path('/');
        })
        .catch( function(err) {
          console.log("issue")
          err = err.data;
          $scope.errors = {};

          // Update validity of form fields that match the mongoose errors
          angular.forEach(err.errors, function(error, field) {
            form[field].$setValidity('mongoose', false);
            $scope.errors[field] = error.message;
          });
        });
      }
    };

    $scope.loginOauth = function(provider) {
      $window.location.href = '/auth/' + provider;
    };
  });
