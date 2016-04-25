'use strict';

angular.module('bodyAppApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('classfeedback', {
        url: '/:studioId/classfeedback',
        templateUrl: 'app/results/classFeedback.html',
        controller: 'ClassFeedbackCtrl',
        resolve: {
        	studioId: function($stateParams) {
        		return $stateParams.studioId
        	}
        }
      });
  });