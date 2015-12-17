'use strict';

angular.module('bodyAppApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('team', {
        url: '/team',
        templateUrl: 'app/about/team.html',
        controller: 'AboutCtrl'
      });
  });