'use strict';

angular.module('bodyApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('consumerVideo', {
        url: '/consumervideo',
        templateUrl: 'app/video/consumer_video.html',
        controller: 'ConsumerVideoCtrl'
      })
      .state('trainerVideo', {
        url: '/trainervideo',
        templateUrl: 'app/video/trainer_video.html',
        controller: 'TrainerVideoCtrl'
      });
  });