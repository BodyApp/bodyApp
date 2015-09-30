'use strict';

angular.module('bodyAppApp')
    .controller('ConsumerScheduleCtrl', function ($scope, $http, socket, $location, $firebaseObject, Auth, Schedule) {
        var currentUser = Auth.getCurrentUser();
        var currentUserEmail = currentUser.email
        console.log(currentUser)
        $scope.currentUser = currentUser;
        
        Schedule("weekof9272015").$bindTo($scope, 'days')

        $scope.availableClasses = true

    })

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

