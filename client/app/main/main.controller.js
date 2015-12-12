'use strict';

angular.module('bodyAppApp')
  .controller('MainCtrl', function ($scope, $http, $window, $state, Auth) {
    $scope.loginOauth = function(provider) {
      $window.location.href = '/auth/' + provider;
    };

    Auth.isLoggedInAsync(function(loggedIn) {
        if (loggedIn) {
          if (Auth.getCurrentUser().bookedIntroClass) {
            // event.preventDefault();
            $state.go('schedule');
          } else {
            // event.preventDefault;
            $state.go('newuser');
          }
        }
    });
  });
