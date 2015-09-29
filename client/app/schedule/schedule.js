'use strict';

angular.module('bodyAppApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('schedule', {
        url: '/schedule',
        templateUrl: 'app/schedule/schedule.html',
        controller: 'ScheduleCtrl'
      });
  })