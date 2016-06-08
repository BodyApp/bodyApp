angular.module('bodyAppApp')
  .controller('ClassStartingCtrl', function ($scope, studioId, classId) {
  	var ref = firebase.database().ref().child('studios').child(studioId);
    var storageRef = firebase.storage().ref().child('studios').child(studioId);
    var auth = firebase.auth();

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

  })