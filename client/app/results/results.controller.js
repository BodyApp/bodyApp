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
  });
