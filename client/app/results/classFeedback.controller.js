'use strict';

angular.module('bodyAppApp')
  .controller('ClassFeedbackCtrl', function ($scope, Schedule) {
  	$scope.classCompleted = Schedule.classUserJustJoined;
  	console.log($scope.classCompleted)
  });