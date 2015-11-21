'use strict';

angular.module('bodyAppApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('consumerVideo', {
        url: '/consumervideo',
        templateUrl: 'app/video/consumer_video.html',
        controller: 'VideoCtrl',
        authenticate: true
      })
      .state('trainerVideo', {
        url: '/trainervideo',
        templateUrl: 'app/video/trainer_video.html',
        controller: 'VideoCtrl',
        authenticate: true
      })
      .state('classStarting', {
        url: '/classstarting',
        templateUrl: 'app/video/classStarting.html',
        controller: 'ClassStartingCtrl',
        authenticate: true
      });
  })