'use strict';

angular.module('bodyAppApp')
  .controller('StorefrontCtrl', function ($scope, $stateParams, $sce, $window, $http, $location, $uibModal, Studios, Auth, User, Schedule, $rootScope) {
  	var currentUser = Auth.getCurrentUser()
    $scope.currentUser = currentUser;
    console.log(currentUser)

    var studioId = $stateParams.studioId;
    $scope.classToCreate = {};
    if (!studioId) studioId = 'body'
    Studios.setCurrentStudio(studioId);

    var ref = firebase.database().ref().child('studios').child(studioId);
    var storageRef = firebase.storage().ref().child('studios').child(studioId);

    ref.once('value', function(snapshot) {
      if (!snapshot.exists()) {
        $location.path('/')
      }
    })

    $scope.studioId = studioId;

    var daysInFuture = 0;
    var numDaysToShow = 7;

    getClasses(0, 7);
    getStorefrontInfo();
    getInstructors();
    getClassTypes();
    getWorkouts();
    getPlaylistObjects();
    createSchedule(numDaysToShow, daysInFuture);
    getImages()
    // ref.unauth()

    var accountId;

    if (Auth.getCurrentUser() && Auth.getCurrentUser().$promise) {
      Auth.getCurrentUser().$promise.then(function(data) {
        updateIntercom(data)
        // getUserBookings()
        // checkSubscriptionStatus()
        if (data.studioSubscriptions && data.studioSubscriptions[studioId]) {
          $rootScope.subscriptions = $rootScope.subscriptions || {};
          $rootScope.subscriptions[studioId] = data.studioSubscriptions[studioId].status === "active"
          if (!$rootScope.subscriptions[studioId] && data.stripe && data.stripe.subscription) $rootScope.subscriptions[studioId] = data.stripe.subscription.status === "active"
          console.log("Subscription active? " + $rootScope.subscriptions[studioId])
        }

      var auth = firebase.auth();
      auth.onAuthStateChanged(function(user) {
        if (user) {
          // console.log("User is authenticated with fb ");
          getUserBookings()
          getAccountId()
          checkSubscriptionStatus()
        } 
        // else {
        //   // console.log("User is logged out");
        //   if (currentUser.firebaseToken) {
        //     auth.signInWithCustomToken(currentUser.firebaseToken).then(function(user) {
        //       if (currentUser.role === "admin") console.log("Firebase user authentication succeeded!", user);
        //       getUserBookings()
        //       getAccountId()
        //       checkSubscriptionStatus()
        //     }); 
        //   } else {
        //     console.log("User doesn't have a firebase token saved, should retrieve one.")
        //   }
        // }
      })

        // ref.onAuth(function(authData) {
        //   if (authData) {
        //     // console.log("User is authenticated with fb ");
        //     getUserBookings()
        //     getAccountId()
        //     checkSubscriptionStatus()
        //   } else {
        //     console.log("User is logged out");
        //     if (currentUser.firebaseToken) {
        //       ref.authWithCustomToken(currentUser.firebaseToken, function(error, authData) {
        //         if (error) {
        //           Auth.logout();
        //           $window.location.reload()
        //           console.log("Firebase currentUser authentication failed", error);
        //         } else {
        //           if (currentUser.role === "admin") console.log("Firebase currentUser authentication succeeded!", authData);
        //           getUserBookings()
        //           getAccountId()
        //           checkSubscriptionStatus()
        //         }
        //       }); 
        //     } else {
        //       // Auth.logout();
        //       // $window.location.reload()
        //     }
        //   }
        // })
      })
    } else if (currentUser._id) {
      console.log("Checking subscription without promise")
      // checkSubscriptionStatus()
      // getUserBookings()
      updateIntercom(currentUser);
      if (currentUser.studioSubscriptions && currentUser.studioSubscriptions[studioId]) {
        $rootScope.subscriptions = $rootScope.subscriptions || {};
        $rootScope.subscriptions[studioId] = currentUser.studioSubscriptions[studioId].status === "active"
        if (!$rootScope.subscriptions[studioId] && currentUser.stripe && currentUser.stripe.subscription) $rootScope.subscriptions[studioId] = currentUser.stripe.subscription.status === "active"
        console.log("Subscription active? " + $rootScope.subscriptions[studioId])
      }
      ref.onAuth(function(authData) {
        if (authData) {
          // console.log("User is authenticated with fb ");
          getUserBookings()
          getAccountId()
          checkSubscriptionStatus()
        } else {
          console.log("User is logged out");
          if (currentUser.firebaseToken) {
            ref.authWithCustomToken(currentUser.firebaseToken, function(error, authData) {
              if (error) {
                Auth.logout();
                $window.location.reload()
                console.log("Firebase currentUser authentication failed", error);
              } else {
                if (currentUser.role === "admin") console.log("Firebase currentUser authentication succeeded!", authData);
                getUserBookings()
                getAccountId()
                checkSubscriptionStatus()
              }
            }); 
          } else {
            // Auth.logout();
            // $window.location.reload()
          }
        }
      })
    }

    // if (currentUser && currentUser.$promise) {
    //   currentUser.$promise.then(function(user) {
    //     console.log("Using promise to check subscription")
    //     console.log(currentUser)
    //     checkSubscriptionStatus()
    //   })            
    // } else 
    // if (currentUser._id) {
    //   console.log("Checking subscription without promise")
    //   checkSubscriptionStatus()
    //   getUserBookings()
    // } 
    // else {
    //   console.log("Can't check subscription status")
    // }

    function updateIntercom(user) {
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
          // "bookedIntro": user.bookedIntroClass ? user.bookedIntroClass : false,
          // "introTaken": user.introClassTaken ? user.introClassTaken : false,
          "numFriendsOnPlatform": user.friendList ? user.friendList.length : 0,
          "newUserFlowComplete": user.completedNewUserFlow ? user.completedNewUserFlow : false,
          // "isPayingMember" : user.stripe ? user.stripe.subscription.status === "active" : false,
          // "introClassBooked_at": Math.floor(new Date(user.introClassBooked*1) / 1000),
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
            // "bookedIntro": user.bookedIntroClass,
            // "introTaken": user.introClassTaken,
            "numFriendsOnPlatform": user.friendList ? user.friendList.length : 0,
            "newUserFlowComplete": user.completedNewUserFlow,
            // "isPayingMember" : user.stripe ? user.stripe.subscription.status === "active" : false,
            // "introClassBooked_at": Math.floor(new Date(user.introClassBooked*1) / 1000),
            "referredBy": user.referredBy,
            "referralCode" : user.referralCode,
            "role": user.role,
            "timezone": user.timezone
          };
        }, function(err) {console.log("Error creating Intercom hash: "+err)}).$promise;
      }
    }

    function getImages() {
      storageRef.child('images/icon.jpg').getDownloadURL().then(function(url) {
        $scope.iconUrl = url;
        if(!$scope.$$phase) $scope.$apply();
      }).catch(function(error) {
        console.log(error)
      });

      storageRef.child('images/header.jpg').getDownloadURL().then(function(url) {
        // $scope.headerUrl = url;
        $scope.backgroundImageUrl = url
        if(!$scope.$$phase) $scope.$apply();
      }).catch(function(error) {
        console.log(error)
      });
    }

    function getAccountId() {
      ref.child("stripeConnected").child('stripe_user_id').once('value', function(snapshot) {
        if (!snapshot.exists()) return console.log("Can't get access code for studio.")
        accountId = snapshot.val()
      })
    }

    function checkSubscriptionStatus() {
      $http.post('/api/payments/updatecustomersubscriptionstatus', {
        studioId: studioId,
        accountId: accountId
      })
      .success(function(data) {
        console.log("Successfully updated customer subscription status.");
        Auth.updateUser(data);
        currentUser = data;
        // console.log(currentUser)
        $rootScope.subscriptions = $rootScope.subscriptions || {}
        if (currentUser.studioSubscriptions && currentUser.studioSubscriptions[studioId]) {
          $rootScope.subscriptions[studioId] = currentUser.studioSubscriptions[studioId].status === "active"
          if (!$rootScope.subscriptions[studioId]) $rootScope.subscriptions[studioId] = currentUser.stripe.subscription.status === "active"
          console.log("Subscription active? " + $rootScope.subscriptions[studioId])
        } 

        // currentUser = data;
        // $scope.currentUser = currentUser;
        // $rootScope.subscriptionActive = true; //Need to change this
        // if (slot) bookClass(slot);               
      })
      .error(function(err) {
        console.log(err)
      }.bind(this));
    }
   

    // console.log(currentUser);
    // if (currentUser.stripe && currentUser.stripe.studios) $rootScope.subscriptions[studioId] = currentUser.stripe.studios[studioId]

    function getStorefrontInfo() {
      ref.child('storefrontInfo').once('value', function(snapshot) {
        if (!snapshot.exists()) return;
        $scope.storefrontInfo = snapshot.val();
        $scope.youtubeLink = $sce.trustAsResourceUrl('https://www.youtube.com/embed/'+$scope.storefrontInfo.youtubeId+'?rel=0&amp;showinfo=0');
        if(!$scope.$$phase) $scope.$apply();
      })
    }

    function getDropinPricing() {
      ref.child('stripeConnected').child('dropinPlan').child('amount').once('value', function(snapshot) {
        if (!snapshot.exists()) return;
        $scope.dropinPricing = snapshot.val()/100
        if(!$scope.$$phase) $scope.$apply();
      })  
    }

    function getSubscriptionPricing() {
      ref.child('stripeConnected').child('subscriptionPlans').once('value', function(snapshot) {
        if (!snapshot.exists()) return;
        $scope.subscriptionPricing = snapshot.val()[Object.keys(snapshot.val())[0]].amount/100
        if(!$scope.$$phase) $scope.$apply();
      })  
    }

    function getClassTypes() {
      ref.child('classTypes').once('value', function(snapshot) {
        if (!snapshot.exists()) return;
        $scope.classTypes = snapshot.val()
        if(!$scope.$$phase) $scope.$apply();
      })  
    }

    function getInstructors() {
      ref.child('instructors').once('value', function(snapshot) {
        if (!snapshot.exists()) return;
        $scope.instructors = snapshot.val();
        $scope.numOfInstructors = Object.keys(snapshot.val()).length
        if(!$scope.$$phase) $scope.$apply();
      })
    }

    function getClasses(daysInFuture, numDaysToShow) {
      var startAt = new Date().getTime() - 1*60*60*1000 //Can see classes that started an hour ago
      startAt = (startAt*1 + daysInFuture*24*60*60*1000).toString()
      var numberOfDaysToDisplay = numDaysToShow;
      var toAdd = numberOfDaysToDisplay * 24 * 60 * 60 * 1000
      var endAt = (startAt*1 + toAdd + 1*60*60*1000).toString()

      ref.child('classes').orderByKey().startAt(startAt).endAt(endAt).on('value', function(snapshot) {
        if (!snapshot.exists()) return;
        $scope.classSchedule = snapshot.val();
        console.log("Pulled " + Object.keys($scope.classSchedule).length + " classes for schedule.")
        if(!$scope.$$phase) $scope.$apply();
      })
    }

    function createSchedule(days, daysInFuture) {
      $scope.daysToShow = [];
      var dateTimeNow = new Date();
      var beginningDateToday = new Date(dateTimeNow.getFullYear(), dateTimeNow.getMonth(), dateTimeNow.getDate(), 0, 0, 0, 1).getTime();
      beginningDateToday = beginningDateToday + daysInFuture*24*60*60*1000;
      for (var i=0; i<days; i++) {
        var day = {}
        day.beginDateTime = beginningDateToday + i*24*60*60*1000
        day.endDateTime = day.beginDateTime + 24*60*60*1000-1000
        day.formattedDate = getFormattedDateTime(day.beginDateTime).dayOfWeek + ", " + getFormattedDateTime(day.beginDateTime).month + " " + getFormattedDateTime(day.beginDateTime).day;
        day.formattedDayOfWeek = getFormattedDateTime(day.beginDateTime).dayOfWeek;
        day.formattedMonthAndDay = getFormattedDateTime(day.beginDateTime).month + " " + getFormattedDateTime(day.beginDateTime).day;

        $scope.daysToShow.push(day)
        if(!$scope.$$phase) $scope.$apply();
      }
    }

    function getWorkouts() {
      ref.child('workouts').once('value', function(snapshot) {
        if (!snapshot.exists()) return;
        $scope.workouts = snapshot.val()
        // Studios.saveWorkouts(snapshot.val())
        if(!$scope.$$phase) $scope.$apply();
      })
    }

    function getPlaylistObjects() {
      ref.child('playlists').once('value', function(snapshot) {
        if (!snapshot.exists()) return;
        $scope.playlistObjects = snapshot.val();
        // Studios.savePlaylistObjects(snapshot.val())
        if(!$scope.$$phase) $scope.$apply();
      })
    }

    function getUserBookings() {
      // console.log("Getting bookings for " + currentUser._id)
      ref.child('userBookings').child(currentUser._id).on('value', function(snapshot) {
        // console.log(snapshot.val())
        if (!snapshot.exists()) return;
        // console.log(snapshot.val())
        $scope.userBookings = snapshot.val()
        snapshot.forEach(function(booking) {
          // console.log(booking.val())
          timeCanJoin(booking.val().dateTime)
        })
        if(!$scope.$$phase) $scope.$apply();
      })
    }

    function checkMembership(slot) {
      if (!slot) slot = null
      Auth.isLoggedInAsync(function(loggedIn) {
        if (!loggedIn) {
          // if (Auth.getCurrentUser().completedNewUserFlow || Auth.getCurrentUser().injuries || Auth.getCurrentUser().goals) {
          //   $state.go('storefront');
          // } else {
          var modalInstance = $uibModal.open({
            animation: true,
            templateUrl: 'app/account/signup/signup.html',
            controller: 'SignupCtrl',
            windowClass: "modal-tall"
          });

          modalInstance.result.then(function (selectedItem) {
            // $window.location.href = '/auth/' + 'facebook';
            $window.location.reload()
          }, function () {
            $window.location.reload()
          });
          // }
        } else if (!$rootScope.subscriptions || !$rootScope.subscriptions[studioId]) {
          var modalInstance = $uibModal.open({
            animation: true,
            templateUrl: 'app/membership/membership.html',
            controller: 'MembershipCtrl',
            windowClass: "modal-wide",
            resolve: {
              slot: function() {
                return slot
              },
              studioId: function() {
                return studioId
              },
              accountId: function() {
                return accountId
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
        } else {
          return true;
        }
      });
    }

    $scope.joinStudioClicked = function(slot) {
      if ($rootScope.subscribing) return
      checkMembership(slot)
    }

    $scope.playYoutubeVideo = function() {
      $("#youtubeVideo")[0].src += "&autoplay=1";
      $scope.showVideoPlayer = true;
      $scope.hidePlayer = false;
      if(!$scope.$$phase) $scope.$apply();
    }

    $scope.stopPlayingVideo = function() {
      $('#youtubeVideo').attr('src', $sce.trustAsResourceUrl('https://www.youtube.com/embed/'+$scope.storefrontInfo.youtubeId+'?rel=0&amp;showinfo=0&autoplay'));
      $scope.showVideoPlayer = false;
      if(!$scope.$$phase) $scope.$apply();
    }

    $scope.reserveClicked = function(slot) {
      // console.log(slot)
      if ($rootScope.subscribing) return
      if (!currentUser || !$rootScope.subscriptions || !$rootScope.subscriptions[studioId]) {
        console.log("No subscription found.")
        checkMembership(slot)
      } else {
        // console.log("Beginning to book class " +slot.dateTime)
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
          // $scope.selected = selectedItem;
        }, function () {
          // $log.info('Modal dismissed at: ' + new Date());
        });

        User.addBookedClass({ id: currentUser._id }, {
          classToAdd: slot.dateTime
        }, function(user) {
          ref.child("bookings").child(slot.dateTime).child(currentUser._id).update({firstName: currentUser.firstName, lastName: currentUser.lastName.charAt(0), timeBooked: new Date().getTime(), picture: currentUser.picture ? currentUser.picture : "", facebookId: currentUser.facebookId ? currentUser.facebookId : ""}, function(err) {
            if (err) return console.log(err)
            console.log("Added booking")
          });
          ref.child("userBookings").child(currentUser._id).child(slot.dateTime).update({dateTime: slot.dateTime, instructor: slot.instructor, classType: slot.classType, workout: slot.workout}, function(err) {
            if (err) return console.log(err)
            console.log("Added user booking")
          });
          // ref.child("userBookings").child(currentUser._id).update({firstName: currentUser.firstName, lastName: currentUser.lastName, facebookId: currentUser.facebookId});
          // getInfo(slot.date);
          // slot.bookedUsers = slot.bookedUsers || {};
          // slot.bookedFbUserIds = slot.bookedFbUserIds || {};
          // slot.bookedUsers[currentUser._id] = {firstName: currentUser.firstName, lastName: currentUser.lastName.charAt(0), timeBooked: new Date().getTime(), picture: currentUser.picture, facebookId: currentUser.facebookId};
          // slot.bookedFbUserIds[currentUser.facebook.id] = true
          // slot.$save();
          currentUser = user;
          // $scope.currentUser = currentUser;
          Intercom('update', {
              "latestClassTaken_at": Math.floor(new Date(slot.dateTime*1) / 1000)
          });
        }, function(err) {
            console.log("Error adding class: " + err)
            // slot.bookedUsers = slot.bookedUsers || {};
            // delete slot.bookedUsers[currentUser._id];
            // delete slot.bookedFbUserIds[currentUser.facebook.id];
            // alert("sorry, there was an issue booking your class.  Please try reloading the site and booking again.  If that doesn't work, contact the BODY help team at (216) 408-2902 to get this squared away.")    
        }).$promise;
      }
    }

    $scope.cancelClass = function(classToCancel) {
      // User.cancelBookedClass({ id: currentUser._id }, {
      //   classToCancel: slot.date,
      //   studioId: studioId
      // }, function(user) {
      if (confirm("Are you sure you want to cancel class?")) {
        ref.child("bookings").child(classToCancel.dateTime).child(currentUser._id).remove()
        ref.child("userBookings").child(currentUser._id).child(classToCancel.dateTime).remove()
        ref.child("cancellations").child(classToCancel.dateTime).child(currentUser._id).update({firstName: currentUser.firstName, lastName: currentUser.lastName.charAt(0), timeBooked: new Date().getTime(), picture: currentUser.picture ? currentUser.picture : "", facebookId: currentUser.facebookId ? currentUser.facebookId : ""})
        // Auth.updateUser(user);
        // currentUser = user;
        // $scope.currentUser = currentUser;  
      }
        
      // }, function(err) {
      //     console.log("Error adding class: " + err)
      //     alert("sorry, there was an issue canceling your class.  Please try reloading the site and booking again.  If that doesn't work, contact the BODY help team at (216) 408-2902 to get this squared away.")    
      // }).$promise;
    }

    function timeCanJoin(classDateTime) {
      var rightNow = new Date().getTime();
      var minutesBeforeClassThatCanJoin = 65;
      var timeCanJoin = classDateTime*1 - minutesBeforeClassThatCanJoin * 60 * 1000
      $scope.classesJoinTime = $scope.classesJoinTime || {};
      $scope.classesJoinTime[classDateTime] = timeCanJoin;
      $scope.rightNow = rightNow;
      // console.log(timeCanJoin)
      // console.log(rightNow)
      if(!$scope.$$phase) $scope.$apply();

      // var timeUntilClass = rightNow - timeCanJoin;
      // console.log(timeCanJoin)
      // return timeCanJoin;
    }

    $scope.joinClass = function(classToJoin) {
      Schedule.setClassUserJustJoined(studioId, classToJoin);
      $location.path('/studios/' + studioId + '/classstarting')
    }

    $scope.getFormattedDateTime = function(dateTime, noToday) {
      return getFormattedDateTime(dateTime, noToday);
    }

    function getFormattedDateTime(dateTime, noToday) {
      var newDate = new Date(dateTime);
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

  });