'use strict';

angular.module('bodyAppApp')
  .controller('WorkoutsCtrl', function ($scope, $stateParams, $q, $window, $state, Studios, Auth, SoundCloudLogin, SoundCloudAPI) {
  	var currentUser = Auth.getCurrentUser()
    if (currentUser.$promise) {
      currentUser.$promise.then(function(data) {
        if (!Studios.isAdmin() && data.role != 'admin') $state.go('storefront');  
      })
    } else if (currentUser.role) {
      if (!Studios.isAdmin() && currentUser.role != 'admin') $state.go('storefront');  
    }
    var ref;
    var studioId = $stateParams.studioId;
    $scope.workoutToCreate = {};
    Studios.setCurrentStudio(studioId);
    if (studioId) {
      ref = new Firebase("https://bodyapp.firebaseio.com/studios").child(studioId);
    } else {
      // $location.path('/ralabala/admin')
      ref = new Firebase("https://bodyapp.firebaseio.com/studios").child("ralabala");
    }
    var classTypes;

    ref.onAuth(function(authData) {
      if (authData) {
        console.log("User is authenticated with fb ");
        getClassTypes()
        loadWorkouts()
      } else {
        console.log("User is logged out");
        if (currentUser.firebaseToken) {
          ref.authWithCustomToken(currentUser.firebaseToken, function(error, authData) {
            if (error) {
              Auth.logout();
              $window.location.reload()
              console.log("Firebase currentUser authentication failed", error);
            } else {
              if (currentUser.role === "admin") console.log("Firebase currentUser authentication succeeded!", authData);
              getClassTypes()
              loadWorkouts()
            }
          }); 
        } else {
          Auth.logout();
          $window.location.reload()
        }
      }
    })

    function loadWorkouts() {
    	ref.child('workouts').on('value', function(snapshot) {
        if (!snapshot.exists()) return;
    		$scope.workouts = []
	      snapshot.forEach(function(classType) {
	        $scope.workouts.push(classType.val());
	      })
		    if(!$scope.$$phase) $scope.$apply();
    	})
    }

    $scope.addSet = function(setToAdd) {
    	console.log(setToAdd)
    	for (var i = 0; i < setToAdd.exercises.length; i++) {
    		delete setToAdd.exercises[i].$$hashKey
    	}
    	$scope.showAddWorkout.sets = $scope.showAddWorkout.sets || [];
    	$scope.showAddWorkout.sets.push(setToAdd)
    	$scope.showAddSet = false;
    }

    $scope.initAddExercises = function() {
    	$scope.showAddSet = $scope.showAddSet || {};
    	$scope.showAddSet.exercises = $scope.showAddSet.exercises || []; 
    	if ($scope.showAddSet.exercises.length < 1) $scope.showAddSet.exercises.push({name: ''});
    }

    $scope.scrollTop = function() {
      window.scrollTo(0, 0);
    }

    function getClassTypes() {
    	classTypes = [];
    	ref.child('classTypes').once('value', function(snapshot) {
        if (!snapshot.exists()) return;
    		snapshot.forEach(function(classType) {
    			classTypes.push(classType.val())
    		})
    	})
    }

    $scope.loadClassTypes = function($query) {
			return classTypes;
    }

    $scope.addExercise = function() {
      if ($scope.showAddSet.exercises.length < 6) $scope.showAddSet.exercises.push({name: ''})
    }

    $scope.saveWorkout = function(workoutToSave) {
    	console.log(workoutToSave)
    	workoutToSave.created = new Date().getTime();
    	workoutToSave.updated = new Date().getTime();
    	workoutToSave.createdBy = currentUser._id;
    	var pushedWorkout = ref.child('workouts').push(workoutToSave, function(err) {
    		if (err) return console.log(err);
    		ref.child('workouts').child(pushedWorkout.key()).update({id: pushedWorkout.key()}, function(err) {
    			if (err) return console.log(err);
    			console.log("workout successfully created")
					$scope.showAddWorkout = false;
		      if(!$scope.$$phase) $scope.$apply();
    			for (var i = 0; i < workoutToSave.classTypes.length; i++) { //Saves workout within the class types selected
    				ref.child('classTypes').child(workoutToSave.classTypes[i].id).child('workoutsUsingClass').child(pushedWorkout.key()).set({dateSaved: new Date().getTime()}, function(err) {
    					if (err) return console.log(err)
    				})
    			}
    		})
    	})
    }

    $scope.editWorkout = function(workoutToEdit) {
    	$scope.editing = true;
    	console.log(workoutToEdit);
    	$scope.showAddWorkout = workoutToEdit;
    	$scope.scrollTop()
      if(!$scope.$$phase) $scope.$apply();  	
    }


    $scope.updateWorkout = function(workoutToUpdate) {
    	workoutToUpdate.updated = new Date().getTime();
    	workoutToUpdate.updatedBy = currentUser._id;
    	ref.child('workouts').child(workoutToUpdate.id).update(workoutToUpdate, function(err) {
    		if (err) return console.log(err);
    		$scope.showAddWorkout = false;
    		$scope.editing = false;
	      if(!$scope.$$phase) $scope.$apply(); 
	      for (var i = 0; i < workoutToUpdate.classTypes.length; i++) { //Saves workout within the class types selected
  				ref.child('classTypes').child(workoutToUpdate.classTypes[i].id).child('workoutsUsingClass').child(workoutToUpdate.id).set({dateSaved: new Date().getTime()}, function(err) {
  					if (err) return console.log(err)
  				})
  			} 	    		
    	})
    	// var pushedWorkout = ref.child('workouts').push(workoutToSave, function(err) {
    	// 	if (err) return console.log(err);
    	// 	ref.child('workouts').child(pushedWorkout.key()).update({id: pushedWorkout.key()}, function(err) {
    	// 		if (err) return console.log(err);
    	// 		console.log("workout successfully created")
					// $scope.showAddWorkout = false;
					// $scope.editing = false;
		   //    if(!$scope.$$phase) $scope.$apply();
    	// 		for (var i = 0; i < workoutToSave.classTypes.length; i++) { //Saves workout within the class types selected
    	// 			ref.child('classTypes').child(workoutToSave.classTypes[i].id).child('workoutsUsingClass').child(pushedWorkout.key()).set({dateSaved: new Date().getTime()}, function(err) {
    	// 				if (err) return console.log(err)
    	// 			})
    	// 		}
    	// 	})
    	// })
    }

  });