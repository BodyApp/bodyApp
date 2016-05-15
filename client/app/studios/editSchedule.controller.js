angular.module('bodyAppApp')
  .controller('EditScheduleCtrl', function ($scope, $stateParams, Studios, $http, Auth, User) {
    var currentUser = Auth.getCurrentUser()
    var ref;
    var studioId = $stateParams.studioId;
    $scope.classToCreate = {};
    $scope.minDate = new Date();
    Studios.setCurrentStudio(studioId);
    if (studioId) {
      ref = new Firebase("https://bodyapp.firebaseio.com/studios").child(studioId);
    } else {
      // $location.path('/ralabala/admin')
      ref = new Firebase("https://bodyapp.firebaseio.com/studios").child("ralabala");
    }

    var tzName = jstz().timezone_name;
    $scope.timezone = moment().tz(tzName).format('z');

    ref.onAuth(function(authData) {
      if (authData) {
        console.log("User is authenticated with fb ");
        getClassTypes();
        getInstructors();
        getPlaylists();
      } else {
        console.log("User is logged out");
        if (user.firebaseToken) {
          ref.authWithCustomToken(user.firebaseToken, function(error, authData) {
            if (error) {
              Auth.logout();
              $window.location.reload()
              console.log("Firebase user authentication failed", error);
            } else {
              if (user.role === "admin") console.log("Firebase user authentication succeeded!", authData);
              getClassTypes();
              getInstructors();
              getPlaylists();
            }
          }); 
        } else {
          Auth.logout();
          $window.location.reload()
        }
      }
    })

    function getPlaylists() {
      ref.child('playlists').orderByChild("lastModified").once('value', function(snapshot) {
        $scope.playlists = [];
        snapshot.forEach(function(playlist) {
          $scope.playlists.unshift(playlist.val())
        })
        $scope.workoutToCreate = $scope.workoutToCreate || {};
        if (!$scope.workoutToCreate.playlist) $scope.workoutToCreate.playlist = $scope.playlists[0];
      })
    }

    function getInstructors() {
      ref.child('instructors').once('value', function(snapshot) {
        $scope.instructors = snapshot.val()
        console.log($scope.instructors)
        $scope.workoutToCreate = $scope.workoutToCreate || {};
        if (!$scope.workoutToCreate.instructor) $scope.workoutToCreate.instructor = $scope.instructors[Object.keys($scope.instructors)[0]];
      })
    }

    function getClassTypes() {
      ref.child('classTypes').once('value', function(snapshot) {
        $scope.classTypes = snapshot.val()
        
        //Sets initial class type
        $scope.workoutToCreate = $scope.workoutToCreate || {};
        if (!$scope.workoutToCreate.classType) $scope.workoutToCreate.classType = $scope.classTypes[Object.keys($scope.classTypes)[0]];
        $scope.selectClassType($scope.workoutToCreate.classType) //Grab workouts
        if(!$scope.$$phase) $scope.$apply();
      })  
    }

    $scope.selectClassType = function(classType) {
      $scope.workoutOptions = {};
      for (var prop in classType.workoutsUsingClass) {
        ref.child('workouts').child(prop).once('value', function(snapshot) {
          if (!snapshot.exists()) return
          $scope.workoutOptions[prop] = snapshot.val() 
          if (!$scope.workoutToCreate.workout) $scope.workoutToCreate.workout = $scope.workoutOptions[prop] //Initiates workout
          if(!$scope.$$phase) $scope.$apply();
        })
      }  
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

    

    $scope.keyPressed = function(key, enteredSoFar) {
      if (key.keyCode === 13) $scope.searchForUser(enteredSoFar)
    }

    $scope.scrollTop = function() {
      window.scrollTo(0, 0);
    }

  });
