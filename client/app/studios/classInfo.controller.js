angular.module('bodyAppApp')
  .controller('ClassInfoCtrl', function ($scope, $location, $rootScope, $mdDialog, $interval, $uibModal, $cookies, $http, $state, studioId, classId, Auth, Video, User) {
    var ref = firebase.database().ref().child('studios').child(studioId);
    var storageRef = firebase.storage().ref().child('studios').child(studioId);
    var auth = firebase.auth();

    $scope.currentUser = Auth.getCurrentUser()
    $scope.classId = classId;
    $scope.studioId = studioId;
    var accountId;

    formatDateTime()
    calculateTimeUntilClassStarts()

    //Check and handle if mobile
    if(window.innerWidth <= 990) {
      $scope.isMobile = true;
      if(!$scope.$$phase) $scope.$apply();
   } 
    
    if (OT.checkSystemRequirements() != 1 || typeof InstallTrigger !== 'undefined') {
      $scope.wrongBrowser = true;
    }

    Intercom('trackEvent', 'wentToClassInfo', {
      classId: classId,
      studioId: studioId
    });

    analytics.track('wentToClassInfo', {
      classId: classId,
      studioId: studioId,
      dateOfClass: new Date(classId*1)
    });

    var calculateTime = $interval(calculateTimeUntilClassStarts, 30000)

    $scope.$on("$destroy", function() { // destroys the session and turns off green light when navigate away
      $interval.cancel(calculateTime)
    });

    // auth.onAuthStateChanged(function(user) {
      // if (user) {     
    getClassDetails()
    getStorefrontInfo()
    getAccountId()
      // }
    // })

    function getClassDetails() {
      ref.child('classes').child(classId).on('value', function(snapshot) {
        if (!snapshot.exists()) return console.log("No class found") //Instead, should return $location.path('/studios/'+studioId)
        $scope.classDetails = snapshot.val();
        $scope.userIsInstructor = $scope.currentUser._id === $scope.classDetails.instructor
        if(!$scope.$$phase) $scope.$apply();
        getInstructorInformation(snapshot.val().instructor);
        getBookedUsersInformation();
        getClassType(snapshot.val().classType)
        getWorkout(snapshot.val().workout)
        getStudioLogo()
        calendarDateSetter()
        calendarDateSetterEnd($scope.classDetails.duration)       
      })
    }

    function getBookedUsersInformation() {
      ref.child('bookings').child(classId).on('value', function(snapshot) {
        if (!snapshot.exists()) {
          $scope.numBookings = 0;
          console.log($scope.numBookings)
          if(!$scope.$$phase) $scope.$apply();
          return setupVidAud(); //There's a check in this function for whether user is instructor
        }
        $scope.bookings = snapshot.val();
        setupVidAud()
        $scope.numBookings = Object.keys($scope.bookings).length;
        console.log($scope.numBookings)
        if(!$scope.$$phase) $scope.$apply();
        snapshot.forEach(function(booking) {
          firebase.database().ref().child('fbUsers').child(booking.val().facebookId).child('location').on('value', function(snapshot) {
            if (!snapshot.exists()) return
            $scope.bookings[booking.key].geolocation = snapshot.val()
            if(!$scope.$$phase) $scope.$apply();
          })
        })
      })
    }

    function getInstructorInformation(instructorId) {
      ref.child('instructors').child(instructorId).once('value', function(snapshot) {
        $scope.instructorDetails = snapshot.val();
        if(!$scope.$$phase) $scope.$apply();
        firebase.database().ref().child('fbUsers').child($scope.instructorDetails.facebookId).child('location').on('value', function(snapshot) {
          if (!snapshot.exists()) return
          $scope.instructorDetails.geolocation = snapshot.val()
          if(!$scope.$$phase) $scope.$apply();
        })
      })
    }

    function getClassType(classType) {
      ref.child('classTypes').child(classType).once('value', function(snapshot) {
        $scope.classType = snapshot.val()
        if(!$scope.$$phase) $scope.$apply();
      })
    }

    function getWorkout(workoutId) {
      if (!workoutId) return;
      ref.child('workouts').child(workoutId).once('value', function(snapshot) {
        $scope.workout = snapshot.val()
        if(!$scope.$$phase) $scope.$apply();
      })
    }

    function getStorefrontInfo() {
      ref.child('storefrontInfo').once('value', function(snapshot) {
        $scope.storefrontInfo = snapshot.val();
        $scope.emailAddress = $scope.storefrontInfo.ownerEmail;
        if(!$scope.$$phase) $scope.$apply();
      })
    }

    function formatDateTime() {
      var dateTime = new Date(classId*1);
      var tzName = jstz().timezone_name;   
      var timezone = moment().tz(tzName).format('z');
      $scope.formattedDateTime = {};
      $scope.formattedDateTime.date = moment(dateTime).format('dddd MMM Do')
      $scope.formattedDateTime.time = moment(dateTime).format('h:mm a') + " " + timezone
    }

    function getStudioLogo() {
      storageRef.child('images/icon.jpg').getDownloadURL().then(function(url) {
        $scope.iconUrl = url;
        if(!$scope.$$phase) $scope.$apply();
      }).catch(function(error) {
        console.log(error)
      });
    }

    function calendarDateSetter() {
      var timeOffset = moment().utcOffset();
      var date = new Date(classId*1 - timeOffset*60*1000);
      $scope.startDateTime = date.getFullYear()+""+((date.getMonth()+1 < 10)?"0"+(date.getMonth()+1):(date.getMonth()+1))+""+((date.getDate() < 10)?"0"+date.getDate():date.getDate())+"T"+((date.getHours() < 10)?"0"+date.getHours():date.getHours())+""+((date.getMinutes() < 10)?"0"+date.getMinutes():date.getMinutes())+"00"
    } 

    function calendarDateSetterEnd(duration) {
      var timeOffset = moment().utcOffset();
      var date = new Date(classId*1 - timeOffset*60*1000 + $scope.classDetails.duration*60*1000);
      $scope.endDateTime = date.getFullYear()+""+((date.getMonth()+1 < 10)?"0"+(date.getMonth()+1):(date.getMonth()+1))+""+((date.getDate() < 10)?"0"+date.getDate():date.getDate())+"T"+((date.getHours() < 10)?"0"+date.getHours():date.getHours())+""+((date.getMinutes() < 10)?"0"+date.getMinutes():date.getMinutes())+"00"
    }

    function calculateTimeUntilClassStarts() {
      var timeNow = new Date().getTime();
      $scope.minutesUntilClassStarts = Math.round((classId*1 - timeNow) / (1000*60),0);
    
      if ($scope.minutesUntilClassStarts <= 0) return $scope.timeUntilClassStarts = "Click here to join class!"  
      $scope.timeUntilClassStarts = "Click here in " + $scope.minutesUntilClassStarts + " minutes to start class";
      if ($scope.minutesUntilClassStarts > 60) $scope.timeUntilClassStarts = "Click here in " + Math.round($scope.minutesUntilClassStarts / 60, 0) + (Math.round($scope.minutesUntilClassStarts / 60, 0) < 2 ? " hour to start class" : " hours to start class");
      if ($scope.minutesUntilClassStarts > 60*24) $scope.timeUntilClassStarts = "Click here in " + Math.round($scope.minutesUntilClassStarts / 60 / 24, 0) + (Math.round($scope.minutesUntilClassStarts / 60 / 24, 0) < 2 ? " day to start class" : " days to start class");
    }

    function setupVidAud() {
      if ($scope.userIsInstructor || ($scope.bookings && $scope.bookings[$scope.currentUser._id])) {
        var element = document.querySelector('#audioVideoSetup');
        Video.hardwareSetup(element);
      }
    }

    $scope.endVideoSession = function() { //Turns off the green light if navigate away without joining class.
      Video.destroyHardwareSetup()
    }

    $scope.openNewMessage = function() {
      Intercom('showNewMessage', "I'm waiting for my class to start and have a question.");
    }

    $scope.cancelClass = function(ev) {
      if ($scope.bookings[$scope.currentUser._id]) {
        var confirm = $mdDialog.confirm({
          title: "Cancel Class",
          textContent: "Are you sure you want to cancel this class?",
          targetEvent: ev,
          clickOutsideToClose: true,
          ok: 'Yes',
          cancel: 'No'
        });

        return $mdDialog
        .show( confirm ).then(function() {
          ref.child("bookings").child(classId).child($scope.currentUser._id).remove()
          firebase.database().ref().child('userBookings').child($scope.currentUser._id).child(classId).remove(function(err) {
            if (err) return console.log(err)
            Intercom('trackEvent', 'cancelledClass', {
              studioId: studioId,
              classToCancel: classId ? classId : "None",
              dateOfClass_at: Math.floor(classId*1/1000)
            });
            analytics.track('cancelledClass', {
              studioId: studioId,
              classId: classId ? classId : "None",
              dateOfClass: classId ? new Date(classId*1) : "None"
            });

            $rootScope.$apply(function() {
              $location.path('/studios/' + studioId)
            });
          })
          firebase.database().ref().child('bookingCancellations').child($scope.currentUser._id).child(classId).update({classId: classId, studioId: studioId})
          ref.child("userBookings").child($scope.currentUser._id).child(classId).remove()
          ref.child("cancellations").child(classId).child($scope.currentUser._id).update({firstName: $scope.currentUser.firstName, lastName: $scope.currentUser.lastName.charAt(0), timeBooked: new Date().getTime(), picture: $scope.currentUser.picture ? $scope.currentUser.picture : "", facebookId: $scope.currentUser.facebookId ? $scope.currentUser.facebookId : ""})
        });
        // if (confirm("Are you sure you want to cancel class?")) {
          
      //   }  
      }
    }

    $scope.clickedWhenClassFull = function(ev) {
      Intercom('trackEvent', 'triedToReserveFullClass')
      analytics.track('triedToReserveFullClass', {studioId: studioId, classId: classId});
      var alert = $mdDialog.alert({
        title: "Added To Waitlist",
        textContent: "Great! We've added you to the waitlist and will let you know if a spot opens up.",
        targetEvent: ev,
        clickOutsideToClose: true,
        ok: 'OK!',
      });
      var confirm = $mdDialog.confirm({
          title: "Class Full",
          textContent: "Would you like to be added to the waitlist?",
          targetEvent: ev,
          clickOutsideToClose: true,
          ok: 'Yes',
          cancel: 'No'
        });

        return $mdDialog
        .show( confirm ).then(function() {
          Intercom('trackEvent', 'addToWaitlist', {
            studioId: studioId,
            classToAdd: classId ? classId : "None",
            dateOfClass_at: Math.floor(classId*1/1000)
          });

          analytics.track('addToWaitlist', {studioId: studioId, classId: classId});
            
          ref.child("waitlist").child(classId).child($scope.currentUser._id).update({firstName: $scope.currentUser.firstName, lastName: $scope.currentUser.lastName.charAt(0), timeBooked: new Date().getTime(), picture: $scope.currentUser.picture ? $scope.currentUser.picture : "", facebookId: $scope.currentUser.facebookId ? $scope.currentUser.facebookId : ""}, function(err) {
            if (err) return err;
            return $mdDialog.show( alert )
          })
        });
    }

    $scope.joinClass = function(ev) {
      if ($scope.isMobile) {
        var alert = $mdDialog.alert({
          title: "Can't use mobile device for class",
          textContent: "You'll need a computer and the Google Chrome browser to take class. We don't support mobile yet!",
          targetEvent: ev,
          clickOutsideToClose: true,
          ok: 'OK!'
        });

        return $mdDialog
        .show( alert )
      }
      if ($scope.wrongBrowser) {
        var alert = $mdDialog.alert({
          title: "Need to use Google Chrome Browser",
          textContent: "You'll need to use Google Chrome to take class.  You can download it here: https://www.google.com/chrome/browser/desktop/",
          targetEvent: ev,
          clickOutsideToClose: true,
          ok: 'OK!'
        });

        return $mdDialog
        .show( alert )
      }
      if ($scope.minutesUntilClassStarts > 5 && $scope.classDetails.instructor != $scope.currentUser._id) {
        var alert = $mdDialog.alert({
          title: "Class Not Started Yet",
          textContent: $scope.timeUntilClassStarts + "!",
          targetEvent: ev,
          clickOutsideToClose: true,
          ok: 'OK!'
        });

        return $mdDialog
        .show( alert )
      } else if ($scope.minutesUntilClassStarts > 10 && $scope.classDetails.instructor === $scope.currentUser._id) {
        var alert = $mdDialog.alert({
          title: "Class Not Started Yet",
          textContent: "You'll be able to join class 10 minutes before it begins.",
          targetEvent: ev,
          clickOutsideToClose: true,
          ok: 'OK!'
        });

        return $mdDialog
        .show( alert )
      } else if (!($scope.bookings && $scope.bookings[$scope.currentUser._id]) && $scope.classDetails.instructor != $scope.currentUser._id) {
        var alert = $mdDialog.alert({
          title: "Not Signed Up",
          textContent: "You aren't registered for this class!  Go back and sign up!",
          targetEvent: ev,
          clickOutsideToClose: true,
          ok: 'OK!'
        });

        return $mdDialog
        .show( alert )
      }

      Video.setStudio(studioId);
      Video.setClassId(classId);
      
      if ($scope.currentUser._id === $scope.classDetails.instructor) {
        Intercom('trackEvent', 'taughtClass', {
          dateOfClass_at: Math.floor($scope.classDetails.dateTime/1000)*1,
          created_at: Math.floor($scope.classDetails.dateTime/1000)*1,
          classId: classId,
          studioId: studioId,
          classType: $scope.classDetails.classType
        });
        analytics.track('taughtClass', {
          dateOfClass_at: new Date($scope.classDetails.dateTime),
          classId: classId,
          studioId: studioId,
          classType: $scope.classDetails.classType
        });
        firebase.database().ref().child('taughtClass').child($scope.currentUser._id).child(classId).update({
          classId: classId,
          studioId: studioId,
          classType: $scope.classDetails.classType
        })
        $location.path('/trainervideo') 
      } else {
        Intercom('trackEvent', 'tookClass', {
          dateOfClass_at: Math.floor($scope.classDetails.dateTime/1000)*1,
          created_at: Math.floor($scope.classDetails.dateTime/1000)*1,
          classId: classId,
          studioId: studioId,
          classType: $scope.classDetails.classType,
          instructor: $scope.classDetails.instructor
        });
        //segment.io
        analytics.track('tookClass', {
          dateOfClass_at: new Date($scope.classDetails.dateTime),
          classId: classId,
          studioId: studioId,
          classType: $scope.classDetails.classType,
          instructor: $scope.classDetails.instructor
        });
        $location.path('/uservideo')  
        firebase.database().ref().child('tookClass').child($scope.currentUser._id).child(classId).update({
          classId: classId,
          studioId: studioId,
          classType: $scope.classDetails.classType,
          instructor: $scope.classDetails.instructor
        })
      }
    }

    function getAccountId() {
      ref.child("stripeConnected").child('stripe_user_id').once('value', function(snapshot) {
        if (!snapshot.exists()) return console.log("Can't get access code for studio.")
        accountId = snapshot.val()
        if ($scope.currentUser._id) checkSubscriptionStatus()
      })

      ref.child("stripeConnected").child('subscriptionPlans').limitToLast(1).once('value', function(snapshot) {
        snapshot.forEach(function(plan) {
          $scope.subscriptionPlan = plan.val()
          if(!$scope.$$phase) $scope.$apply();
        })      
      })
    }

    function checkSubscriptionStatus() {
      $http.post('/api/payments/updatecustomersubscriptionstatus', {
        studioId: studioId,
        accountId: accountId
      })
      .success(function(data) {
        console.log("Successfully updated customer subscription status.");
        console.log(data)
      })
      .error(function(err) {
        console.log(err)
      }.bind(this));
    }

    function checkMembership(slot) {
      $rootScope.subscriptions = $rootScope.subscriptions || {};
      if (!slot) slot = null
      Auth.isLoggedInAsync(function(loggedIn) {
        if (!loggedIn) {
          $cookies.put('loggedInPath', $location.path())
          
          $state.go('signup', {step: 0, mode: 'signup'})

        } else if (slot && slot.typeOfClass === 'Specialty') {
          console.log("Booking specialty class")
          return bookSpecialtyClass(slot)
        } else if (slot && $scope.classType && $scope.classType.freeClass) { //Book class if studio hasn't set pricing.
          console.log("Booking for free because this is a free class.")
          return bookClass(slot)
        } else if (!$scope.storefrontInfo.subscriptionPricing && !$scope.storefrontInfo.dropinPricing) { //Book class if studio hasn't set pricing.
          console.log("Booking for free because no pricing is set")
          return bookClass(slot)
        } else if ($scope.currentUser && $scope.currentUser.role === 'admin') {
          console.log("Booking for free because user is admin.")
          return bookClass(slot)
        } else if (studioId === 'body') {
          console.log("Booking for free because this is the BODY studio.")
          return bookClass(slot)
        } else if ($rootScope.subscriptions && $rootScope.subscriptions[studioId] != 'active') {
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
          });

          modalInstance.result.then(function () {
            // $scope.currentUser = Auth.getCurrentUser()
          }, function () {
            // $scope.currentUser = Auth.getCurrentUser()
          });
        } else {
          return true;
        }
      });
    }

    $scope.reserveClicked = function(slot, ev) {
      if (slot.dateTime < new Date().getTime() - slot.duration*60*1000) {
        var alert = $mdDialog.alert({
          title: "Class is Over",
          textContent: "You can't book a class that's in the past!",
          targetEvent: ev,
          clickOutsideToClose: true,
          ok: 'OK!'
        });

        return $mdDialog
        .show( alert )
      }
      Intercom('trackEvent', "reserveClicked")
      analytics.track('reserveClicked')
      if ($rootScope.subscribing) return 
      if (!$scope.currentUser || !$rootScope.subscriptions || !$rootScope.subscriptions[studioId]) {
        console.log("No subscription found.")
        checkMembership(slot)
      } else {
        bookClass(slot)
      }
    }

    function bookSpecialtyClass(slot) {
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
      });
    }

    function bookClass(slot) {
      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: 'app/schedule/bookingConfirmation.html',
        controller: 'BookingConfirmationCtrl',
        resolve: {
          slot: function () {
            return slot;
          },
          studioId: function () {
            return studioId;
          }
        }
      });

      modalInstance.result.then(function (selectedItem) {
        $location.path('/studios/'+studioId+"/classinfo/"+classId)
        if(!$scope.$$phase) $scope.$apply();
      }, function () {
        // $log.info('Modal dismissed at: ' + new Date());
      });

      User.addBookedClass({ id: $scope.currentUser._id }, {
        classToAdd: slot.dateTime,
        className: $scope.classType.name,
        studioName: $scope.storefrontInfo.studioName,
        studioId: $scope.storefrontInfo.studioId,
        instructorFullName: $scope.instructorDetails.firstName + " " + $scope.instructorDetails.lastName,
        classStartingUrl: "https://www.getbodyapp.com/studios/"+studioId+"/classinfo/"+slot.dateTime,
        equipmentRequired: $scope.classType.equipment,
        classDescription: $scope.classType.classDescription,
        studioIconUrl: $scope.iconUrl
      }, function(user) {
        ref.child("bookings").child(slot.dateTime).child($scope.currentUser._id).update({firstName: $scope.currentUser.firstName, lastName: $scope.currentUser.lastName.charAt(0), timeBooked: new Date().getTime(), picture: $scope.currentUser.picture ? $scope.currentUser.picture : "", facebookId: $scope.currentUser.facebookId ? $scope.currentUser.facebookId : ""}, function(err) {
          if (err) return console.log(err)
          console.log("Added booking")
        });
        ref.child("userBookings").child($scope.currentUser._id).child(slot.dateTime).update({dateTime: slot.dateTime, instructor: slot.instructor, classType: slot.classType, workout: slot.workout}, function(err) {
          if (err) return console.log(err)
          console.log("Added user booking")
        });
        firebase.database().ref().child('userBookings').child($scope.currentUser._id).child(slot.dateTime).update({
          className: $scope.classType.name,
          studioName: $scope.storefrontInfo.studioName,
          studioId: $scope.storefrontInfo.studioId,
          instructorFullName: $scope.instructorDetails.firstName + " " + $scope.instructorDetails.lastName,
          classInfoUrl: "https://www.getbodyapp.com/studios/"+studioId+"/classinfo/"+slot.dateTime,
          classDescription: $scope.classType.classDescription,
          studioIconUrl: $scope.iconUrl,
          classId: slot.dateTime,
          duration: slot.duration
        })

        $scope.currentUser = user;
        Intercom('update', {
            "latestClassBooked_at": Math.floor(new Date(slot.dateTime*1) / 1000)
        });

        Intercom('trackEvent', 'bookedClass', {
          studioId: studioId,
          classToBook: slot ? slot.dateTime : "None",
          dateOfClass_at: Math.floor(slot.dateTime/1000)
        });
        analytics.track('bookedClass', {
          studioId: studioId,
          classId: slot ? slot.dateTime : "None",
          dateOfClass: new Date(slot.dateTime*1)
        });
      }, function(err) {
          console.log("Error adding class: " + err)
      }).$promise;
    }
  })