'use strict';

angular.module('bodyAppApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('newuser1', {
        url: '/newuser1',
        templateUrl: 'app/newUser/newUser1.html',
        controller: 'NewUserCtrl'
      });
  });