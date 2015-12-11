'use strict';

angular.module('bodyAppApp')
  .controller('MainCtrl', function ($scope, $http, $window, $state, Auth) {
    $scope.loginOauth = function(provider) {
      $window.location.href = '/auth/' + provider;
    };

    Auth.isLoggedInAsync(function(loggedIn) {
        if (loggedIn) {
          event.preventDefault();
          $state.go('schedule');
        }
    });
  });
