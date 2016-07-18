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
        params: {
          tag: '',
        },
        templateUrl: 'app/main/discover.html',
        controller: 'DiscoverCtrl'
      });
  })
  .config(function ($stateProvider) {
    $stateProvider
      .state('signup', {
        url: '/signup',
        params: {
           step: 0,
           mode: 'signup'
         },
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
  .config(function ($stateProvider) {
    $stateProvider
      .state('testimonials', {
        url: '/testimonials',
        templateUrl: 'app/main/testimonials.html',
        controller: 'MainCtrl'
      });
  })
  ;