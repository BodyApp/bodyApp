'use strict';

angular.module('bodyAppApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('userVideo', {
        url: '/uservideo',
        templateUrl: 'app/video/userVideo.html',
        controller: 'VideoCtrl',
        authenticate: true
        // resolve: {
        //   studioId: function($stateParams) {
        //     return $stateParams.studioId
        //   }
        // }
      })
      .state('trainerVideo', {
        url: '/trainervideo',
        templateUrl: 'app/video/trainerVideo.html',
        controller: 'VideoCtrl',
        authenticate: true,
      })
      
      .state('classStarting', {
        url: '/studios/:studioId/classstarting/:classId',
        templateUrl: 'app/video/class-starting.html',
        controller: 'ClassStartingCtrl',
        authenticate: true,
        resolve: {
          studioId: function($stateParams) {
            return $stateParams.studioId
          },
          classId: function($stateParams) {
            return $stateParams.classId
          },
        }
      })
      
      // .state('classStarting', {
      //   url: '/studios/:studioId/classstarting',
      //   templateUrl: 'app/video/classStarting.html',
      //   controller: 'ClassStartingCtrl',
      //   authenticate: true,
      //   resolve: {
      //     studioId: function($stateParams) {
      //       return $stateParams.studioId
      //     }
      //   }
      // });
  })