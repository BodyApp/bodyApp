'use strict';

angular.module('bodyAppApp')
  .controller('WorkoutsCtrl', function ($scope, $stateParams, $q, Studios, Auth, SoundCloudLogin, SoundCloudAPI) {
  	var currentUser = Auth.getCurrentUser()
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
              getClassTypes()
            }
          }); 
        } else {
          Auth.logout();
          $window.location.reload()
        }
      }
    })

    $scope.scrollTop = function() {
      window.scrollTo(0, 0);
    }

    function getClassTypes() {
    	classTypes = [];
    	ref.child('classTypes').once('value', function(snapshot) {
    		snapshot.forEach(function(classType) {
    			classTypes.push(classType.val())
    		})
    	})
    }

    $scope.loadClassTypes = function($query) {
			return classTypes;
    }

    $scope.saveWorkout = function(workoutToSave) {
    	console.log(workoutToSave)
    }

  });