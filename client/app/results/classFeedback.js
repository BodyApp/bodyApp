'use strict';

angular.module('bodyAppApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('classfeedback', {
        url: '/classfeedback',
        templateUrl: 'app/results/classFeedback.html',
        controller: 'ClassFeedbackCtrl'
      });
  });