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
    
    Intercom('trackEvent', 'wentToClassInfo', {
      classId: classId,
      studioId: studioId
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
        if (!snapshot.exists()) return;
        $scope.bookings = snapshot.val();
        setupVidAud()
        $scope.numBookings = Object.keys($scope.bookings).length;
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
    
      if ($scope.minutesUntilClassStarts <= 0) return $scope.timeUntilClassStarts = "Click to join class!"  
      $scope.timeUntilClassStarts = "Class starting in " + $scope.minutesUntilClassStarts + " minutes";
      if ($scope.minutesUntilClassStarts > 60) $scope.timeUntilClassStarts = "Class starting in " + Math.round($scope.minutesUntilClassStarts / 60, 0) + (Math.round($scope.minutesUntilClassStarts / 60, 0) < 2 ? " hour" : " hours");
      if ($scope.minutesUntilClassStarts > 60*24) $scope.timeUntilClassStarts = "Class starting in " + Math.round($scope.minutesUntilClassStarts / 60 / 24, 0) + (Math.round($scope.minutesUntilClassStarts / 60 / 24, 0) < 2 ? " day" : " days");
    }

    function setupVidAud() {
      if (!$scope.bookings || (!$scope.bookings[$scope.currentUser._id] && !$scope.userIsInstructor)) return;
      var element = document.querySelector('#audioVideoSetup');
      Video.hardwareSetup(element);
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
          ref.child("userBookings").child($scope.currentUser._id).child(classId).remove(function(err) {
            if (err) return console.log(err)
            Intercom('trackEvent', 'cancelledClass', {
              studioId: studioId,
              classToCancel: classId ? classId : "None",
              dateOfClass_at: Math.floor(classId*1/1000)
            });
            $rootScope.$apply(function() {
              $location.path('/studios/' + studioId)
            });
          })
          ref.child("cancellations").child(classId).child($scope.currentUser._id).update({firstName: $scope.currentUser.firstName, lastName: $scope.currentUser.lastName.charAt(0), timeBooked: new Date().getTime(), picture: $scope.currentUser.picture ? $scope.currentUser.picture : "", facebookId: $scope.currentUser.facebookId ? $scope.currentUser.facebookId : ""})
        });
        // if (confirm("Are you sure you want to cancel class?")) {
          
      //   }  
      }
    }

    $scope.joinClass = function(ev) {
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
        $location.path('/uservideo')  
      }
    }

    function getAccountId() {
      ref.child("stripeConnected").child('stripe_user_id').once('value', function(snapshot) {
        if (!snapshot.exists()) return console.log("Can't get access code for studio.")
        accountId = snapshot.val()
        checkSubscriptionStatus()
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
            currentUser = Auth.getCurrentUser()
          }, function () {
            currentUser = Auth.getCurrentUser()
          });
        } else {
          return true;
        }
      });
    }

    $scope.reserveClicked = function(slot) {
      Intercom('trackEvent', "reserveClicked")
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
      }, function(err) {
          console.log("Error adding class: " + err)
      }).$promise;
    }
  })