'use strict';

angular.module('bodyAppApp')
  .controller('ClassStartingCtrl', function ($scope, $location, Schedule) {
  	var classToJoin = Schedule.classUserJustJoined;
  	$scope.minutesUntilClass = Math.round(((classToJoin.date - new Date().getTime())/1000)/60, 0);
  	$scope.trainer = "Mendelson";
  	// $scope.joinClassActive = false;

  	window.setInterval(function(){ checkTime() }, 20*1000)

  	function checkTime() {
  		$scope.minutesUntilClass = Math.round(((classToJoin.date - new Date().getTime())/1000)/60, 0);
  		console.log($scope.minutesUntilClass + " minutes until class begins");
  		$scope.$apply();
  		// if ($scope.minutesUntilClass <= 0) {
  			// $scope.joinClassActive = true;
  			// $location.path('/consumervideo')
  		// }
  	}
  })