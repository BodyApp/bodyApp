'use strict';

angular.module('bodyAppApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('consumerVideo', {
        url: '/studios/:studioId/consumervideo',
        templateUrl: 'app/video/consumer_video.html',
        controller: 'VideoCtrl',
        authenticate: true,
        resolve: {
          studioId: function($stateParams) {
            return $stateParams.studioId
          }
        }
      })
      .state('trainerVideo', {
        url: '/studios/:studioId/trainervideo',
        templateUrl: 'app/video/trainer_video.html',
        controller: 'VideoCtrl',
        authenticate: true,
        resolve: {
          studioId: function($stateParams) {
            return $stateParams.studioId
          }
        }
      })
      .state('classStarting', {
        url: '/studios/:studioId/classstarting',
        templateUrl: 'app/video/classStarting.html',
        controller: 'ClassStartingCtrl',
        authenticate: true,
        resolve: {
          studioId: function($stateParams) {
            return $stateParams.studioId
          }
        }
      });
  })