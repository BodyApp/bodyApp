'use strict';

angular.module('bodyAppApp')
  .controller('NewUserCtrl', function ($scope, $http, $state, User, Auth) {
    $scope.newUserStep = 1;

    $scope.incrementStep = function() {
    	$scope.newUserStep++;
    }

    $scope.goToDashboard = function() {
    	$state.go('schedule');

    }

    $scope.saveInjuries = function(injuryString) {
    	User.saveInjuries({id: Auth.getCurrentUser()}, {injuryString: injuryString}).$promise.then(function(confirmation) {
			  console.log("Successfully saved injury info.");
		  })
		  $scope.newUserStep++;
    }
  });
