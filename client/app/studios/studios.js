'use strict';

angular.module('bodyAppApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('classes', {
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
      .state('storefrontInfo', {
        url: '/studios/:studioId/storefrontinfo',
        templateUrl: 'app/studios/storefrontInfo.html',
        controller: 'StorefrontInfoCtrl',
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
        controller: 'MusicCtrl',
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
        controller: 'WorkoutsCtrl',
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
        controller: 'PricingCtrl',
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
        controller: 'MembersCtrl',
        authenticate: true,
        resolve: {
          studioId: function($stateParams) {
            return $stateParams.studioId
          }
        }
      })
      // .state('createstudio', {
      //   url: '/createstudio',
      //   templateUrl: 'app/studios/createStudio.html',
      //   controller: 'CreateStudioCtrl',
      // })
      
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
        templateUrl: 'app/studios/editSchedule.html',
        controller: 'EditScheduleCtrl',
        authenticate: true,
        resolve: {
          studioId: function($stateParams) {
            return $stateParams.studioId
          }
        }
      })
      .state('classDetails', {
        url: '/studios/:studioId/classdetails/:classId',
        templateUrl: 'app/studios/classDetails.html',
        controller: 'ClassDetailsCtrl',
        authenticate: true,
        resolve: {
          studioId: function($stateParams) {
            return $stateParams.studioId
          },
          classId: function($stateParams) {
            return $stateParams.classId
          }
        }
      })
      .state('storefront', {
        url: '/studios/:studioId',
        templateUrl: 'app/studios/storefront.html',
        controller: 'StorefrontCtrl',
        // authenticate: true,
        resolve: {
          studioId: function($stateParams) {
            // ngMeta.setTag('ogUrl': "https://www.getbodyapp.com/studios/" + $stateParams.studioId);
            return $stateParams.studioId;
          }
        }
      })
      .state('classinfo', {
        url: '/studios/:studioId/classinfo/:classId',
        templateUrl: 'app/studios/classInfo.html',
        controller: 'ClassInfoCtrl',
        resolve: {
          studioId: function($stateParams) {
            return $stateParams.studioId
          },
          classId: function($stateParams) {
            return $stateParams.classId
          },
        }
      })
      .state('dashboard', {
        url: '/user/dashboard',
        templateUrl: 'app/studios/user/dashboard.html',
        controller: 'StudiosCtrl',
        authenticate: true
      })
      .state('user-schedule', {
        url: '/user/schedule',
        templateUrl: 'app/studios/user/user-schedule.html',
        controller: 'UserScheduleCtrl',
        authenticate: true
      })
      .state('friends', {
        url: '/user/friends',
        templateUrl: 'app/studios/user/friends.html',
        controller: 'StudiosCtrl',
        authenticate: true
      })
      .state('user-workouts', {
        url: '/user/user-workouts',
        templateUrl: 'app/studios/user/user-workouts.html',
        controller: 'StudiosCtrl',
        authenticate: true
      })
      .state('test-class', {
        url: '/user/test-class',
        templateUrl: 'app/studios/user/test-class.html',
        controller: 'StudiosCtrl',
        authenticate: true
      })
      .state('billing', {
        url: '/user/billing',
        templateUrl: 'app/studios/user/billing.html',
        controller: 'StudiosCtrl',
        authenticate: true
      })
      .state('receipts', {
        url: '/user/receipts',
        templateUrl: 'app/studios/user/receipts.html',
        controller: 'StudiosCtrl',
        authenticate: true
      });
  });