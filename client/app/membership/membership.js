'use strict';

angular.module('bodyAppApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('membership', {
        url: '/membership',
        templateUrl: 'app/membership/membership.html',
        controller: 'MembershipCtrl'
      });
  });