'use strict';

angular.module('bodyAppApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('schedule', {
        url: '/schedule',
        templateUrl: 'app/schedule/consumerSchedule.html',
        controller: 'ConsumerScheduleCtrl',
        // authenticate: true
      });
  })