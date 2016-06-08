angular.module('bodyAppApp')
  .controller('ClassStartingCtrl', function ($scope, $location, $rootScope, studioId, classId, Auth) {
  	var ref = firebase.database().ref().child('studios').child(studioId);
    var storageRef = firebase.storage().ref().child('studios').child(studioId);
    var auth = firebase.auth();

    $scope.currentUser = Auth.getCurrentUser()

    formatDateTime()

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
	    	if(!$scope.$$phase) $scope.$apply();
	    	getInstructorInformation(snapshot.val().instructor);
	    	getBookedUsersInformation();
	    	getClassType(snapshot.val().classType)
	    	getWorkout(snapshot.val().workout)
	    	getStudioLogo()
	    })
	  }

	  function getBookedUsersInformation() {
	  	ref.child('bookings').child(classId).on('value', function(snapshot) {
	  		$scope.bookings = snapshot.val();
        if(!$scope.$$phase) $scope.$apply();
	  	})
	  }

	  function getInstructorInformation(instructorId) {
	  	ref.child('instructors').child(instructorId).once('value', function(snapshot) {
	  		$scope.instructorDetails = snapshot.val();
	  		if(!$scope.$$phase) $scope.$apply();
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

	  $scope.cancelClass = function() {
	  	if ($scope.bookings[$scope.currentUser._id]) {
	  		if (confirm("Are you sure you want to cancel class?")) {
	        ref.child("bookings").child(classId).child($scope.currentUser._id).remove()
	        ref.child("userBookings").child($scope.currentUser._id).child(classId).remove(function(err) {
	        	if (err) return console.log(err)
	        	$rootScope.$apply(function() {
			        $location.path('/studios/' + studioId)
			      });
	        })
	        ref.child("cancellations").child(classId).child($scope.currentUser._id).update({firstName: $scope.currentUser.firstName, lastName: $scope.currentUser.lastName.charAt(0), timeBooked: new Date().getTime(), picture: $scope.currentUser.picture ? $scope.currentUser.picture : "", facebookId: $scope.currentUser.facebookId ? $scope.currentUser.facebookId : ""})
	      }	
	  	}
    }

  })