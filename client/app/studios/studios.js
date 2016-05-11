'use strict';

angular.module('bodyAppApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('studios', {
        url: '/studios/:studioId/classes',
        templateUrl: 'app/studios/classes.html',
        controller: 'ClassesCtrl',
        authenticate: true,
        resolve: {
          studioId: function($stateParams) {
            return $stateParams.studioId
          }
        }
      })
      .state('instructors', {
        url: '/studios/:studioId/instructors',
        templateUrl: 'app/studios/instructors.html',
        controller: 'InstructorsCtrl',
        authenticate: true,
        resolve: {
          studioId: function($stateParams) {
            return $stateParams.studioId
          }
        }
      })
      .state('music', {
        url: '/studios/:studioId/music',
        templateUrl: 'app/studios/music.html',
        controller: 'StudiosCtrl',
        authenticate: true,
        resolve: {
          studioId: function($stateParams) {
            return $stateParams.studioId
          }
        }
      })
      .state('workouts', {
        url: '/studios/:studioId/workouts',
        templateUrl: 'app/studios/workouts.html',
        controller: 'StudiosCtrl',
        authenticate: true,
        resolve: {
          studioId: function($stateParams) {
            return $stateParams.studioId
          }
        }
      })
      .state('pricing', {
        url: '/studios/:studioId/pricing',
        templateUrl: 'app/studios/pricing.html',
        controller: 'StudiosCtrl',
        authenticate: true,
        resolve: {
          studioId: function($stateParams) {
            return $stateParams.studioId
          }
        }
      })      
      .state('members', {
        url: '/studios/:studioId/members',
        templateUrl: 'app/studios/members.html',
        controller: 'StudiosCtrl',
        authenticate: true,
        resolve: {
          studioId: function($stateParams) {
            return $stateParams.studioId
          }
        }
      })
      .state('createstudio', {
        url: '/createstudio',
        templateUrl: 'app/studios/createStudio.html',
        controller: 'CreateStudioCtrl',
      });
  });