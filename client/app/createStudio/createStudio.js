'use strict';

angular.module('bodyAppApp')
  .config(function ($stateProvider) {
    $stateProvider
    .state('createstudio', {
      url: '/createstudio',
      templateUrl: 'app/createStudio/createStudio.html',
      controller: 'CreateStudioCtrl',
    })
  })
  .config(function ($stateProvider) {
    $stateProvider
      .state('setup-studio', {
        url: '/setup-studio',
        templateUrl: 'app/createStudio/setup-studio.html',
        controller: 'CreateStudioCtrl'
      });
  })
  ;