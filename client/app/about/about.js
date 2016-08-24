'use strict';

angular.module('bodyAppApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('about', {
        url: '/about',
        templateUrl: 'app/about/about.html',
        controller: 'AboutCtrl'
      })
      .state('coaching', {
        url: '/coaching',
        templateUrl: 'app/about/coaching.html',
        controller: 'AboutCtrl'
      })
      .state('experience', {
        url: '/experience',
        templateUrl: 'app/about/experience.html',
        controller: 'AboutCtrl'
      })
      .state('program', {
        url: '/program',
        templateUrl: 'app/about/program.html',
        controller: 'AboutCtrl'
      })
      .state('blog', {
        url: '/blog',
        templateUrl: 'app/about/blog.html',
        controller: 'AboutCtrl'
      })
      .state('jointeam', {
        url: '/jointeam',
        templateUrl: 'app/about/jointeam.html',
        controller: 'AboutCtrl'
      })
      .state('storefronttemplate', {
        url: '/storefronttemplate',
        templateUrl: 'app/about/storefronttemplate.html',
        controller: 'AboutCtrl'
      })
  });