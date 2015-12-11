'use strict';

angular.module('bodyAppApp')
  .controller('NewUserCtrl', function ($scope, $http, $state, User, Auth) {
    $scope.newUserStep = 1;
    $scope.errorDiv = false

    $scope.incrementStep = function() {
    	$scope.newUserStep++;
    }

    $scope.goToDashboard = function() {
    	$state.go('schedule');

    }

    $scope.saveInjuries = function(injuryString) {
    	injuryString = injuryString || ""
    	if (injuryString.length < 2) {
    		$scope.errorDiv = true
    		console.log("Didn't enter any information!")
    	} else {
    		User.saveInjuries({id: Auth.getCurrentUser()}, {injuryString: injuryString}).$promise.then(function(confirmation) {
				  console.log("Successfully saved injury info.");
			  })
			  $scope.newUserStep++;	
    	}
    }
  });
