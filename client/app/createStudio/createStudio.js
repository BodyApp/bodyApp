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
  ;