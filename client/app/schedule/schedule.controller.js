'use strict';

angular.module('bodyAppApp')
    .controller('ConsumerScheduleCtrl', function ($scope, $http, socket, $location, $firebaseObject, Auth, Schedule, $modal) {
        var currentUser = Auth.getCurrentUser();
        $scope.currentUser = currentUser;
        Schedule.setCurrentUser(currentUser)

        Schedule.setFirebaseObject("weekof9272015").$bindTo($scope, 'days')
        
        $scope.availableClasses = true;
        $scope.userClassToJoin = Schedule.classInNext30Mins;
        $scope.userHasClassNow = false;

        $scope.myBookedClasses;

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

        $scope.getFormattedDateTime = function(slot) {
            var newDate = new Date(slot.date);
            var formatted = {}

            if (newDate.getHours() == 12) {
                formatted.classTime = newDate.getHours() +":"+ ((newDate.getMinutes() < 10)?"0":"") + newDate.getMinutes() + "pm"
            } else if (newDate.getHours() == 24) {
                formatted.classTime = newDate.getHours()-12 +":"+ ((newDate.getMinutes() < 10)?"0":"") + newDate.getMinutes() + "am"
            } else {
                formatted.classTime = ((newDate.getHours() < 13)? newDate.getHours() : newDate.getHours()-12) +":"+ ((newDate.getMinutes() < 10)?"0":"") + newDate.getMinutes() + ((newDate.getHours() < 13)? "am" : "pm")
            } 
            
            formatted.day = newDate.getDate();
            
            // $scope.dayOfWeek;
            
            switch (newDate.getDay()) {
                case 0: formatted.dayOfWeek = "Sunday"; break;
                case 1: formatted.dayOfWeek = "Monday"; break;
                case 2: formatted.dayOfWeek = "Tuesday"; break;
                case 3: formatted.dayOfWeek = "Wednesday"; break;
                case 4: formatted.dayOfWeek = "Thursday"; break;
                case 5: formatted.dayOfWeek = "Friday"; break;
                case 6: formatted.dayOfWeek = "Saturday"; break;
                default: break;
            }

            if (newDate.getDay() == new Date().getDay()) {
                formatted.dayOfWeek = "Today"
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

            formatted.month = month[newDate.getMonth()]    
            console.log(formatted);       
            return formatted;
        }

        $scope.canJoinClass = function(slot) {
            if (slot.date - new Date().getTime() <= 15*60*1000 || new Date().getTime() - slot.date >= -15*60*1000) {
                return true
            } else {
                return false
            }
        }

        $scope.goToConsumerVideo = function() {
            $location.path('/consumervideo')
        }

        $scope.openBookingConfirmation = function (slot) {
            var modalInstance = $modal.open({
              animation: true,
              templateUrl: 'app/schedule/bookingConfirmation.html',
              controller: 'BookingConfirmationCtrl',
              // size: size,
              resolve: {
                slot: function () {
                  return slot;
                }
              }
            });

            modalInstance.result.then(function (selectedItem) {
              $scope.selected = selectedItem;
            }, function () {
              $log.info('Modal dismissed at: ' + new Date());
            });
        };
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

