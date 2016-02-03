'use strict';

angular.module('bodyAppApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('admin', {
        url: '/admin',
        templateUrl: 'app/admin/admin.html',
        authenticate: true,
        controller: 'AdminCtrl'
      })
      // .state('createclass', {
      //   url: '/createclass',
      //   templateUrl: 'app/admin/createClass.html',
      //   controller: 'AdminCtrl'
      // })
      ;
  });