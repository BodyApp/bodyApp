// 'use strict';

angular.module('bodyAppApp')
    .controller('ConsumerScheduleCtrl', function ($scope, $http, $location, $firebaseObject, Auth, User, Schedule, $modal, $log, $interval, $state, tourConfig) {
        var currentUser;
        Auth.getCurrentUser().$promise.then(function(user) {
          currentUser = user

          $scope.currentUser = currentUser;
          Schedule.setCurrentUser(currentUser);
          $scope.pictureData = {};

          if (currentUser && !currentUser.tourtipShown) {
            console.log(currentUser)
            loadTour();
          }
        })

        var ref = new Firebase("https://bodyapp.firebaseio.com");
        var todayDate = new Date();

        $scope.thisWeek;
        var unbindMethod = function(){};

        var classKey = ""+todayDate.getFullYear()+""+((todayDate.getMonth()+1 < 10)?"0"+(todayDate.getMonth()+1):todayDate.getMonth()+1)+""+((todayDate.getDate() < 10)?"0"+todayDate.getDate():todayDate.getDate())
        var wodRef = ref.child('WODs').child(classKey).once('value', function(snapshot) {
          $scope.wod = snapshot.val()
        });

        $scope.checkIfFriends = function(slot) {
          var friendList = [];
          for (var user in slot.bookedFbUserIds) {
            if (currentUser.friendListObject && currentUser.friendListObject[user]) {
              friendList.push(user);
              if (!$scope.pictureData[user]) {
                var userRef = ref.child("fbUsers").child(user)
                userRef.once('value', function(snapshot) {
                  var userPulled = snapshot.val()
                  $scope.pictureData[friendList[0]] = snapshot.val()
                  if(!$scope.$$phase) $scope.$apply();
                })
              }
            }
          }
          return friendList;
        }

        $scope.setCalendarToThisWeek = function() { thisWeek() }
        function thisWeek() {
          $scope.thisWeek = true; 
          
          $scope.dateToday = "" + todayDate.getMonth() + todayDate.getDate();

          var sunDate = new Date();
          sunDate.setDate(todayDate.getDate() - todayDate.getDay());
          var sunGetDate = sunDate.getDate();
          var sunGetMonth = sunDate.getMonth()+1;
          var sunGetYear = sunDate.getFullYear();
          var weekOf = "weekof"+ (sunGetMonth<10?"0"+sunGetMonth:sunGetMonth) + (sunGetDate<10?"0"+sunGetDate:sunGetDate) + sunGetYear;

          unbindMethod()
          Schedule.setFirebaseObject(weekOf).$bindTo($scope, 'days').then(function(unbind) {
            unbindMethod = unbind
          });
        }

        $scope.setCalendarToNextWeek = function() { nextWeek() }
        function nextWeek() {
          $scope.thisWeek = false;
          var todayDate = new Date();
          var nextWeekTime = todayDate.getTime() + 1000*60*60*24*7;
          var nextWeekDate = new Date(nextWeekTime);
          $scope.dateToday = "" + nextWeekDate.getMonth() + nextWeekDate.getDate();

          var sunDate = new Date();
          sunDate.setDate(nextWeekDate.getDate() - nextWeekDate.getDay());
          var sunGetDate = sunDate.getDate();
          var sunGetMonth = sunDate.getMonth()+1;
          var sunGetYear = sunDate.getFullYear();
          var weekOf = "weekof"+ (sunGetMonth<10?"0"+sunGetMonth:sunGetMonth) + (sunGetDate<10?"0"+sunGetDate:sunGetDate) + sunGetYear;

          unbindMethod()
          Schedule.setFirebaseObject(weekOf).$bindTo($scope, 'days').then(function(unbind) {
            unbindMethod = unbind
          });
        }

        thisWeek();

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
                case 0: formatted.dayOfWeek = "Sun"; break;
                case 1: formatted.dayOfWeek = "Mon"; break;
                case 2: formatted.dayOfWeek = "Tue"; break;
                case 3: formatted.dayOfWeek = "Wed"; break;
                case 4: formatted.dayOfWeek = "Thu"; break;
                case 5: formatted.dayOfWeek = "Fri"; break;
                case 6: formatted.dayOfWeek = "Sat"; break;
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

        function checkWhetherUserIsSubscribed(slot) {
          if (currentUser.stripe && currentUser.stripe.subscription && currentUser.stripe.subscription.status === "active") {
              return true;
          } else {
            var modalInstance = $modal.open({
              animation: true,
              templateUrl: 'app/membership/membership.html',
              controller: 'MembershipCtrl',
              windowClass: "modal-wide",
            });

            modalInstance.result.then(function (selectedItem) {
              // openStripePayment()
            }, function () {
              openStripePayment()
            });

            function openStripePayment() {
              var handler = StripeCheckout.configure({
                key: 'pk_live_mpdcnmXNQpt0zTgZPjD4Tfdi',
                image: '../../assets/images/body-app-logo-header.png',
                locale: 'auto',
                token: function(token, args) {
                    var modalInstance = openPaymentConfirmedModal()
                    $http.post('/api/users/charge', {
                      user: currentUser,
                      stripeToken: token,
                      shippingAddress: args,
                    })
                    .success(function(data) {
                        console.log("Successfully posted to /user/charge");
                        Auth.updateUser(data)
                        currentUser = data
                        $scope.currentUser = currentUser
                        modalInstance.close()
                        bookClass(slot)
                    })
                    .error(function(err) {
                        console.log(err)
                        modalInstance.close();
                        if (err.message) return alert(err.message + " Please try again or contact daniel@getbodyapp.com for assistance.")
                        return alert("We had trouble processing your payment. Please try again or contact daniel@getbodyapp.com for assistance.")
                    }.bind(this));

                  // Use the token to create the charge with a server-side script.
                  // You can access the token ID with `token.id`
                }
              });
              if (currentUser.stripe && currentUser.stripe.customer && currentUser.stripe.customer.customerId) {
                //If user has already signed up previously
                  if (!currentUser.email || (currentUser.email && currentUser.email.length < 4)) {
                      handler.open({
                        name: 'BODY SUBSCRIPTION',
                        description: '$10/mo Pilot Price!',
                        panelLabel: "Pay {{amount}} / Month",
                        shippingAddress: true,
                        zipCode: true,
                        amount: 1000
                      });    
                  } else {
                      handler.open({
                        name: 'BODY SUBSCRIPTION',
                        email: currentUser.email,
                        description: '$10/mo Pilot Price!',
                        panelLabel: "Pay {{amount}} / Month",
                        shippingAddress: true,
                        zipCode: true,
                        amount: 1000
                      });
                  }
              } else {
                  if (!currentUser.email || (currentUser.email && currentUser.email.length < 4)) {
                      handler.open({
                        name: 'BODY SUBSCRIPTION',
                        description: '$10/mo Pilot Price!',
                        panelLabel: "Pay {{amount}} / Month",
                        zipCode: true,
                        shippingAddress: true,
                        amount: 1000
                      });    
                  } else {
                      handler.open({
                        name: 'BODY SUBSCRIPTION',
                        email: currentUser.email,
                        description: '$10/mo Pilot Price!',
                        panelLabel: "Pay {{amount}} / Month",
                        zipCode: true,
                        shippingAddress: true,
                        amount: 1000
                      });
                  }
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

        // function openLoginModal() {
        //     var modalInstance = $modal.open({
        //       animation: true,
        //       templateUrl: 'app/account/login/login.html',
        //       controller: 'LoginCtrl',
        //       backdrop: "static",
        //       windowClass: "loginModal",
        //       keyboard: false
        //     });

        //     modalInstance.result.then(function (selectedItem) {
        //       $scope.selected = selectedItem;
        //     }, function () {
        //         currentUser = Auth.getCurrentUser();
        //         $scope.currentUser = currentUser;
        //         Schedule.setCurrentUser(currentUser);
        //       $log.info('Modal dismissed at: ' + new Date());
        //       if (!currentUser.email || (currentUser.email && currentUser.email.length < 4)) {
        //         openEmailEntryModal();
        //       }
        //     });

        //     return modalInstance;
        // }

        // function openEmailEntryModal() {
        //     var modalInstance = $modal.open({
        //       animation: true,
        //       templateUrl: 'app/account/login/enterEmail.html',
        //       controller: 'LoginCtrl'
        //       // backdrop: "static",
        //       // windowClass: "loginModal",
        //       // keyboard: false
        //     });

        //     modalInstance.result.then(function (userObj) {
        //         // User.saveEmailAddress({ id: currentUser._id }, {
        //         //   email: userObj.email
        //         // }, function(user) {
        //         //   currentUser = user;
        //         //   $scope.currentUser = currentUser;
        //         //   modalInstance.close()
        //         // }, function(err) {
        //         //     console.log("Error saving email: " + err)
        //         //     slot.bookedUsers[currentUser._id] = false
        //         //     alert("sorry, there was an issue saving your email.  Some features may not function properly.  Contact the BODY help team at (216) 408-2902 to get this squared away.")    
        //         // }).$promise;
        //     }, function () {
        //       $log.info('Modal dismissed at: ' + new Date());
        //     });

        //     return modalInstance;
        // }

        // function openPaymentModal() {
        //     var modalInstance = $modal.open({
        //       animation: true,
        //       templateUrl: 'app/membership/membership.html',
        //       controller: 'MembershipCtrl'
        //       size: size,
        //       resolve: {
        //         slot: function () {
        //           return slot;
        //         }
        //       }
        //     });

        //     modalInstance.result.then(function (selectedItem) {
        //       $scope.selected = selectedItem;
        //     }, function () {
        //       $log.info('Modal dismissed at: ' + new Date());
        //     });
        // }

        $scope.cancelClass = function(slot) {
          console.log(slot)
          if (slot.level === "Intro") {
            User.cancelIntroClass({ id: currentUser._id }, {}, function(user) {
                  slot.bookedUsers = slot.bookedUsers || {};
                  slot.bookedFbUserIds = slot.bookedFbUserIds || {};
                  slot.bookedUsers[currentUser._id] = false
                  slot.spotsTaken
                  delete slot.bookedFbUserIds[currentUser.facebook.id]
                  // slot.$save();
                  currentUser = user;
                  Auth.updateUser(currentUser);
                  $scope.currentUser = currentUser;
                }, function(err) {
                    console.log("Error cancelling class: " + err)
                }).$promise;
          } else {
            slot.bookedUsers = slot.bookedUsers || {};
            slot.bookedFbUserIds = slot.bookedFbUserIds || {};
            slot.bookedUsers[currentUser._id] = false;
            delete slot.bookedFbUserIds[currentUser.facebook.id];
          }
        }

        $scope.openBookingConfirmation = function (slot) {
          if (slot.level === "Intro") {
            // if (currentUser.introClassTaken) {
            //   return alert("You have already completed your intro class. There's no reason to take another!  You should book Level " + currentUser.level + " classes now.");
            // } else if (currentUser.bookedIntroClass) {
            //   return alert("You should only take 1 Intro class! You have to cancel your existing intro class before you can book another.")
            // } else {
              return User.addIntroClass({ id: $scope.currentUser._id }, {}, function(user) {
                Auth.updateUser(user);
                currentUser = user;
                $scope.currentUser = user;
                slot.bookedUsers = slot.bookedUsers || {};
                slot.bookedFbUserIds = slot.bookedFbUserIds || {};
                slot.bookedUsers[currentUser._id] = true;
                slot.bookedFbUserIds[currentUser.facebook.id] = true;
              }, function(err) {
                  console.log("Error adding class: " + err)
                  classToBook.bookedUsers[currentUser._id] = false
                  classToBook.$save()
                  alert("sorry, there was an issue booking your class.  Please try reloading the site and booking again.  If that doesn't work, contact the BODY help team at (216) 408-2902 to get this squared away.")    
              }).$promise;
            // }
          }
        };

        function bookClass(slot) {
          var modalInstance = $modal.open({
            animation: true,
            templateUrl: 'app/schedule/bookingConfirmation.html',
            controller: 'BookingConfirmationCtrl',
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
            slot.bookedUsers = slot.bookedUsers || {};
            slot.bookedFbUserIds = slot.bookedFbUserIds || {};
            slot.bookedUsers[currentUser._id] = true
            slot.bookedFbUserIds[currentUser.facebook.id] = true
            // slot.$save();
            currentUser = user;
            $scope.currentUser = currentUser;
          }, function(err) {
              console.log("Error adding class: " + err)
              slot.bookedUsers = slot.bookedUsers || {};
              slot.bookedUsers[currentUser._id] = false
              delete slot.bookedFbUserIds[currentUser.facebook.id]
              alert("sorry, there was an issue booking your class.  Please try reloading the site and booking again.  If that doesn't work, contact the BODY help team at (216) 408-2902 to get this squared away.")    
          }).$promise;
        }

        //This was relevant when we had multiple tabs - one for each level
        // $scope.firstActive;
        // $scope.secondActive;
        // $scope.thirdActive;

        // $scope.hoverTab = function(tab) {
        //     switch (tab) {
        //         case 'first': $scope.firstActive = true; $scope.secondActive = false; $scope.thirdActive = false;
        //         case 'second': $scope.firstActive = false; $scope.secondActive = true; $scope.thirdActive = false;
        //         case 'third': $scope.firstActive = false; $scope.secondActive = false; $scope.thirdActive = true;
        //         default: break
        //     }
        // }

        $scope.formattedWaitTime = function(slot, timeNow) {
            var returnValue = Math.round((slot - timeNow)/(1000*60))
            return (returnValue < 120 ? returnValue + " Mins": Math.round(returnValue / 60) + " Hours")
        } 

        $scope.setClassUserJustJoined = function(classJoined) {
            Schedule.setClassUserJustJoined(classJoined);
        }

        // load cookie, or start new tour
        // $scope.currentStep = ipCookie('dashboardTour') || 0;

        $scope.checkIfSelectedRightClass = function() {
            $scope.currentStep = 0
        }

        $scope.getNumberOfBookedUsers = function(slot) {
            return slot.bookedUsers ? Object.keys(slot.bookedUsers).length : 0
        }

        function loadTour() {
          $scope.currentStep = 0;
          tourConfig.backDrop = true;
        }

        $scope.tourtipShown = function() {
          //Save tourtipshown to user model
          User.tourtipShown({ id: currentUser._id }, {
            date: new Date().getTime()
          }, function(user) {
            console.log("tour tip shown")
            Auth.updateUser(user);
          })
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

    // *****************SCROLLING MAGIC*****************
      //Scroll Down
      $(".arrow-scroll").click(function() {
          $('html,body').animate({
              scrollTop: $(".scroll-to").offset().top + -100},
              600);
      });
   
      //Scroll Up
      $scope.scrollToTop = function() {
        $('html,body').animate({
          scrollTop: $(".top-scroll").offset().top},
        600);
      }     

      //Stick top of calendar to top of screen
      $(window).scroll(function(e){ 
        var $el = $('.fixedAtTop'); 
        var isPositionFixed = ($el.css('position') == 'fixed');
        if ($(this).scrollTop() > ($('#tour-workout').height() + $('#tour-classes').height()*2) && !isPositionFixed){ 
          $('.fixedAtTop').css({'position': 'fixed', 'top': '70px', 'width':'14.28%'}); 
        }
        if ($(this).scrollTop() < ($('#tour-workout').height() + $('#tour-classes').height()*2)  && isPositionFixed)
        {
          $('.fixedAtTop').css({'position': 'static', 'top': '70px', 'width':'100%'}); 
        } 
      });
    })

    //Currently unused
    // .filter('showAvailable', function() {
    //   return function(input, showAvailable) {
    //     console.log(input)
    //     console.log(showAvailable)
    //     if (showAvailable) {
    //         for (var slot in input) {
    //             if (input[slot].past) {
    //                 input[slot].hidden = true;
    //             }
    //         }
    //     }
    //     return input
    //   };
    // })

