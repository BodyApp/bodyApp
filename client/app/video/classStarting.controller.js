'use strict';

angular.module('bodyAppApp')
  .controller('ClassStartingCtrl', function ($scope, $location, Schedule) {
  	var classToJoin = Schedule.classUserJustJoined;
  	$scope.minutesUntilClass = Math.round(((classToJoin.date - new Date().getTime())/1000)/60, 0)
  	$scope.trainer = "Mendelson"

  	window.setInterval(checkTime, 1000*30)

  	function checkTime() {
  		$scope.minutesUntilClass = Math.round(((classToJoin.date - new Date().getTime())/1000)/60, 0)
  		if ($scope.minutesUntilClass <= 0) {
  			$location.path('/consumervideo')
  		}
  	}

  })