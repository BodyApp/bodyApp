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
      .state('class-starting', {
        url: '/class-starting',
        templateUrl: 'app/main/class-starting.html',
        controller: 'MainCtrl'
      });
  })
  .config(function ($stateProvider) {
    $stateProvider
      .state('userVideoTemplate', {
        url: '/userVideoTemplate',
        templateUrl: 'app/main/userVideoTemplate.html',
        controller: 'MainCtrl'
      });
  })
  .config(function ($stateProvider) {
    $stateProvider
      .state('trainerVideoTemplate', {
        url: '/trainerVideoTemplate',
        templateUrl: 'app/main/trainerVideoTemplate.html',
        controller: 'MainCtrl'
      });
  })
  .config(function ($stateProvider) {
    $stateProvider
      .state('discover', {
        url: '/discover',
        templateUrl: 'app/main/discover.html',
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