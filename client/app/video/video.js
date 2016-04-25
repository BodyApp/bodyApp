'use strict';

angular.module('bodyAppApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('consumerVideo', {
        url: '/:studioId/consumervideo',
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
        url: '/:studioId/trainervideo',
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
        url: '/:studioId/classstarting',
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