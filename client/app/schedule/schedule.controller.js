// 'use strict';

angular.module('bodyAppApp')
    .controller('ConsumerScheduleCtrl', function ($scope, $http, $location, $firebaseObject, $rootScope, Auth, User, Schedule, Video, $uibModal, $uibTooltip, $log, $interval, $state, tourConfig, $window, Referral, $cookieStore, studioId) {
      // var currentUser = Auth.getCurrentUser();
      // var currentUser;
      var ref;
      if (studioId) {
        ref = new Firebase("https://bodyapp.firebaseio.com/studios").child(studioId);
        Schedule.setCurrentStudio(studioId);
      } else {
        $location.path('/ralabala/schedule')
        ref = new Firebase("https://bodyapp.firebaseio.com/studios").child("ralabala");
      } 

      ref.child('trainers').once('value', function(snapshot) {
        $scope.trainers = snapshot.val();
      })

      var fbUsersRef = new Firebase("https://bodyapp.firebaseio.com/fbUsers");
      
      var todayDate = new Date();
      $scope.todayDayOfWeek = todayDate.getDay();
      $scope.windowWidth = (window.innerWidth > 0) ? window.innerWidth : screen.width;
      // $scope.myBookedClasses = {};

      $scope.studioId = studioId

      var tzName = jstz().timezone_name;
      $scope.thisWeek;
      $scope.chosenDay;
      $scope.timeNow = new Date().getTime();
      $scope.classExists = {};
      $scope.classDeleted = {};

      Video.destroyHardwareSetup()

      console.warn = function(str){}

      setTimezone()
      function setTimezone() {          
        $scope.timezone = moment().tz(tzName).format('z');
      }

      var unbindMethod = function(){};

      var classKey = ""+todayDate.getFullYear()+""+((todayDate.getMonth()+1 < 10)?"0"+(todayDate.getMonth()+1):todayDate.getMonth()+1)+""+((todayDate.getDate() < 10)?"0"+todayDate.getDate():todayDate.getDate())
      // var wodRef = ref.child('WODs').child(classKey).once('value', function(snapshot) {
        // $scope.wod = snapshot.val()
      // });

      var currentUser = Auth.getCurrentUser();

      if (currentUser && currentUser.$promise) {
        currentUser.$promise.then(function(user) {
          console.log("Calling setuser from promise resolution")
          setUser(user)
        })            
      } else if (currentUser) {
        console.log("Calling setuser without promise")
        setUser(currentUser)
      } else {
        console.log("Calling setuser without currentuser")
        setUser(Auth.getCurrentUser())
      }

      var setUser = function(user) {
        currentUser = user

        $scope.currentUser = currentUser;
        Schedule.setCurrentUser(currentUser);
        $scope.pictureData = {};

        if (user.stripe && user.stripe.studios && user.stripe.studios[studioId] && user.stripe.studios[studioId].subscription) $rootScope.subscriptionActive = user.stripe.studios[studioId].subscription.status === 'active';

        //Firebase authentication check
        ref.onAuth(function(authData) {
          if (authData) {
            getBookings()
            thisWeek();
            setWod();
            console.log("User is authenticated with fb ");
          } else {
            console.log("User is logged out");
            if (user.firebaseToken) {
              ref.authWithCustomToken(user.firebaseToken, function(error, authData) {
                if (error) {
                  Auth.logout();
                  $window.location.reload()
                  console.log("Firebase user authentication failed", error);
                } else {
                  if (user.role === "admin") console.log("Firebase user authentication succeeded!", authData);
                  getBookings()
                  thisWeek();
                  setWod();
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
        if (user.intercomHash) {
          window.intercomSettings = {
            app_id: "daof2xrs",
            name: user.firstName + " " + user.lastName, // Full name
            email: user.email, // Email address
            user_id: user._id,
            user_hash: user.intercomHash,
            "goals": user.goals,
            "emergencyContact": user.emergencyContact,
            "injuries": user.injuries,
            // "latestClass_at": user.classesBookedArray ? Math.floor(new Date(user.classesBookedArray[user.classesBookedArray.length-1]*1) / 1000) : "",
            "bookedIntro": user.bookedIntroClass ? user.bookedIntroClass : false,
            "introTaken": user.introClassTaken ? user.introClassTaken : false,
            "numFriendsOnPlatform": user.friendList ? user.friendList.length : 0,
            "newUserFlowComplete": user.completedNewUserFlow ? user.completedNewUserFlow : false,
            // "isPayingMember" : user.stripe ? user.stripe.subscription.status === "active" : false,
            "introClassBooked_at": Math.floor(new Date(user.introClassBooked*1) / 1000),
            "referredBy": user.referredBy,
            "referralCode" : user.referralCode,
            "role": user.role,
            "timezone": user.timezone
          };
        } else {
          User.createIntercomHash({id: user._id}, {}, function(user) {
            Auth.updateUser(user);
            window.intercomSettings = {
              app_id: "daof2xrs",
              name: user.firstName + " " + user.lastName, // Full name
              email: user.email, // Email address
              user_id: user._id,
              user_hash: user.intercomHash,
              "goals": user.goals,
              "emergencyContact": user.emergencyContact,
              "injuries": user.injuries,
              // "latestClass_at": user.classesBookedArray ? Math.floor(new Date(user.classesBookedArray[user.classesBookedArray.length-1]*1) / 1000) : "",
              "bookedIntro": user.bookedIntroClass,
              "introTaken": user.introClassTaken,
              "numFriendsOnPlatform": user.friendList ? user.friendList.length : 0,
              "newUserFlowComplete": user.completedNewUserFlow,
              // "isPayingMember" : user.stripe ? user.stripe.subscription.status === "active" : false,
              "introClassBooked_at": Math.floor(new Date(user.introClassBooked*1) / 1000),
              "referredBy": user.referredBy,
              "referralCode" : user.referralCode,
              "role": user.role,
              "timezone": user.timezone
            };
          }, function(err) {console.log("Error creating Intercom hash: "+err)}).$promise;
        }

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

        // //Olark Integration
        // if (user.firstName && user.lastName) {
        //   olark('api.visitor.updateFullName', {
        //       fullName: user.firstName + " " + user.lastName.charAt(0)
        //   });
        // }

        // olark('api.visitor.updateCustomFields', {
        //   id: user._id,
        //   fbId: user.facebookId
        // });

        var referredBy = $cookieStore.get('referredBy');
        $cookieStore.remove('referredBy');
        if (referredBy) {
          console.log('referral code saved')
          User.referredBy({ id: currentUser._id }, {
            referredBy: referredBy
          }, function(user) {
            Intercom('update', {
              "referredBy": referredBy
            });
          }, function(err) {
              console.log(err)
          }).$promise
        }
      }

      // if (Video.devices) Video.destroyHardwareSetup() //User may navigate back to schedule from classStarting without actually joining class.

      function setWod() {
        var wodRef = ref.child('WODs').child(classKey).once('value', function(snapshot) {
          $scope.wod = snapshot.val()
        });
      }

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

      // function aggregateBookings() {
      //   var rightNow = new Date().getTime().toString();
      //   console.log(rightNow)
      //   ref.child("bookings").orderByKey().startAt(rightNow).once('value', function(snapshot) {
      //     if (!snapshot.exists()) return
      //     for (var classSnapshot in snapshot.val()) {
      //       $scope.bookingsBySlot = $scope.bookingsBySlot || {};
      //       $scope.bookingsBySlot[classSnapshot] = [];
      //       $scope.friendList = $scope.friendList || {};
      //       $scope.friendList[classSnapshot] = [];
      //       for (var booking in classSnapshot) {
      //         var user = booking;
      //         $scope.bookingsBySlot[classSnapshot].push(user);
      //         if (currentUser.friendListObject && currentUser.friendListObject[user.facebookId]) {
      //           $scope.friendList[classSnapshot].push(user);
      //           if(!$scope.$$phase) $scope.$apply();
      //           if (!$scope.pictureData[user.facebookId]) {
      //             $scope.pictureData[user.facebookId] = user;
      //             if(!$scope.$$phase) $scope.$apply();
      //           }
      //         }
      //       }
      //     }
      //   })
      // }

      //Need to fix this
      $scope.checkIfFriends = function(slot) {
        var rightNow = new Date().getTime();
        ref.child("bookings").child(slot.date).once('value', function(snapshot) {
          $scope.bookingsBySlot = $scope.bookingsBySlot || {};
          $scope.bookingsBySlot[slot.date] = [];
          if (!snapshot.exists()) return
          $scope.friendList = $scope.friendList || {};
          $scope.friendList[slot.date] = [];
          for (var prop in snapshot.val()) {
            var user = snapshot.val()[prop];
            $scope.bookingsBySlot[slot.date].push(user);
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

      // $scope.classDeleted = function(dateTime) {
        // if (!$scope.classDeleted[dateTime]) {
          // $scope.classDeleted[dateTime] = true
          // $scope.days.forEach(function(day) {
          //   console.log(day.val())
          //   if (day && day.slots && day.slots[dateTime]) {console.log("Hey"); $scope.classDeleted[dateTime] = false; } 
          // })

          // $scope.nextWeek.forEach(function(day) {
          //   console.log(day.val())
          //   if (day && day.slots && day.slots[dateTime]) $scope.classDeleted[dateTime] = false
          // })
        // }

        // for (var day in $scope.currentWeek) {
        //   console.log(day)
        //   if (day.slots[dateTime]) classExists = true
        // }

        // for (var day in $scope.nextWeek) {
        //   if (day.slots[dateTime]) classExists = true
        // }
        // return !classExists;
      // }

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

        // if (!$scope.currentWeek) $scope.currentWeek = $firebaseObject(ref.child("classes").child(weekOf))
        // if (!$scope.currentWeek) $firebaseObject(ref.child("classes").child(weekOf)).$bindTo($scope, 'currentWeek')

        // for (var day in $scope.currentWeek.val()) {
          // $scope.currentWeek.forEach(function(day) {
          // console.log(day)
          // if ($scope.currentWeek.hasOwnProperty(day)) {
          //   for (var classDateTime in day.slots) {
            // day.forEach(function(hello) {
            //   console.log(classDateTime)
            //     console.log(classDateTime)
            //   $scope.classExists[classDateTime] = true
            //   if(!$scope.$$phase) $scope.$apply();
            // })
            
            
          
        // }
        
        $scope.days = $firebaseObject(ref.child("classes").child(weekOf))
        // unbindMethod()
        // Schedule.setFirebaseObject(weekOf).$bindTo($scope, 'days').then(function(unbind) {
        //   unbindMethod = unbind
        // });
      }

      // function setNextWeek() {
        // var todayDate = new Date();
        // var nextWeekTime = todayDate.getTime() + 1000*60*60*24*7;
        // var nextWeekDate = new Date(nextWeekTime);
        // var sunDate = new Date(nextWeekDate.getFullYear(), nextWeekDate.getMonth(), nextWeekDate.getDate() - nextWeekDate.getDay(), 11, 0, 0);
        // // var sunDate = new Date();
        // // sunDate.setDate(nextWeekDate.getDate() - nextWeekDate.getDay());
        // var sunGetDate = sunDate.getDate();
        // var sunGetMonth = sunDate.getMonth()+1;
        // var sunGetYear = sunDate.getFullYear();
        // var weekOf = "weekof"+ sunGetYear + (sunGetMonth<10?"0"+sunGetMonth:sunGetMonth) + (sunGetDate<10?"0"+sunGetDate:sunGetDate);
        // if (!$scope.nextWeek) $scope.nextWeek = $firebaseObject(ref.child("classes").child(weekOf))
        // if (!$scope.nextWeek) $firebaseObject(ref.child("classes").child(weekOf)).$bindTo($scope, 'nextWeek')

        // $scope.nextWeek.forEach(function(day) {
        //   for (var classDateTime in day.slots) {
        //     console.log(classDateTime)
        //     $scope.classExists[classDateTime] = true
        //     if(!$scope.$$phase) $scope.$apply();
        //   }
        // })

      // }

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

        // unbindMethod()
        $scope.days = $firebaseObject(ref.child("classes").child(weekOf))
        // Schedule.setFirebaseObject(weekOf).$bindTo($scope, 'days').then(function(unbind) {
          // unbindMethod = unbind
        // });
      }

      // thisWeek();
      // setNextWeek();

      $scope.availableClasses = true;
      
      $interval(function() {
        $scope.timeNow = new Date().getTime();
      }, 1000*30)
      // $scope.classOverTime = $scope.timeNow - 1000*60*45;

      $scope.getFormattedDateTime = function(slot, noToday) {
          slot = slot || {};
          slot.date = slot.date || new Date();
          var newDate = new Date(slot.date);
          var formatted = {};

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
        if (currentUser.stripe && currentUser.stripe.studios && currentUser.stripe.studios[studioId] && currentUser.stripe.studios[studioId].subscription && currentUser.stripe.studios[studioId].subscription.status === "active") { //Change to rootscope check
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

      $scope.cancelClass = function(slot) {
        if (slot.level === "Intro") {
          User.cancelIntroClass({ id: currentUser._id }, {classToCancel: slot.date}, function(user) {
            ref.child("bookings").child(slot.date).child(currentUser._id).remove()
            ref.child("userBookings").child(currentUser._id).child(slot.date).remove()
            ref.child("cancellations").child(slot.date).child(currentUser._id).update({firstName: currentUser.firstName, lastName: currentUser.lastName.charAt(0), timeBooked: new Date().getTime(), picture: currentUser.picture ? currentUser.picture : "", facebookId: currentUser.facebookId ? currentUser.facebookId : ""})
            currentUser = user;
            Auth.updateUser(currentUser);
            $scope.currentUser = currentUser;
            window.intercomSettings = {
                app_id: "daof2xrs",
                email: user.email, // Email address
                user_id: user._id,
                user_hash: user.intercomHash,
                "bookedIntro": user.bookedIntroClass,
                "introClassBooked": false
            };
          }, function(err) {
              console.log("Error cancelling class: " + err)
          }).$promise;
        } else {
          User.cancelBookedClass({ id: currentUser._id }, {
            classToCancel: slot.date,
            studioId: studioId
          }, function(user) {
            ref.child("bookings").child(slot.date).child(currentUser._id).remove()
            ref.child("userBookings").child(currentUser._id).child(slot.date).remove()
            ref.child("cancellations").child(slot.date).child(currentUser._id).update({firstName: currentUser.firstName, lastName: currentUser.lastName.charAt(0), timeBooked: new Date().getTime(), picture: currentUser.picture ? currentUser.picture : "", facebookId: currentUser.facebookId ? currentUser.facebookId : ""})
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
        ref.child("bookings").child(slot.date).once('value', function(snapshot) {
          if (snapshot.numChildren() >= slot.spots) { // Checks if the class is actually full
            $scope.bookingsBySlot[slot.date] = [];
            if (!snapshot.exists()) return
            for (var prop in snapshot.val()) {
              var user = snapshot.val()[prop];
              $scope.bookingsBySlot[slot.date].push(user); // Updates the schedule to show 'class full' if it is full
            }
            if(!$scope.$$phase) $scope.$apply();
            return alert("Unfortunately, this class is now full.  Please choose another.")
          } else {
            if (currentUser.facebook && currentUser.facebook.age_range && currentUser.facebook.age_range.max < 18) {
              return alert("Unfortunately, you currently need to be 18+ to participate in BODY classes.")
            }
            if (slot.level === "Intro") {
              if (currentUser.introClassTaken && currentUser.role != "admin") {
                var levelToSuggest = currentUser.level ? currentUser.level : "1"
                return alert("You have already completed your intro class. There's no reason to take another!  You should book Level " + levelToSuggest + " classes now.");
              } else if (currentUser.bookedIntroClass && currentUser.introClassBooked > new Date().getTime() && currentUser.role != "admin") {
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
                  ref.child("bookings").child(slot.date).child(currentUser._id).update({firstName: currentUser.firstName, lastName: currentUser.lastName.charAt(0), timeBooked: new Date().getTime(), picture: currentUser.picture ? currentUser.picture : "", facebookId: currentUser.facebookId ? currentUser.facebookId : ""});
                  ref.child("userBookings").child(currentUser._id).child(slot.date).update({date: slot.date, trainer: slot.trainer, level: slot.level});
                  
                  Intercom('update', {
                      "bookedIntro": user.bookedIntroClass,
                      "introClassBooked_at": Math.floor(new Date(user.introClassBooked*1) / 1000)
                  });

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
            } else if (slot.level === "Open" || slot.level === "Test") {
              bookClass(slot);
            } else {
              if (checkWhetherUserIsSubscribed(slot)) bookClass(slot);
              // bookClass(slot)
            }              
          }
        })
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
          ref.child("bookings").child(slot.date).child(currentUser._id).update({firstName: currentUser.firstName, lastName: currentUser.lastName.charAt(0), timeBooked: new Date().getTime(), picture: currentUser.picture ? currentUser.picture : "", facebookId: currentUser.facebookId ? currentUser.facebookId : ""});
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
          Intercom('update', {
              "latestClassTaken_at": Math.floor(new Date(slot.date*1) / 1000)
          });
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
          Schedule.setClassUserJustJoined(studioId, classJoined);
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
        // console.log(moment().zone())
        var timeOffset = moment().utcOffset();
        // var timeOffset = - moment().zone();
        // var timeOffset = jstz().utc_offset + 60;
        var date = new Date(slot.date - timeOffset*60*1000);
        return date.getFullYear()+""+((date.getMonth()+1 < 10)?"0"+(date.getMonth()+1):(date.getMonth()+1))+""+((date.getDate() < 10)?"0"+date.getDate():date.getDate())+"T"+((date.getHours() < 10)?"0"+date.getHours():date.getHours())+""+((date.getMinutes() < 10)?"0"+date.getMinutes():date.getMinutes())+"00"
      } 
      $scope.calendarDateSetterEnd = function(slot) {
        // var date = new Date(slot.date);
        // var timeOffset = jstz().utc_offset + 60;
        var timeOffset = moment().utcOffset();
        // var timeOffset = - moment().zone();  
        var date = new Date(slot.date - timeOffset*60*1000);
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

