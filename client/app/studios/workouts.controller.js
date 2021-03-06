'use strict';

angular.module('bodyAppApp')
  .controller('WorkoutsCtrl', function ($scope, $stateParams, $cookies, $q, $window, $state, $rootScope, Studios, Auth, SoundCloudLogin, SoundCloudAPI) {
  	var currentUser = Auth.getCurrentUser()
    var studioId = $stateParams.studioId;

    $scope.showWorkoutsAlert = $cookies.get('showWorkoutsAlert')
    
    $rootScope.adminOf = $rootScope.adminOf || {};
    if (currentUser.$promise) {
      currentUser.$promise.then(function(data) {
        if (!$rootScope.adminOf[studioId] && data.role != 'admin') return $state.go('storefront', { "studioId": studioId });
      })
    } else if (currentUser.role) {
      if (!$rootScope.adminOf[studioId] && currentUser.role != 'admin') return $state.go('storefront', { "studioId": studioId });
    }
    
    $scope.workoutToCreate = {};
    Intercom('trackEvent', 'navigatedToWorkouts', { studio: studioId });
    
    // if (!studioId) studioId = 'body'
    Studios.setCurrentStudio(studioId);
    var ref = firebase.database().ref().child('studios').child(studioId);
    var auth = firebase.auth();
    auth.onAuthStateChanged(function(user) {
      if (user) {
        getClassTypes();
        // loadWorkouts();
      } else {
        if (currentUser.firebaseToken) {
          auth.signInWithCustomToken(currentUser.firebaseToken).then(function(user) {
            if (currentUser.role === "admin") console.log("Firebase user authentication succeeded!", user);
            getClassTypes();
            // loadWorkouts();
          }); 
        } else {
          console.log("User doesn't have a firebase token saved, should retrieve one.")
        }
      }
    })

    // ref.onAuth(function(authData) {
    //   if (authData) {
    //     // console.log("User is authenticated with fb ");
    //     getClassTypes()
    //     loadWorkouts()
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
    //           getClassTypes()
    //           loadWorkouts()
    //         }
    //       }); 
    //     } else {
    //       Auth.logout();
    //       $window.location.reload()
    //     }
    //   }
    // })

    function loadWorkouts() {
    	ref.child('workouts').on('value', function(snapshot) {
            if (!snapshot.exists()) {
                $scope.workouts = [];
                $scope.showAddWorkout = {};
                if(!$scope.$$phase) $scope.$apply();
                return;
            }
    	   $scope.workouts = []
	       snapshot.forEach(function(workout) {
            var workoutRetrieved = workout.val()
            var classTypeArray = [];
            for (var prop in workoutRetrieved.classTypes) {
                classTypeArray.push($scope.classTypeObjects[prop])
            }

            workoutRetrieved.classTypes = classTypeArray
            console.log(workoutRetrieved)
            
	        $scope.workouts.push(workoutRetrieved);
            if(!$scope.$$phase) $scope.$apply();
	      })
		    
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
    	$scope.classTypes = [];
    	ref.child('classTypes').once('value', function(snapshot) {
            if (!snapshot.exists()) return loadWorkouts();
            
            $scope.classTypeObjects = snapshot.val()
            loadWorkouts();

            if(!$scope.$$phase) $scope.$apply();
    		snapshot.forEach(function(classType) {
    			$scope.classTypes.push(classType.val())
                if(!$scope.$$phase) $scope.$apply();
    		})
    	})
    }

    $scope.addExercise = function() {
      if ($scope.showAddSet.exercises.length < 6) $scope.showAddSet.exercises.push({name: ''})
    }

    function formatClassTypesForTags(workoutId) {

    }

    $scope.saveWorkout = function(workoutToSave) {
    	console.log(workoutToSave)
    	workoutToSave.created = new Date().getTime();
    	workoutToSave.updated = new Date().getTime();
    	workoutToSave.createdBy = currentUser._id;

        if (!workoutToSave.title) return $scope.noTitle = true;
        if (!workoutToSave.classTypes) return $scope.noClassTypes = true;

        var classTypesObject = {};
        for (var i = 0; i < workoutToSave.classTypes.length; i++) {
            classTypesObject[workoutToSave.classTypes[i].id] = {dateSaved: new Date().getTime()}
        }

        workoutToSave.classTypes = classTypesObject;
        $scope.showAddWorkout = false;

    	var pushedWorkout = ref.child('workouts').push(workoutToSave, function(err) {
    		if (err) return console.log(err);
    		ref.child('workouts').child(pushedWorkout.key).update({id: pushedWorkout.key}, function(err) {
    			if (err) return console.log(err);
    			console.log("workout successfully created")
                Intercom('trackEvent', "workoutCreated", {workout: pushedWorkout.key})
				$scope.showAddWorkout = false;
                ref.child('toSetup').child('workouts').remove(function(err) {
                  if (err) console.log(err)
                })
		      if(!$scope.$$phase) $scope.$apply();
                if (!workoutToSave.classTypes) return;
                console.log(workoutToSave.classTypes)
    			for (var classType in workoutToSave.classTypes) { //Saves workout within the class types selected
    				var classTypeToSave = ref.child('classTypes').child(classType).child('workoutsUsingClass').child(pushedWorkout.key).set({dateSaved: new Date().getTime()}, function(err) {
    					if (err) return console.log(err)
                        console.log("Saved workout " + pushedWorkout.key + " to classType.")
    				})
    			}
    		})
    	})
    }

    $scope.editWorkout = function(workoutToEdit) {
    	$scope.editing = true;
    	$scope.showAddWorkout = workoutToEdit;
    	$scope.scrollTop()
      if(!$scope.$$phase) $scope.$apply();  	
    }

    $scope.editSet = function(setIdToEdit) {
        $scope.showAddSet = $scope.showAddWorkout.sets[setIdToEdit];
        $scope.editingSet = true;
    }

    $scope.deleteSet = function(setIdToDelete) {
        delete $scope.showAddWorkout.sets[setIdToDelete]
        ref.child('workouts').child($scope.showAddWorkout.id).update($scope.showAddWorkout, function(err) {})
    }

    $scope.updateSet = function(setToUpdate) {
        $scope.editingSet = false;
        $scope.showAddSet = false;
        ref.child('workouts').child($scope.showAddWorkout.id).update($scope.showAddWorkout, function(err) {
        })
    }

    $scope.updateWorkout = function(workoutToUpdate) {
    	workoutToUpdate.updated = new Date().getTime();
    	workoutToUpdate.updatedBy = currentUser._id;

        $scope.editingSet = false;

        var classTypesObject = {};
        for (var i = 0; i < workoutToUpdate.classTypes.length; i++) {
            classTypesObject[workoutToUpdate.classTypes[i].id] = {dateSaved: new Date().getTime()}
        }

        workoutToUpdate.classTypes = classTypesObject;
        $scope.showAddWorkout = false;

    	ref.child('workouts').child(workoutToUpdate.id).update(workoutToUpdate, function(err) {
    		if (err) return console.log(err);
    		$scope.showAddWorkout = false;
    		$scope.editing = false;
	      if(!$scope.$$phase) $scope.$apply();
          if (!workoutToUpdate.classTypes) return;
          console.log(workoutToUpdate.classTypes)
	      for (var classType in workoutToUpdate.classTypes) { //Saves workout within the class types selected
  				ref.child('classTypes').child(classType).child('workoutsUsingClass').child(workoutToUpdate.id).set({dateSaved: new Date().getTime()}, function(err) {
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

    $scope.closeWorkoutAlertPushed = function() {
      $cookies.remove('showWorkoutsAlert')
      $scope.showWorkoutsAlert = false;
    }

    $scope.removeErrorMessage = function() {
        $scope.noClassTypes = false;
          if(!$scope.$$phase) $scope.$apply();      
          return true;

    }

    $scope.deleteById = function(workout) {
        var idToDelete = workout.id
      var rightNow = new Date().getTime();
      ref.child('classes').orderByChild('workout').equalTo(idToDelete).once('value', function(snapshot) {
        if (!snapshot.exists()) {
            console.log("No classes found for specified workout. Safe to delete.")
            return ref.child('workouts').child(idToDelete).remove(function(err) {
              if (err) return console.log(err)
              console.log("Successfully removed workout type since there were no workouts or future classes based on it.")
                for (var i = 0; i < workout.classTypes.length; i++) {
                    var prop = workout.classTypes[i]
                    ref.child('classTypes').child(prop.id).child('workoutsUsingClass').child(idToDelete).remove(function(err) {
                        if (err) return console.log(err)
                        return console.log("Removed workout from classType " + prop.id)
                    })
                } 
            })
        }
        var futureClasses = [];

        snapshot.forEach(function(classPulled) {
          if (classPulled.val().dateTime > rightNow) {
            futureClasses.push(classPulled.val())
            // console.log(classPulled.val());
            // ref.child('bookings').child(classPulled.val().dateTime).once('value', function(snapshot) {
            //   if (!snapshot.exists()) {

            //   }
            // })
          }
        })
        if (futureClasses.length > 0) return alert("There are " + futureClasses.length + " classes coming up that use this workout type.  Can't delete without first deleting those classes.")
        ref.child('workouts').child(idToDelete).remove(function(err) {
          if (err) return console.log(err)
          console.log("Successfully removed workout type since there aren't any scheduled classes based on it.")
          for (var i = 0; i < workout.classTypes.length; i++) {
            var prop = workout.classTypes[i]
                ref.child('classTypes').child(prop.id).child('workoutsUsingClass').child(idToDelete).remove(function(err) {
                    if (err) return console.log(err)
                    return console.log("Removed workout from classType " + prop.id)
                })
            } 
        })
      })
    }
  });