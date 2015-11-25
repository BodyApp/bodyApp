'use strict';

angular.module('bodyAppApp')
    .controller('ConsumerScheduleCtrl', function ($scope, $http, $location, $firebaseObject, Auth, User, Schedule, $modal, $log, $interval) {
        var currentUser = Auth.getCurrentUser();
        $scope.currentUser = currentUser;
        Schedule.setCurrentUser(currentUser);
        var loggedIn = false

        Auth.isLoggedInAsync(function(boolAnswer) {
            loggedIn = boolAnswer;
            if (!loggedIn) {
              // event.preventDefault();
                var loginModal = openLoginModal()
            }
        });

        var ref = new Firebase("https://bodyapp.firebaseio.com");
        $scope.wod = $firebaseObject(ref.child('WOD'));

        var todayDate = new Date();
        $scope.dateToday = "" + todayDate.getMonth() + todayDate.getDate();

        var sunDate = new Date();
        sunDate.setDate(todayDate.getDate() - todayDate.getDay());
        var sunGetDate = sunDate.getDate();
        var sunGetMonth = sunDate.getMonth()+1;
        var sunGetYear = sunDate.getFullYear();
        var weekOf = "weekof"+ (sunGetMonth<10?"0"+sunGetMonth:sunGetMonth) + (sunGetDate<10?"0"+sunGetDate:sunGetDate) + sunGetYear;

        Schedule.setFirebaseObject(weekOf).$bindTo($scope, 'days');
        
        $scope.availableClasses = true;
        $scope.timeNow = new Date().getTime();
        $interval(function() {
            $scope.timeNow = new Date().getTime();
        }, 1000*30)
        // $scope.classOverTime = $scope.timeNow - 1000*60*45;

        $scope.getFormattedDateTime = function(slot, noToday) {
            slot = slot || {};
            slot.date = slot.date || new Date();
            var newDate = new Date(slot.date);
            var formatted = {}

            if (newDate.getHours() == 12) {
                formatted.classTime = newDate.getHours() +":"+ ((newDate.getMinutes() < 10)?"0":"") + newDate.getMinutes() + "pm"
            } else if (newDate.getHours() == 0) {
                formatted.classTime = 12 +":"+ ((newDate.getMinutes() < 10)?"0":"") + newDate.getMinutes() + "am"
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

        function checkWhetherUserIsSubscribed() {
            // currentUser = Auth.getUpdatedUser();
            // $scope.currentUser = currentUser;
            // console.log(currentUser)
            if (currentUser.stripe && currentUser.stripe.subscription && currentUser.stripe.subscription.status === "active") {
                return true;
            // } else if (currentUser.strip.subscription.status === "canceled") {
            //     var modalInstance = openRenewSubscriptionModal()
            //     $http.post('/api/users/charge', {
            //       user: currentUser,
            //       stripeToken: token
            //     })
            //     .success(function(data) {
            //         console.log("Successfully posted to /user/charge");
            //         Auth.updateUser(data)
            //         currentUser = data
            //         $scope.currentUser = currentUser
            //         modalInstance.close()
            //     })
            //     .error(function(err) {
            //         console.log("Error posting to /user/charge: " + err)
            //     }.bind(this));
            } else {
                // openPaymentModal();
                var handler = StripeCheckout.configure({
                    key: 'pk_test_dSsuXJ4SmEgOlv0Sz4uHCdiT',
                    image: '../../assets/images/body-app-logo-header.png',
                    locale: 'auto',
                    token: function(token) {
                        var modalInstance = openPaymentConfirmedModal()
                        $http.post('/api/users/charge', {
                          user: currentUser,
                          stripeToken: token
                        })
                        .success(function(data) {
                            console.log("Successfully posted to /user/charge");
                            Auth.updateUser(data)
                            currentUser = data
                            $scope.currentUser = currentUser
                            modalInstance.close()
                        })
                        .error(function(err) {
                            console.log("Error posting to /user/charge: " + err)
                        }.bind(this));

                      // Use the token to create the charge with a server-side script.
                      // You can access the token ID with `token.id`
                    }
                });
                if (currentUser.stripe && currentUser.stripe.customer && currentUser.stripe.customer.customerId) {
                    if (!currentUser.email || (currentUser.email && currentUser.email.length < 4)) {
                        handler.open({
                          name: 'BODY SUBSCRIPTION',
                          description: '$40/mo Subscription',
                          zipCode: true,
                          amount: 4000
                        });    
                    } else {
                        handler.open({
                          name: 'BODY SUBSCRIPTION',
                          email: currentUser.email,
                          description: '$40/mo Subscription',
                          zipCode: true,
                          amount: 4000
                        });
                    }
                } else {
                    if (!currentUser.email || (currentUser.email && currentUser.email.length < 4)) {
                        handler.open({
                          name: 'BODY SUBSCRIPTION',
                          description: 'First Month free! $40/mo after that',
                          zipCode: true,
                          amount: 4000
                        });    
                    } else {
                        handler.open({
                          name: 'BODY SUBSCRIPTION',
                          email: currentUser.email,
                          description: 'First Month free! $40/mo after that',
                          zipCode: true,
                          amount: 4000
                        });
                    }
                }
            } 
        }

        function openPaymentConfirmedModal() {
            var modalInstance = $modal.open({
              animation: true,
              templateUrl: 'app/account/payment/paymentThanks.html',
              controller: 'PaymentCtrl',
              backdrop: "static",
              keyboard: false
              // size: size,
              // resolve: {
              //   currentUser: function () {
              //     return currentUser;
              //   }
              // }
            });

            modalInstance.result.then(function (selectedItem) {
              $scope.selected = selectedItem;
            }, function () {
              $log.info('Modal dismissed at: ' + new Date());
            });

            return modalInstance;
        }

        function openLoginModal() {
            var modalInstance = $modal.open({
              animation: true,
              templateUrl: 'app/account/login/login.html',
              controller: 'LoginCtrl',
              backdrop: "static",
              windowClass: "loginModal",
              keyboard: false
            });

            modalInstance.result.then(function (selectedItem) {
              $scope.selected = selectedItem;
            }, function () {
                currentUser = Auth.getCurrentUser();
                $scope.currentUser = currentUser;
                Schedule.setCurrentUser(currentUser);
              $log.info('Modal dismissed at: ' + new Date());
              if (!currentUser.email || (currentUser.email && currentUser.email.length < 4)) {
                openEmailEntryModal();
              }
            });

            return modalInstance;
        }

        function openEmailEntryModal() {
            var modalInstance = $modal.open({
              animation: true,
              templateUrl: 'app/account/login/enterEmail.html',
              controller: 'LoginCtrl'
              // backdrop: "static",
              // windowClass: "loginModal",
              // keyboard: false
            });

            modalInstance.result.then(function (userObj) {
                // User.saveEmailAddress({ id: currentUser._id }, {
                //   email: userObj.email
                // }, function(user) {
                //   currentUser = user;
                //   $scope.currentUser = currentUser;
                //   modalInstance.close()
                // }, function(err) {
                //     console.log("Error saving email: " + err)
                //     slot.bookedUsers[currentUser._id] = false
                //     alert("sorry, there was an issue saving your email.  Some features may not function properly.  Contact the BODY help team at (216) 408-2902 to get this squared away.")    
                // }).$promise;
            }, function () {
              $log.info('Modal dismissed at: ' + new Date());
            });

            return modalInstance;
        }

        // function openPaymentModal() {
        //     var modalInstance = $modal.open({
        //       animation: true,
        //       templateUrl: 'app/account/payment/payment.html',
        //       controller: 'PaymentCtrl'
              // size: size,
              // resolve: {
                // slot: function () {
                  // return slot;
                // }
              // }
            // });

            // modalInstance.result.then(function (selectedItem) {
            //   $scope.selected = selectedItem;
            // }, function () {
            //   $log.info('Modal dismissed at: ' + new Date());
            // });
        // }

        $scope.openBookingConfirmation = function (slot) {
            if (!loggedIn) {
                slot.bookedUsers[currentUser._id] = false
                return openLoginModal()
            } else if (checkWhetherUserIsSubscribed() === true) {
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

                User.addBookedClass({ id: currentUser._id }, {
                  classToAdd: slot.date
                }, function(user) {
                  currentUser = user;
                  $scope.currentUser = currentUser;
                }, function(err) {
                    console.log("Error adding class: " + err)
                    slot.bookedUsers[currentUser._id] = false
                    alert("sorry, there was an issue booking your class.  Please try reloading the site and booking again.  If that doesn't work, contact the BODY help team at (216) 408-2902 to get this squared away.")    
                }).$promise;

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

        $scope.formattedWaitTime = function(slot, timeNow) {
            var returnValue = Math.round((slot - timeNow)/(1000*60))
            return (returnValue < 120 ? returnValue + " Mins": Math.round(returnValue / 60) + " Hours")
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

        $scope.getNumberOfBookedUsers = function(slot) {
            return slot.bookedUsers ? Object.keys(slot.bookedUsers).length : 0
        }

        // // save cookie after each step
        // $scope.stepComplete = function() {
        //   // ipCookie('dashboardTour', $scope.currentStep, { expires: 3000 });
        //   $scope.currentStep = 0
        // };
        
        // // callback for when we've finished going through the tour
        // $scope.postTourCallback = function() {
        //   $scope.currentStep = 0
        //   console.log('tour over');
        // };
        // // optional way of saving tour progress with cookies
        // $scope.postStepCallback = function() {
        //     $scope.currentStep = 0
        //   // ipCookie('dashboardTour', $scope.currentStep, { expires: 3000 });
        // };


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

