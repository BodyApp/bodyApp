'use strict';

angular.module('bodyAppApp')
  .controller('ClassDetailsCtrl', function ($scope, $stateParams, $location, $rootScope, $window, Studios, $http, Auth, User, Schedule) {
    var currentUser = Auth.getCurrentUser()
    
    var studioId = $stateParams.studioId;
    $scope.classToCreate = {};
    $scope.minDate = new Date();
    Studios.setCurrentStudio(studioId);
    if (!studioId) studioId = 'body'
    var ref = firebase.database().ref().child('studios').child(studioId);

    var classId = $stateParams.classId;

    $scope.bookings = {};

    var tzName = jstz().timezone_name;
    $scope.timezone = moment().tz(tzName).format('z');

    // $scope.firstDayShown.formattedDate = $scope.getFormattedDateTime($scope.firstDayShown.dateTime)
    // console.log($scope.firstDayShown)

    // $scope.classTypes = {};
    // $scope.workouts = {};
    // $scope.instructors = {};
    // $scope.playlistsObject = {};
    $scope.numBookingsByClass = {};

    var daysInFuture = 0;
    var numDaysToShow = 7;

    $scope.showingNextWeek = false;

    var auth = firebase.auth();
    auth.onAuthStateChanged(function(user) {
      if (user) {
        getClassDetails(classId);
        getClassTypes();
        getWorkouts();
        getInstructors();
        getPlaylistObjects();
        getBookings(classId);
      } else {
        // console.log("User is logged out");
        if (currentUser.firebaseToken) {
          auth.signInWithCustomToken(currentUser.firebaseToken).then(function(user) {
            if (currentUser.role === "admin") console.log("Firebase user authentication succeeded!", user);
            getClassDetails(classId);
            getClassTypes();
            getWorkouts();
            getInstructors();
            getPlaylistObjects();
            getBookings(classId);
          }); 
        } else {
          console.log("User doesn't have a firebase token saved, should retrieve one.")
        }
      }
    })


    // ref.onAuth(function(authData) {
    //   if (authData) {
    //     // console.log("User is authenticated with fb ");
    //     getClassDetails(classId);
    //     getClassTypes();
    //     getWorkouts();
    //     getInstructors();
    //     getPlaylistObjects();
    //     getBookings(classId);
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
    //           getClassDetails(classId);
    //           getClassTypes();
			 //        getWorkouts();
			 //        getInstructors();
			 //        getPlaylistObjects();
			 //        getBookings(classId);
    //         }
    //       }); 
    //     } else {
    //       Auth.logout();
    //       $window.location.reload()
    //     }
    //   }
    // })

    function getClassDetails(classToGet) {
      ref.child('classes').child(classToGet).once('value', function(snapshot) {
        $scope.classDetails = snapshot.val();
        // console.log($scope.classDetails)
        if(!$scope.$$phase) $scope.$apply();
      })
    }

    // function getPlaylists() {
    //   ref.child('playlists').orderByChild("lastModified").once('value', function(snapshot) {
    //     $scope.playlists = [];
    //     snapshot.forEach(function(playlist) {
    //       $scope.playlists.unshift(playlist.val())
    //     })
    //     $scope.workoutToCreate = $scope.workoutToCreate || {};
    //     if (!$scope.workoutToCreate.playlist) $scope.workoutToCreate.playlist = $scope.playlists[0];
    //   })
    // }

    function getInstructors() {
    	$scope.instructors = Studios.getInstructors();
      if(!$scope.$$phase) $scope.$apply();

      if (!$scope.instructors) {
				ref.child('instructors').once('value', function(snapshot) {
	        $scope.instructors = snapshot.val();     	
	        if(!$scope.$$phase) $scope.$apply();
	      })
      }

      // ref.child('instructors').once('value', function(snapshot) {
      //   $scope.instructors = snapshot.val()
      //   // console.log($scope.instructors)
      //   $scope.workoutToCreate = $scope.workoutToCreate || {};
      //   if (!$scope.workoutToCreate.instructor) $scope.workoutToCreate.instructor = $scope.instructors[Object.keys($scope.instructors)[0]];
      // })
    }

    function getClassTypes() {
    	$scope.classTypes = Studios.getClassTypes();
      if(!$scope.$$phase) $scope.$apply();
      if (!$scope.classTypes) {
      	ref.child('classTypes').once('value', function(snapshot) {
          if (!snapshot.exists()) return;
	        $scope.classTypes = snapshot.val()
	        // console.log($scope.classTypes);
	        
	        // //Sets initial class type
	        // $scope.workoutToCreate = $scope.workoutToCreate || {};
	        // if (!$scope.workoutToCreate.classType) $scope.workoutToCreate.classType = $scope.classTypes[Object.keys($scope.classTypes)[0]];
	        // $scope.selectClassType($scope.workoutToCreate.classType) //Grab workouts
	        if(!$scope.$$phase) $scope.$apply();
	      })  	
      }
    }

    $scope.selectClassType = function(classType) {
      $scope.workoutOptions = {};
      ref.child('classTypes').child(classType).child('workoutsUsingClass').once('value', function(workoutList) {
        if (!workoutList.exists()) return;
	      workoutList.forEach(function(workout) {
	      	var prop = workout.key;
	        ref.child('workouts').child(prop).once('value', function(snapshot) {
	          if (!snapshot.exists()) return
	          $scope.workoutOptions[prop] = snapshot.val()
	        	if (!$scope.workoutOptions[$scope.classDetails.workout]) $scope.classDetails.workout = prop; //If change class type, automatically choses a workout.
	          if(!$scope.$$phase) $scope.$apply();
	        })
	      })
      })  
    }

    function checkIfExists(dateTime, workoutToSave) {
      ref.child('classes').child(dateTime).once('value', function(snapshot) {
        if (snapshot.exists()) {
          checkIfExists(dateTime+1, workoutToSave);  //Recursive
        } else {
          ref.child('classes').child(dateTime).update(workoutToSave, function(err) {
            if (err) return console.log(err);
          })      
        }
      })
    }

    $scope.saveWorkout = function(workoutToCreate) {
      var workoutToSave = {};
      workoutToSave.classType = workoutToCreate.classType.id;
      workoutToSave.dateTime = new Date(workoutToCreate.dateTime).getTime();
      workoutToSave.instructor = workoutToCreate.instructor._id;
      workoutToSave.playlist = workoutToCreate.playlist.id;
      workoutToSave.workout = workoutToCreate.workout.id;
      workoutToSave.spots = 12;
      console.log(workoutToSave)

      checkIfExists(workoutToSave.dateTime, workoutToSave); 
    }

    function getWorkouts() {
    	$scope.workouts = Studios.getWorkouts();
      if(!$scope.$$phase) $scope.$apply();

      if (!$scope.workouts) {
      	ref.child('workouts').once('value', function(snapshot) {
          if (!snapshot.exists()) return;
	        $scope.workouts = snapshot.val()
	        if(!$scope.$$phase) $scope.$apply();
	      })	
      }
    }

    function getPlaylistObjects() {
    	$scope.playlistObjects = Studios.getPlaylistObjects();
      if(!$scope.$$phase) $scope.$apply();
      
      if (!$scope.playlistObjects) {
	      ref.child('playlists').once('value', function(snapshot) {
          if (!snapshot.exists()) return;
	        $scope.playlistObjects = snapshot.val();
	        console.log($scope.playlistObjects)
	        if(!$scope.$$phase) $scope.$apply();
	      })
			}
    }

    function getBookings(dateTime) {
      // if ($scope.numBookingsByClass[dateTime]) return $scope.numBookingsByClass[dateTime];
      ref.child('bookings').child(dateTime).once('value', function(snapshot) {
        if (!snapshot.exists()) return;
        if (snapshot.exists()) $scope.bookings = snapshot.val();
        if(!$scope.$$phase) $scope.$apply();
        return $scope.bookings;
      })
    }

    $scope.deleteClass = function() {
    	if ($scope.bookings && Object.keys($scope.bookings).length > 0) return alert("There are users signed up for this class!")
    	ref.child('classes').child(classId).remove(function(err) {
    		if (err) return console.log(err)
  			console.log("Class successfully deleted.")
  			$scope.returnToSchedule();
    	})
    }

    $scope.returnToSchedule = function() {
    	if(!$rootScope.$$phase) {
	    	$rootScope.$apply(function() {
	        $location.path('/studios/' + studioId + '/editschedule')
	        console.log($location.path());
	      });
	    } else {
	    	$location.path('/studios/' + studioId + '/editschedule')
	    }
    }

    $scope.enterEditMode = function() {
    	$scope.editing = true;
    	$scope.selectClassType($scope.classDetails.classType)
    }

    $scope.updateClass = function(classToUpdate) {
    	$scope.editing = false;
    	console.log(classToUpdate);
    	ref.child('classes').child(classId).update(classToUpdate, function(err) {
    		if (err) return console.log(err)
    		console.log("Successfully updated class.")
    	})
    }

    $scope.joinClass = function(classToJoin) {
      Schedule.setClassUserJustJoined(studioId, classToJoin);
      $location.path('/studios/' + studioId + '/classstarting')
    }

    $scope.getNumOf = function(objectToCheck) {
      console.log(objectToCheck)
      return Object.keys(objectToCheck).length
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

    $scope.keyPressed = function(key, enteredSoFar) {
      if (key.keyCode === 13) $scope.searchForUser(enteredSoFar)
    }

    $scope.scrollTop = function() {
      window.scrollTo(0, 0);
    }

  });
