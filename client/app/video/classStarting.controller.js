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
    $scope.class = $firebaseObject(
      ref.child("weekof"+(sunDate.getMonth()+1)+sunDate.getDate()+sunDate.getFullYear())
      .child(classDate.getDay())
      .child("slots")
      .child(classDate.getTime())
    )

    $scope.numBookedUsers;
    $scope.bookedUsers;

    getBookedUsers(classToJoin);

    $scope.class.$loaded().then(function() {
      $scope.class.$watch(function(e) {
        getBookedUsers($scope.class);
      })
    });

    function getBookedUsers(classJoined) {
      $scope.bookedUsers = [];
      if (classJoined.bookedUsers) {
        $scope.numBookedUsers = Object.keys(classJoined.bookedUsers).length  

        for (var bookedUser in classJoined.bookedUsers) {
          if (bookedUser) {
            User.getUser({id: bookedUser}).$promise.then(function(data) {
              $scope.bookedUsers.push(data);  
            })
          }    
        }
      }
    }
    
  	$scope.minutesUntilClass = Math.round(((classTime - new Date().getTime())/1000)/60, 0);
    console.log($scope.minutesUntilClass)
  	// $scope.trainer = "Mendelson";
  	// $scope.joinClassActive = false;

  	var checkTimeInterval = window.setInterval(function(){ checkTime() }, 20*1000)

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
        clearInterval(checkTimeInterval)
        $location.path('/trainervideo')
      } else {
        clearInterval(checkTimeInterval)
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