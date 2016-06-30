angular.module('bodyAppApp')
  .controller('ClassStartingCtrl', function ($scope, $location, $rootScope, $mdDialog, $interval, studioId, classId, Auth, Video) {
  	var ref = firebase.database().ref().child('studios').child(studioId);
    var storageRef = firebase.storage().ref().child('studios').child(studioId);
    var auth = firebase.auth();

    $scope.currentUser = Auth.getCurrentUser()
    $scope.currentUlr = $location.absUrl() //Not working
    $scope.classId = classId;
    $scope.studioId = studioId;

    formatDateTime()
    calculateTimeUntilClassStarts()
    
    Intercom('trackEvent', 'wentToClassStarting', {
      classId: classId,
      studioId: studioId
    });

    var calculateTime = $interval(calculateTimeUntilClassStarts, 30000)

    $scope.$on("$destroy", function() { // destroys the session and turns off green light when navigate away
      $interval.cancel(calculateTime)
    });

    setupVidAud()

    auth.onAuthStateChanged(function(user) {
      if (user) {     
        getClassDetails()
        getStorefrontInfo()
      }
    })

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
	  		$scope.bookings = snapshot.val();
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
	  		$scope.storefrontInfo = snapshot.val()
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
      var element = document.querySelector('#audioVideoSetup');
      var component = Video.hardwareSetup(element);
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
              dateOfClass_at: Math.floor(classId/1000)
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
    		$location.path('/trainervideo')	
    	} else {
    		$location.path('/uservideo')	
    	}
    }

  })