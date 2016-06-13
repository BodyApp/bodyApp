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
      .state('discover', {
        url: '/discover',
        templateUrl: 'app/main/discover.html',
        controller: 'DiscoverCtrl'
      });
  })
  .config(function ($stateProvider) {
    $stateProvider
      .state('newSignUp', {
        url: '/newsignup',
        templateUrl: 'app/main/newSignUp.html',
        controller: 'NewSignupCtrl'
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