'use strict';

angular.module('bodyAppApp')
  .controller('ClassStartingCtrl', function ($scope, $location, Schedule) {
  	var classToJoin = Schedule.classUserJustJoined;
    if (!classToJoin) {
      $location.path('/')
    }
    
  	$scope.minutesUntilClass = Math.round(((classToJoin.date - new Date().getTime())/1000)/60, 0);
  	// $scope.trainer = "Mendelson";
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

    // load cookie, or start new tour
    // $scope.currentStep = 0;

    // save cookie after each step
    $scope.stepComplete = function() {
      // ipCookie('dashboardTour', $scope.currentStep, { expires: 3000 });
      $scope.currentStep = 0
    };
    
    // callback for when we've finished going through the tour
    $scope.postTourCallback = function() {
      $scope.currentStep = 0
      console.log('tour over');
    };
    // optional way of saving tour progress with cookies
    $scope.postStepCallback = function() {
        $scope.currentStep = 0
      // ipCookie('dashboardTour', $scope.currentStep, { expires: 3000 });
    };
  })