// 'use strict';

angular.module('bodyAppApp')
    .controller('ConsumerScheduleCtrl', function ($scope, $http, $location, $firebaseObject, Auth, User, Schedule, Video, $uibModal, $uibTooltip, $log, $interval, $state, tourConfig, $window) {
        var currentUser = Auth.getCurrentUser();
        var ref = new Firebase("https://bodyapp.firebaseio.com");
        var todayDate = new Date();
        $scope.todayDayOfWeek = todayDate.getDay();
        $scope.windowWidth = (window.innerWidth > 0) ? window.innerWidth : screen.width;
        // $scope.myBookedClasses = {};

        var tzName = jstz().timezone_name;
        $scope.thisWeek;
        $scope.chosenDay;
        $scope.timeNow = new Date().getTime();

        console.warn = function(str){}

        setTimezone()
        function setTimezone() {          
          $scope.timezone = moment().tz(tzName).format('z');
        }

        var unbindMethod = function(){};

        var classKey = ""+todayDate.getFullYear()+""+((todayDate.getMonth()+1 < 10)?"0"+(todayDate.getMonth()+1):todayDate.getMonth()+1)+""+((todayDate.getDate() < 10)?"0"+todayDate.getDate():todayDate.getDate())
        var wodRef = ref.child('WODs').child(classKey).once('value', function(snapshot) {
          $scope.wod = snapshot.val()
        });

        if (Auth.getCurrentUser() && Auth.getCurrentUser().$promise) {
          Auth.getCurrentUser().$promise.then(function(user) {
            currentUser = user

            $scope.currentUser = currentUser;
            Schedule.setCurrentUser(currentUser);
            $scope.pictureData = {};

            //Firebase authentication check
            var ref = new Firebase("https://bodyapp.firebaseio.com/");
            ref.onAuth(function(authData) {
              if (authData) {
                getBookings()
                console.log("User is authenticated with fb ");
              } else {
                console.log("User is logged out");
                if (currentUser.firebaseToken) {
                  ref.authWithCustomToken(currentUser.firebaseToken, function(error, authData) {
                    if (error) {
                      Auth.logout();
                      $window.location.reload()
                      console.log("Firebase user authentication failed", error);
                    } else {
                      if (user.role === "admin") console.log("Firebase user authentication succeeded!", authData);
                      // $window.location.reload()
                      getBookings()
                      thisWeek();
                      setNextWeek();
                    }
                  }); 
                } else {
                  Auth.logout();
                  $window.location.reload()
                }
              }
            })
            // ref.authWithCustomToken(currentUser.firebaseToken, function(error, authData) {
            //   if (error) {
            //     console.log("Firebase user authentication failed", error);
            //   } else {
            //     console.log("Firebase user authentication succeeded!", authData);
            //   }
            // // }, { remember: "sessionOnly" }); //Session expires upon browser shutdown
            // }); 

            // $rootScope.htmlReady() //For PhantomJS

            // $scope.myBookedClasses = currentUser.classesBooked;
            // for (prop in currentUser.classesBooked) {
            //   console.log(prop);
            //   getInfo(prop)
            // }

            //Intercom integration
            window.intercomSettings = {
              app_id: "daof2xrs",
              name: user.firstName + " " + user.lastName, // Full name
              email: user.email, // Email address
              user_id: user._id,
              "bookedIntro": user.bookedIntroClass,
              "introTaken": user.introClassTaken,
              "numFriendsOnPlatform": user.friendList ? user.friendList.length : 0,
              "newUserFlowComplete": user.completedNewUserFlow,
              "isPayingMember" : user.stripe ? user.stripe.subscription.status === "active" : false,
              "introClassBooked_at": Math.floor(new Date(user.introClassBooked*1) / 1000)
            };

            if (currentUser && !currentUser.tourtipShown) {
              loadTour();
            }

            if (currentUser.timezone != tzName) {
              User.saveTimezone({ id: currentUser._id }, {timezone: tzName}, function(user) {
                console.log("Updated user timezone preference")
                currentUser = user;
                Auth.updateUser(currentUser);
                $scope.currentUser = currentUser;
              }, function(err) {
                  console.log("Error saving Timezone: " + err)
              }).$promise;
            }
          })
        }

        if (Video.devices) Video.destroyHardwareSetup() //User may navigate back to schedule from classStarting without actually joining class.

        function getInfo(prop) {
          // var newDate = new Date(prop * 1)
          // var sunDate = new Date();
          // sunDate.setDate(newDate.getDate() - newDate.getDay());
          // var sunGetDate = sunDate.getDate();
          // var sunGetMonth = sunDate.getMonth()+1;
          // var sunGetYear = sunDate.getFullYear();
          // var weekOf = "weekof"+ (sunGetMonth<10?"0"+sunGetMonth:sunGetMonth) + (sunGetDate<10?"0"+sunGetDate:sunGetDate) + sunGetYear;

          // var dayRef = ref.child(weekOf).child(newDate.getDay()).child("slots").child(prop)

          // dayRef.once('value', function(snapshot) {
          //   $scope.myBookedClasses[prop] = snapshot.val();          
          // })
        }

        $scope.openFriendFbLink = function(friend) {
          // $window.open('https://www.facebook.com/'+friend.facebookId, '_blank');
        }

        //Need to fix this
        $scope.checkIfFriends = function(slot) {
          ref.child("bookings").child(slot.date).once('value', function(snapshot) {
            if (!snapshot.exists()) return
            $scope.friendList = $scope.friendList || {};
            $scope.friendList[slot.date] = [];
            for (var prop in snapshot.val()) {
              var user = snapshot.val()[prop];
              if (currentUser.friendListObject && currentUser.friendListObject[user.facebookId]) {
                $scope.friendList[slot.date].push(user);
                if(!$scope.$$phase) $scope.$apply();
                if (!$scope.pictureData[user.facebookId]) {
                  $scope.pictureData[user.facebookId] = user;
                  if(!$scope.$$phase) $scope.$apply();
                }
              }
            }
          })
        }

        function getBookings() {
          // ref.child("userBookings").child(currentUser._id).startAt(todayDate.getTime() - 60*60*1000).on('value', function(snapshot) {
          //   $scope.userBookings = snapshot.val()
          // })
          // ref.child("trainerClasses").child(currentUser._id).child("classesTeaching").startAt(todayDate.getTime() - 60*60*1000).on('value', function(snapshot) {
          //   $scope.classesTeaching = snapshot.val()
          // })
          ref.child("userBookings").child(currentUser._id).on('value', function(snapshot) {
            $scope.userBookings = snapshot.val()
            if(!$scope.$$phase) $scope.$apply();
          })
          ref.child("trainerClasses").child(currentUser._id).child("classesTeaching").on('value', function(snapshot) {
            $scope.classesTeaching = snapshot.val()
            if(!$scope.$$phase) $scope.$apply();
          })        
        }

        $scope.isPast = function(slot) {
          return slot.date*1 < new Date().getTime() - 45*60*1000
        }

        $scope.changeWeek = function() {
          if ($scope.thisWeek) {
            $scope.setCalendarToNextWeek()
          } else {
            $scope.setCalendarToThisWeek()
          }
        }

        $scope.setCalendarToThisWeek = function() { thisWeek() }
        function thisWeek() {
          $scope.thisWeek = true; 
          
          $scope.dateToday = "" + todayDate.getMonth() + todayDate.getDate();

          var sunDate = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate() - todayDate.getDay(), 11, 0, 0);
          // var sunDate = new Date();
          // sunDate.setDate(todayDate.getDate() - todayDate.getDay());
          var sunGetDate = sunDate.getDate();
          var sunGetMonth = sunDate.getMonth()+1;
          var sunGetYear = sunDate.getFullYear();
          var weekOf = "weekof"+ sunGetYear + (sunGetMonth<10?"0"+sunGetMonth:sunGetMonth) + (sunGetDate<10?"0"+sunGetDate:sunGetDate);

          if (!$scope.currentWeek) $firebaseObject(ref.child("classes").child(weekOf)).$bindTo($scope, 'currentWeek')
          
          unbindMethod()
          Schedule.setFirebaseObject(weekOf).$bindTo($scope, 'days').then(function(unbind) {
            unbindMethod = unbind
          });
        }

        function setNextWeek() {
          var todayDate = new Date();
          var nextWeekTime = todayDate.getTime() + 1000*60*60*24*7;
          var nextWeekDate = new Date(nextWeekTime);
          var sunDate = new Date(nextWeekDate.getFullYear(), nextWeekDate.getMonth(), nextWeekDate.getDate() - nextWeekDate.getDay(), 11, 0, 0);
          // var sunDate = new Date();
          // sunDate.setDate(nextWeekDate.getDate() - nextWeekDate.getDay());
          var sunGetDate = sunDate.getDate();
          var sunGetMonth = sunDate.getMonth()+1;
          var sunGetYear = sunDate.getFullYear();
          var weekOf = "weekof"+ sunGetYear + (sunGetMonth<10?"0"+sunGetMonth:sunGetMonth) + (sunGetDate<10?"0"+sunGetDate:sunGetDate);
          if (!$scope.nextWeek) $firebaseObject(ref.child("classes").child(weekOf)).$bindTo($scope, 'nextWeek')
        }

        $scope.setCalendarToNextWeek = function() { nextWeek() }
        function nextWeek() {
          $scope.thisWeek = false;
          var todayDate = new Date();
          var nextWeekTime = todayDate.getTime() + 1000*60*60*24*7;
          var nextWeekDate = new Date(nextWeekTime);
          $scope.dateToday = "" + nextWeekDate.getMonth() + nextWeekDate.getDate();

          var sunDate = new Date(nextWeekDate.getFullYear(), nextWeekDate.getMonth(), nextWeekDate.getDate() - nextWeekDate.getDay(), 11, 0, 0);
          // var sunDate = new Date();
          // sunDate.setDate(nextWeekDate.getDate() - nextWeekDate.getDay());
          var sunGetDate = sunDate.getDate();
          var sunGetMonth = sunDate.getMonth()+1;
          var sunGetYear = sunDate.getFullYear();
          var weekOf = "weekof"+ sunGetYear + (sunGetMonth<10?"0"+sunGetMonth:sunGetMonth) + (sunGetDate<10?"0"+sunGetDate:sunGetDate);

          unbindMethod()
          Schedule.setFirebaseObject(weekOf).$bindTo($scope, 'days').then(function(unbind) {
            unbindMethod = unbind
          });
        }

        thisWeek();
        setNextWeek();

        $scope.availableClasses = true;
        
        $interval(function() {
            $scope.timeNow = new Date().getTime();
        }, 1000*30)
        // $scope.classOverTime = $scope.timeNow - 1000*60*45;

        $scope.getDayOfWeek = function(day) {
          console.log(day)
          // for (var firstSlot)
          switch (day) {
            case 0: return "Sun"; break;
            case 1: return "Mon"; break;
            case 2: return "Tue"; break;
            case 3: return "Wed"; break;
            case 4: return "Thu"; break;
            case 5: return "Fri"; break;
            case 6: return "Sat"; break;
            default: break;
          }
        }

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

            if (newDate.getDay() == new Date().getDay() && newDate.getDate() === new Date().getDate() && !noToday) {
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
            var modalInstance = $uibModal.open({
              animation: true,
              templateUrl: 'app/membership/membership.html',
              controller: 'MembershipCtrl',
              windowClass: "modal-wide",
              resolve: {
                slot: function() {
                  return slot
                }
              }
              // scope: {classToJoin: slot} //passed current scope to the modal
            });

            modalInstance.result.then(function () {
              currentUser = Auth.getCurrentUser()
            }, function () {
              currentUser = Auth.getCurrentUser()
              // openStripePayment() //Killed here because moved into the membership modal's controller
            });
          }
        }

        //     function openStripePayment() {
        //       var handler = StripeCheckout.configure({
        //         key: 'pk_live_mpdcnmXNQpt0zTgZPjD4Tfdi',
        //         image: '../../assets/images/body-app-logo-header.png',
        //         locale: 'auto',
        //         token: function(token, args) {
        //             var modalInstance = openPaymentConfirmedModal()
        //             $http.post('/api/users/charge', {
        //               user: currentUser,
        //               stripeToken: token,
        //               shippingAddress: args,
        //             })
        //             .success(function(data) {
        //                 console.log("Successfully posted to /user/charge");
        //                 Auth.updateUser(data)
        //                 currentUser = data
        //                 $scope.currentUser = currentUser
        //                 modalInstance.close()
        //                 bookClass(slot)
        //             })
        //             .error(function(err) {
        //                 console.log(err)
        //                 modalInstance.close();
        //                 if (err.message) return alert(err.message + " Please try again or contact daniel@getbodyapp.com for assistance.")
        //                 return alert("We had trouble processing your payment. Please try again or contact daniel@getbodyapp.com for assistance.")
        //             }.bind(this));

        //           // Use the token to create the charge with a server-side script.
        //           // You can access the token ID with `token.id`
        //         }
        //       });
        //       if (currentUser.stripe && currentUser.stripe.customer && currentUser.stripe.customer.customerId) {
        //         //If user has already signed up previously
        //           if (!currentUser.email || (currentUser.email && currentUser.email.length < 4)) {
        //               handler.open({
        //                 name: 'BODY SUBSCRIPTION',
        //                 description: '$10/mo Pilot Price!',
        //                 panelLabel: "Pay {{amount}} / Month",
        //                 shippingAddress: true,
        //                 zipCode: true,
        //                 amount: 1000
        //               });    
        //           } else {
        //               handler.open({
        //                 name: 'BODY SUBSCRIPTION',
        //                 email: currentUser.email,
        //                 description: '$10/mo Pilot Price!',
        //                 panelLabel: "Pay {{amount}} / Month",
        //                 shippingAddress: true,
        //                 zipCode: true,
        //                 amount: 1000
        //               });
        //           }
        //       } else {
        //           if (!currentUser.email || (currentUser.email && currentUser.email.length < 4)) {
        //               handler.open({
        //                 name: 'BODY SUBSCRIPTION',
        //                 description: '$10/mo Pilot Price!',
        //                 panelLabel: "Pay {{amount}} / Month",
        //                 zipCode: true,
        //                 shippingAddress: true,
        //                 amount: 1000
        //               });    
        //           } else {
        //               handler.open({
        //                 name: 'BODY SUBSCRIPTION',
        //                 email: currentUser.email,
        //                 description: '$10/mo Pilot Price!',
        //                 panelLabel: "Pay {{amount}} / Month",
        //                 zipCode: true,
        //                 shippingAddress: true,
        //                 amount: 1000
        //               });
        //           }
        //       }
        //     }
        //   } 
        // }

        // function openPaymentConfirmedModal() {
        //     var modalInstance = $uibModal.open({
        //       animation: true,
        //       templateUrl: 'app/account/payment/paymentThanks.html',
        //       controller: 'PaymentCtrl',
        //       backdrop: "static",
        //       keyboard: false
        //       // size: size,
        //       // resolve: {
        //       //   currentUser: function () {
        //       //     return currentUser;
        //       //   }
        //       // }
        //     });

        //     modalInstance.result.then(function (selectedItem) {
        //       $scope.selected = selectedItem;
        //     }, function () {
        //       $log.info('Modal dismissed at: ' + new Date());
        //     });

        //     return modalInstance;
        // }

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
          if (slot.level === "Intro") {
            User.cancelIntroClass({ id: currentUser._id }, {classToCancel: slot.date}, function(user) {
              ref.child("bookings").child(slot.date).child(currentUser._id).remove()
              ref.child("userBookings").child(currentUser._id).child(slot.date).remove()
              ref.child("cancellations").child(slot.date).child(currentUser._id).update({firstName: currentUser.firstName, lastName: currentUser.lastName.charAt(0), timeBooked: new Date().getTime(), picture: currentUser.picture, facebookId: currentUser.facebookId})
              currentUser = user;
              Auth.updateUser(currentUser);
              $scope.currentUser = currentUser;
              window.intercomSettings = {
                  app_id: "daof2xrs",
                  email: user.email, // Email address
                  user_id: user._id,
                  "bookedIntro": user.bookedIntroClass,
                  "introClassBooked": false
              };
            }, function(err) {
                console.log("Error cancelling class: " + err)
            }).$promise;
          } else {
            User.cancelBookedClass({ id: currentUser._id }, {
              classToCancel: slot.date
            }, function(user) {
              ref.child("bookings").child(slot.date).child(currentUser._id).remove()
              ref.child("userBookings").child(currentUser._id).child(slot.date).remove()
              ref.child("cancellations").child(slot.date).child(currentUser._id).update({firstName: currentUser.firstName, lastName: currentUser.lastName.charAt(0), timeBooked: new Date().getTime(), picture: currentUser.picture, facebookId: currentUser.facebookId})
              Auth.updateUser(user);
              currentUser = user;
              $scope.currentUser = currentUser;
            }, function(err) {
                console.log("Error adding class: " + err)
                alert("sorry, there was an issue canceling your class.  Please try reloading the site and booking again.  If that doesn't work, contact the BODY help team at (216) 408-2902 to get this squared away.")    
            }).$promise;
          }
        }

        $scope.openBookingConfirmation = function (slot) {
          if (slot.level === "Intro" || slot.level === "Test") {
            if (currentUser.introClassTaken) {
              return alert("You have already completed your intro class. There's no reason to take another!  You should book Level " + currentUser.level + " classes now.");
            } else if (currentUser.bookedIntroClass && currentUser.introClassBooked > new Date().getTime()) {
              return alert("You should only take 1 Intro class! You have to cancel your existing intro class before you can book another.")
            } else {
              return User.addIntroClass({ id: $scope.currentUser._id }, {classToAdd: slot.date}, function(user) {
                var modalInstance = $uibModal.open({
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

                Auth.updateUser(user);
                currentUser = user;
                $scope.currentUser = user;
                ref.child("bookings").child(slot.date).child(currentUser._id).update({firstName: currentUser.firstName, lastName: currentUser.lastName.charAt(0), timeBooked: new Date().getTime(), picture: currentUser.picture, facebookId: currentUser.facebookId});
                ref.child("userBookings").child(currentUser._id).child(slot.date).update({date: slot.date, trainer: slot.trainer, level: slot.level});
                
                window.intercomSettings = {
                    app_id: "daof2xrs",
                    email: user.email, // Email address
                    user_id: user._id,
                    "bookedIntro": user.bookedIntroClass,
                    "introClassBooked": Math.floor(new Date(user.introClassBooked*1) / 1000)
                };

                // ref.child("userBookings").child(currentUser._id).update({firstName: currentUser.firstName, lastName: currentUser.lastName, facebookId: currentUser.facebookId});
                // getInfo(slot.date);
                // slot.bookedUsers = slot.bookedUsers || {};
                // slot.bookedFbUserIds = slot.bookedFbUserIds || {};
                // slot.bookedUsers[currentUser._id] = {firstName: currentUser.firstName, lastName: currentUser.lastName.charAt(0), timeBooked: new Date().getTime(), picture: currentUser.picture, facebookId: currentUser.facebookId};
                // slot.bookedFbUserIds[currentUser.facebook.id] = (new Date()).getTime();
              }, function(err) {
                  console.log("Error adding class: " + err)
                  // classToBook.bookedUsers[currentUser._id] = false
                  // classToBook.$save()
                  alert("sorry, there was an issue booking your class.  Please try reloading the site and booking again.  If that doesn't work, contact the BODY help team at (216) 408-2902 to get this squared away.")    
              }).$promise;
            }
          } else {
            if (checkWhetherUserIsSubscribed(slot)) bookClass(slot);
            // bookClass(slot)
          }
        };

        function bookClass(slot) {
          var modalInstance = $uibModal.open({
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
            ref.child("bookings").child(slot.date).child(currentUser._id).update({firstName: currentUser.firstName, lastName: currentUser.lastName.charAt(0), timeBooked: new Date().getTime(), picture: currentUser.picture, facebookId: currentUser.facebookId});
            ref.child("userBookings").child(currentUser._id).child(slot.date).update({date: slot.date, trainer: slot.trainer, level: slot.level});
            // ref.child("userBookings").child(currentUser._id).update({firstName: currentUser.firstName, lastName: currentUser.lastName, facebookId: currentUser.facebookId});
            // getInfo(slot.date);
            // slot.bookedUsers = slot.bookedUsers || {};
            // slot.bookedFbUserIds = slot.bookedFbUserIds || {};
            // slot.bookedUsers[currentUser._id] = {firstName: currentUser.firstName, lastName: currentUser.lastName.charAt(0), timeBooked: new Date().getTime(), picture: currentUser.picture, facebookId: currentUser.facebookId};
            // slot.bookedFbUserIds[currentUser.facebook.id] = true
            // slot.$save();
            currentUser = user;
            $scope.currentUser = currentUser;
          }, function(err) {
              console.log("Error adding class: " + err)
              // slot.bookedUsers = slot.bookedUsers || {};
              // delete slot.bookedUsers[currentUser._id];
              // delete slot.bookedFbUserIds[currentUser.facebook.id];
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
            if (returnValue < 120) return returnValue + " Mins"
            if (returnValue < (24 * 60)) return Math.round(returnValue / 60) + " Hours"
            if (returnValue >= (24 * 60) && returnValue < (48 * 60)) return "1 Day"
            return Math.round(returnValue / 60 / 24) + " Days"
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

    // *****************jQuery MAGIC*****************
        //Makes titles show up immediately on hover
    //     $(document).ready(function(){
    // $("#friendPicture").tooltip({
    //       show: {
    //         effect: "slideDown",
    //         delay: 250
    //       }
    //     });
    //   });
        

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
      if ($scope.windowWidth > 1100) {
        $(window).scroll(function(e){
          var classHeaderHeight = $('#tour-classes').height()*2;
          var workoutHeight = $('#tour-workout').height();
          var reservationHeight = $('#reservation-section').height();
          var heightToScroll = workoutHeight > reservationHeight? workoutHeight+classHeaderHeight: reservationHeight+classHeaderHeight
          // var heightToScroll = workoutHeight + reservationHeight

          var $el = $('.fixedAtTop'); 
          var isPositionFixed = ($el.css('position') == 'fixed');
          if ($(this).scrollTop() > heightToScroll && !isPositionFixed){ 
            $('.fixedAtTop').css({'position': 'fixed', 'top': '70px', 'width':'14.28%'}); 
          }
          if ($(this).scrollTop() < heightToScroll  && isPositionFixed)
          {
            $('.fixedAtTop').css({'position': 'static', 'top': '70px', 'width':'100%'}); 
          } 
        });
      }

      $scope.calendarDateSetter = function(slot) {
        // var date = new Date(slot.date);
        var localDate = new Date(slot.date);
        var date = new Date(localDate.getTime() - jstz().utc_offset*60*1000);
        return date.getFullYear()+""+((date.getMonth()+1 < 10)?"0"+(date.getMonth()+1):(date.getMonth()+1))+""+((date.getDate() < 10)?"0"+date.getDate():date.getDate())+"T"+((date.getHours() < 10)?"0"+date.getHours():date.getHours())+""+((date.getMinutes() < 10)?"0"+date.getMinutes():date.getMinutes())+"00"
      } 
      $scope.calendarDateSetterEnd = function(slot) {
        // var date = new Date(slot.date);
        var localDate = new Date(slot.date);
        var date = new Date(localDate.getTime() - jstz().utc_offset*60*1000);
        return date.getFullYear()+""+((date.getMonth()+1 < 10)?"0"+(date.getMonth()+1):(date.getMonth()+1))+""+((date.getDate() < 10)?"0"+date.getDate():date.getDate())+"T"+((date.getHours() < 10)?"0"+(date.getHours()+1):(date.getHours()+1))+""+((date.getMinutes() < 10)?"0"+date.getMinutes():date.getMinutes())+"00"
      } 
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

