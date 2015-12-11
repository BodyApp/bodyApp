'use strict';

angular.module('bodyAppApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('newuser', {
        url: '/newuser',
        templateUrl: 'app/main/main.html',
        controller: 'NewUserCtrl'
      });
  });