'use strict';

angular.module('bodyAppApp')
  .controller('ResultsCtrl', function ($scope, $http, socket) {
    var todayDate = new Date()
    $scope.todayDate = todayDate.getDate()

    $scope.dayOfWeekToday;

    switch (todayDate.getDay()) {
            case 0: $scope.dayOfWeekToday = "Sunday"; break;
            case 1: $scope.dayOfWeekToday = "Monday"; break;
            case 2: $scope.dayOfWeekToday = "Tuesday"; break;
            case 3: $scope.dayOfWeekToday = "Wednesday"; break;
            case 4: $scope.dayOfWeekToday = "Thursday"; break;
            case 5: $scope.dayOfWeekToday = "Friday"; break;
            case 6: $scope.dayOfWeekToday = "Saturday"; break;
            default: break;
        }

         // load cookie, or start new tour
    $scope.currentStep = 0;

    $scope.checkIfSelectedRightClass = function() {
        $scope.currentStep = 0
    }

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
  });
