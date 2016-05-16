'use strict';

angular.module('bodyAppApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('studios', {
        url: '/studios/:studioId/classes',
        templateUrl: 'app/studios/classes.html',
        controller: 'StudiosCtrl',
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
        controller: 'StudiosCtrl',
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
      .state('editprofile', {
        url: '/studios/:studioId/editprofile',
        templateUrl: 'app/studios/editprofile.html',
        controller: 'StudiosCtrl',
        authenticate: true,
        resolve: {
          studioId: function($stateParams) {
            return $stateParams.studioId
          }
        }
      })
      .state('notifications', {
        url: '/studios/:studioId/notifications',
        templateUrl: 'app/studios/notifications.html',
        controller: 'StudiosCtrl',
        authenticate: true,
        resolve: {
          studioId: function($stateParams) {
            return $stateParams.studioId
          }
        }
      })
      .state('editschedule', {
        url: '/studios/:studioId/editschedule',
        templateUrl: 'app/studios/editschedule.html',
        controller: 'StudiosCtrl',
        authenticate: true,
        resolve: {
          studioId: function($stateParams) {
            return $stateParams.studioId
          }
        }
      })
      .state('classDetails', {
        url: '/studios/:studioId/classDetails',
        templateUrl: 'app/studios/classDetails.html',
        controller: 'StudiosCtrl',
        authenticate: true,
        resolve: {
          studioId: function($stateParams) {
            return $stateParams.studioId
          }
        }
      })
      .state('ralabala', {
        url: '/studios/:studioId/ralabala',
        templateUrl: 'app/studios/ralabala.html',
        controller: 'StudiosCtrl',
        authenticate: true,
        resolve: {
          studioId: function($stateParams) {
            return $stateParams.studioId
          }
        }
      })
      .state('dashboard', {
        url: '/studios/:studioId/user/dashboard',
        templateUrl: 'app/studios/user/dashboard.html',
        controller: 'StudiosCtrl',
        authenticate: true,
        resolve: {
          studioId: function($stateParams) {
            return $stateParams.studioId
          }
        }
      })
      .state('user-schedule', {
        url: '/studios/:studioId/user/user-schedule',
        templateUrl: 'app/studios/user/user-schedule.html',
        controller: 'StudiosCtrl',
        authenticate: true,
        resolve: {
          studioId: function($stateParams) {
            return $stateParams.studioId
          }
        }
      })
      .state('friends', {
        url: '/studios/:studioId/user/friends',
        templateUrl: 'app/studios/user/friends.html',
        controller: 'StudiosCtrl',
        authenticate: true,
        resolve: {
          studioId: function($stateParams) {
            return $stateParams.studioId
          }
        }
      })
      .state('user-workouts', {
        url: '/studios/:studioId/user/user-workouts',
        templateUrl: 'app/studios/user/user-workouts.html',
        controller: 'StudiosCtrl',
        authenticate: true,
        resolve: {
          studioId: function($stateParams) {
            return $stateParams.studioId
          }
        }
      })
      .state('test-class', {
        url: '/studios/:studioId/user/test-class',
        templateUrl: 'app/studios/user/test-class.html',
        controller: 'StudiosCtrl',
        authenticate: true,
        resolve: {
          studioId: function($stateParams) {
            return $stateParams.studioId
          }
        }
      })
      .state('billing', {
        url: '/studios/:studioId/user/billing',
        templateUrl: 'app/studios/user/billing.html',
        controller: 'StudiosCtrl',
        authenticate: true,
        resolve: {
          studioId: function($stateParams) {
            return $stateParams.studioId
          }
        }
      })
      .state('receipts', {
        url: '/studios/:studioId/user/receipts',
        templateUrl: 'app/studios/user/receipts.html',
        controller: 'StudiosCtrl',
        authenticate: true,
        resolve: {
          studioId: function($stateParams) {
            return $stateParams.studioId
          }
        }
      });
  });