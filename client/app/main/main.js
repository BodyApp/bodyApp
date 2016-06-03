'use strict';

angular.module('bodyAppApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('main', {
        url: '/',
        templateUrl: 'app/main/main.html',
        controller: 'MainCtrl'
      });
  })
  .config(function ($stateProvider) {
    $stateProvider
      .state('producthunt', {
        url: '/producthunt',
        templateUrl: 'app/main/producthunt.html',
        controller: 'MainCtrl'
      });
  })
  ;