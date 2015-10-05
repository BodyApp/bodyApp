'use strict';

angular.module('bodyAppApp')
    .controller('BookingConfirmationCtrl', function ($scope, Auth, Schedule, slot, $modalInstance) {
        var currentUser = Auth.getCurrentUser();
        $scope.currentUser = currentUser;
        
        $scope.classTime = slot.time
        var date = new Date(slot.date)
        $scope.day = date.getDate()
        
        // $scope.dayOfWeek;
        
        switch (date.getDay()) {
            case 0: $scope.dayOfWeek = "Sunday"; break;
            case 1: $scope.dayOfWeek = "Monday"; break;
            case 2: $scope.dayOfWeek = "Tuesday"; break;
            case 3: $scope.dayOfWeek = "Wednesday"; break;
            case 4: $scope.dayOfWeek = "Thursday"; break;
            case 5: $scope.dayOfWeek = "Friday"; break;
            case 6: $scope.dayOfWeek = "Saturday"; break;
            default: break;
        }

        var month = new Array();
        month[1] = "Jan";
        month[2] = "Feb";
        month[3] = "Mar";
        month[4] = "Apr";
        month[5] = "May";
        month[6] = "Jun";
        month[7] = "Jul";
        month[8] = "Aug";
        month[9] = "Sept";
        month[10] = "Oct";
        month[11] = "Nov";
        month[12] = "Dec";

        $scope.month = month[date.getMonth()]
    })