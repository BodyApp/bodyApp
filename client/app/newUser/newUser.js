'use strict';

angular.module('bodyAppApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('newuser', {
        url: '/newuser',
        templateUrl: 'app/newUser/newUser1.html',
        controller: 'NewUserCtrl',
        authenticate: true
      })
  });