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
  .config(function ($stateProvider) {
    $stateProvider
      .state('open-a-studio', {
        url: '/open-a-studio',
        templateUrl: 'app/main/open-a-studio.html',
        controller: 'MainCtrl'
      });
  })
  .config(function ($stateProvider) {
    $stateProvider
      .state('setup-studio', {
        url: '/setup-studio',
        templateUrl: 'app/main/setup-studio.html',
        controller: 'MainCtrl'
      });
  })
  .config(function ($stateProvider) {
    $stateProvider
      .state('class-starting', {
        url: '/class-starting',
        templateUrl: 'app/main/class-starting.html',
        controller: 'MainCtrl'
      });
  })
  .config(function ($stateProvider) {
    $stateProvider
      .state('invite-a-friend', {
        url: '/invite-a-friend',
        templateUrl: 'app/main/invite-a-friend.html',
        controller: 'MainCtrl'
      });
  })
  ;