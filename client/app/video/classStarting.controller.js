'use strict';

angular.module('bodyAppApp')
  .controller('ClassStartingCtrl', function ($scope, $location, $firebaseObject, Schedule, Auth, User) {
  	var classToJoin = Schedule.classUserJustJoined;

    if (!classToJoin) {
      $location.path('/')
    }

    // $scope.instructor = classToJoin.trainer
    // $scope.instructorPicUrl = $scope.instructor.picture

    var classTime = classToJoin.date;
    var currentUser = Auth.getCurrentUser();
    $scope.currentUser = currentUser;

    var classDate = new Date(classToJoin.date)
    var sunDate = new Date()
    sunDate.setDate(classDate.getDate()-classDate.getDay())

    var ref = new Firebase("https://bodyapp.firebaseio.com/")
    var firebaseClassToJoin = $firebaseObject(
      ref.child("weekof"+(sunDate.getMonth()+1)+sunDate.getDate()+sunDate.getFullYear())
      .child(classDate.getDay())
      .child("slots")
      .child(classDate.getTime())
    )

    firebaseClassToJoin.$bindTo($scope, 'class');
    $scope.numBookedUsers = Object.keys(classToJoin.bookedUsers).length

    $scope.bookedUsers = [];

    for (var bookedUser in classToJoin.bookedUsers) {
      if (bookedUser) {
        User.getUser({id: bookedUser}).$promise.then(function(data) {
          $scope.bookedUsers.push(data);  
          console.log($scope.bookedUsers);
        })
      }    
    }

  	$scope.minutesUntilClass = Math.round(((classTime - new Date().getTime())/1000)/60, 0);
    console.log($scope.minutesUntilClass)
  	// $scope.trainer = "Mendelson";
  	// $scope.joinClassActive = false;

  	window.setInterval(function(){ checkTime() }, 20*1000)

  	function checkTime() {
  		$scope.minutesUntilClass = Math.round(((classToJoin.date - new Date().getTime())/1000)/60, 0);
  		console.log($scope.minutesUntilClass + " minutes until class begins");
  		$scope.$apply();
  		// if ($scope.minutesUntilClass <= 0) {
  			// $scope.joinClassActive = true;
  			// $location.path('/consumervideo')
  		// }
  	}

    $scope.navigateToVideo = function() {
      console.log(currentUser)
      if (currentUser._id === classToJoin.trainer._id) {
        $location.path('/trainervideo')
      } else {
        $location.path('/consumervideo')
      }
    }

    // load cookie, or start new tour
    // $scope.currentStep = 0;

    // save cookie after each step
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