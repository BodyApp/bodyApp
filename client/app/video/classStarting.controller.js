'use strict';

angular.module('bodyAppApp')
  .controller('ClassStartingCtrl', function ($scope, $location, $interval, $firebaseObject, Schedule, Auth, User, Video) {
  	var classToJoin = Schedule.classUserJustJoined;

      $scope.overlay1 = true;
      $scope.overlay2 = false;
      $scope.overlay3 = false;
      $scope.tab1 = true;
      $scope.tab2 = false;
      $scope.instructorBio = false;

    if (!classToJoin) {
      $location.path('/')
    }

    // $scope.instructor = classToJoin.trainer
    // $scope.instructorPicUrl = $scope.instructor.picture

    var classTime = classToJoin.date;
    var currentUser = Auth.getCurrentUser();
    $scope.currentUser = currentUser;

    var classDate = new Date(classToJoin.date)
    var sunDate = new Date();
    sunDate.setDate(classDate.getDate() - classDate.getDay());
    var sunGetDate = sunDate.getDate();
    var sunGetMonth = sunDate.getMonth()+1;
    var sunGetYear = sunDate.getFullYear();
    var weekOf = "weekof"+ (sunGetMonth<10?"0"+sunGetMonth:sunGetMonth) + (sunGetDate<10?"0"+sunGetDate:sunGetDate) + sunGetYear;

    var ref = new Firebase("https://bodyapp.firebaseio.com/");
    $scope.class = $firebaseObject(
      ref.child(weekOf)
      .child(classDate.getDay())
      .child("slots")
      .child(classDate.getTime())
    )

    $scope.numBookedUsers;
    $scope.bookedUsers;

    $scope.trainerRatingRounded;

    getBookedUsers(classToJoin);

    $scope.class.$loaded().then(function() {
      $scope.trainerRatingRounded = Math.round($scope.class.trainer.trainerRating * 10)/10
      $scope.class.$watch(function(e) {
        getBookedUsers($scope.class);
      })
      setupVidAud()
    });

    // $scope.audioInputDevices;
    // $scope.videoInputDevices;

    // OT.getDevices(function(error, devices) {
    //   if (devices) {
    //     $scope.audioInputDevices = devices.filter(function(element) {
    //       return element.kind == "audioInput";
    //     });
    //     $scope.videoInputDevices = devices.filter(function(element) {
    //       return element.kind == "videoInput";
    //     });
    //     // for (var i = 0; i < $scope.audioInputDevices.length; i++) {
    //     //   console.log("audio input device: ", $scope.audioInputDevices[i]);
    //     // }
    //     // for (i = 0; i < $scope.videoInputDevices.length; i++) {
    //     //   console.log("video input device: ", $scope.videoInputDevices[i]);
    //     // }
    //     $scope.audioInput = $scope.audioInputDevices[0];
    //     if ($scope.audioInput) $scope.setAudioInput($scope.audioInput);
    //     $scope.videoInput = $scope.videoInputDevices[0];
    //     if ($scope.videoInput) $scope.setVideoInput($scope.videoInput);
    //   }
    // });

    function setVideoInput(videoInput) {
      Video.setVideoInput(videoInput);
    }

    function setAudioInput(audioInput) {
      Video.setAudioInput(audioInput);
    }

    function getBookedUsers(classJoined) {
      $scope.bookedUsers = [];
      if (classJoined.bookedUsers) {
        $scope.numBookedUsers = Object.keys(classJoined.bookedUsers).length  

        for (var bookedUser in classJoined.bookedUsers) {
          if (bookedUser) {
            User.getUser({id: $scope.currentUser._id}, {userToGet: bookedUser}).$promise.then(function(data) {
              $scope.bookedUsers.push(data);  
            }).catch(function(err) {
              console.log(err);
            })
          }    
        }
      }
    }
    
  	$scope.minutesUntilClass = Math.round(((classTime - new Date().getTime())/1000)/60, 0);
    console.log($scope.minutesUntilClass)
  	// $scope.trainer = "Mendelson";
  	// $scope.joinClassActive = false;

  	var checkTimeInterval = $interval(function(){ checkTime() }, 20*1000)
    $scope.$on('$destroy', function() {
      $interval.cancel(checkTimeInterval);      
    });

  	function checkTime() {
  		$scope.minutesUntilClass = Math.round(((classToJoin.date - new Date().getTime())/1000)/60, 0);
  		console.log($scope.minutesUntilClass + " minutes until class begins");
  		// $scope.$apply();
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

    function setupVidAud() {
      var element = document.querySelector('#audioVideoSetup');
      var component = Video.hardwareSetup(element);
    }

    $scope.setToSee = function(pageToView) {
      $scope.overlay1 = false;
      $scope.overlay2 = false;
      $scope.overlay3 = false;
      switch (pageToView) {
        case 0: return $scope.overlay1 = true; break;
        case 1: return $scope.overlay2 = true; break;
        case 2: return $scope.overlay3 = true; break;
        default: break;
      }
    }

    $scope.setToSee2 = function(pageToView) {
      $scope.tab1 = false;
      $scope.tab2 = false;
      // $scope.tab3 = false;
      switch (pageToView) {
        case 0: return $scope.tab1 = true; break;
        case 1: return $scope.tab2 = true; break;
        // case 2: return $scope.tab3 = true; break;
        default: break;
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