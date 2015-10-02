'use strict';

angular.module('bodyAppApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('schedule', {
        url: '/',
        templateUrl: 'app/schedule/consumerSchedule.html',
        controller: 'ConsumerScheduleCtrl',
        authenticate: true
      });
  })