'use strict';

angular.module('bodyAppApp')
    .controller('ConsumerScheduleCtrl', function ($scope, $http, socket, $location, $firebaseObject, Auth, Schedule) {
        var currentUser = Auth.getCurrentUser();
        $scope.currentUser = currentUser;
        Schedule.setCurrentUser(currentUser)

        Schedule.setFirebaseObject("weekof9272015").$bindTo($scope, 'days')
        
        $scope.availableClasses = true;
        $scope.userClassToJoin = Schedule.classInNext30Mins;
        $scope.userHasClassNow = false;

        //Prompts user to join class when within 15 minutes of class
        $scope.$watch(function () { return Schedule.classInNext30Mins; },
            function (value) {
                if (value != null) {
                    $scope.userClassToJoin = Schedule.returnClassInNext30Mins();
                    $scope.userHasClassNow = true
                } else {
                    $scope.userClassToJoin = null
                    $scope.userHasClassNow = false 
                }
                
            }
        );

        $scope.goToConsumerVideo = function() {
            $location.path('/consumervideo')
        }
    })

    //Currently unused
    .filter('showAvailable', function() {
      return function(input, showAvailable) {
        console.log(input)
        console.log(showAvailable)
        if (showAvailable) {
            for (var slot in input) {
                if (input[slot].past) {
                    input[slot].hidden = true;
                }
            }
        }
        return input
      };
    })

