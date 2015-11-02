'use strict';

angular.module('bodyAppApp')
    .controller('ConsumerScheduleCtrl', function ($scope, $http, socket, $location, $firebaseObject, Auth, Schedule, $modal, $log) {
        var currentUser = Auth.getCurrentUser();
        $scope.currentUser = currentUser;
        Schedule.setCurrentUser(currentUser)

        // checkWhetherUserIsSubscribed()

        Schedule.setFirebaseObject("weekof9272015").$bindTo($scope, 'days')  
        
        $scope.availableClasses = true;
        $scope.userClassToJoin = Schedule.classInNext30Mins;
        $scope.userHasClassNow = false;
        var todayDate = new Date();
        $scope.dateToday = "" + todayDate.getMonth() + todayDate.getDate()

        var hasSelectedClassThatCanJoin = false

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

        $scope.classIsToday = function(slot) {
            var someNewDate = new Date()
            if (slot.date < (someNewDate.getTime() + 1000*60*60*12)) {
                $scope.currentStep = 1
                hasSelectedClassThatCanJoin = true
                return true
            } else {
                if (hasSelectedClassThatCanJoin === false) {
                    // console.log("and here")
                    $scope.currentStep = 0;
                }
                return false;
            }
        }

        // $scope.myBookedClasses = {}

        // for (var i in Schedule.getDaysFromFirebase()) {
        //     console.log($scope.days)
        //     for (var slotted in i) {
        //         console.log($slotted)
        //         if (slotted.bookedUsers[currentUser._id] && !slotted.past) {
        //             $scope.myBookedClasses[slotted] = $scope.days[slotted]
        //             console.log($scope.myBookedClasses)
        //         }

        //     }
        // }

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

        $scope.getFormattedDateTime = function(slot, noToday) {
            slot = slot || {}
            slot.date = slot.date || new Date()
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
            formatted.year = newDate.getFullYear();
            
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

            if (newDate.getDay() == new Date().getDay() && !noToday) {
                formatted.dayOfWeek = "Today"
            }

            var month = new Array();
            month[0] = "Jan";
            month[1] = "Feb";
            month[2] = "Mar";
            month[3] = "Apr";
            month[4] = "May";
            month[5] = "Jun";
            month[6] = "Jul";
            month[7] = "Aug";
            month[8] = "Sept";
            month[9] = "Oct";
            month[10] = "Nov";
            month[11] = "Dec";

            formatted.month = month[newDate.getMonth()]    
            // console.log(formatted);       
            return formatted;
        }

        $scope.canJoinClass = function(slot) {
            if (slot.date - new Date().getTime() <= 15*60*1000 || new Date().getTime() - slot.date >= -15*60*1000) {
                $scope.currentStep = 1;
                hasSelectedClassThatCanJoin = true;
                return true;
            } else {
                if (hasSelectedClassThatCanJoin === false) {
                    // console.log("here")
                    $scope.currentStep = 0;
                }
                return false;
            }
        }

        $scope.goToConsumerVideo = function() {
            $location.path('/consumervideo')
        }

        function checkWhetherUserIsSubscribed() {
            if (!currentUser.isSubscribed) {
                // openPaymentModal();
                var handler = StripeCheckout.configure({
                    key: 'pk_test_dSsuXJ4SmEgOlv0Sz4uHCdiT',
                    image: '../../assets/images/body-app-logo-header.png',
                    locale: 'auto',
                    token: function(token) {
                      // Use the token to create the charge with a server-side script.
                      // You can access the token ID with `token.id`
                    }
                });
                handler.open({
                  name: 'BODY SUBSCRIPTION',
                  email: currentUser.email,
                  description: '1 Month ($40.00)',
                  zipCode: true,
                  amount: 4000
                });
            } 
            return currentUser.isSubscribed
        }

        function openPaymentModal() {
            var modalInstance = $modal.open({
              animation: true,
              templateUrl: 'app/account/payment/payment.html',
              controller: 'PaymentCtrl'
              // size: size,
              // resolve: {
                // slot: function () {
                  // return slot;
                // }
              // }
            });

            // modalInstance.result.then(function (selectedItem) {
            //   $scope.selected = selectedItem;
            // }, function () {
            //   $log.info('Modal dismissed at: ' + new Date());
            // });
        }

        $scope.openBookingConfirmation = function (slot) {
            if (checkWhetherUserIsSubscribed() == true) {
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
            } else {
                slot.bookedUsers[currentUser._id] = false
            }
        };

        $scope.firstActive;
        $scope.secondActive;
        $scope.thirdActive;

        $scope.hoverTab = function(tab) {
            switch (tab) {
                case 'first': $scope.firstActive = true; $scope.secondActive = false; $scope.thirdActive = false;
                case 'second': $scope.firstActive = false; $scope.secondActive = true; $scope.thirdActive = false;
                case 'third': $scope.firstActive = false; $scope.secondActive = false; $scope.thirdActive = true;
                default: break
            }
        }

        $scope.setClassUserJustJoined = function(classJoined) {
            Schedule.setClassUserJustJoined(classJoined);
        }

        // load cookie, or start new tour
        // $scope.currentStep = ipCookie('dashboardTour') || 0;
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

