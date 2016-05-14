'use strict';

angular.module('bodyAppApp')
  .controller('InstructorsCtrl', function ($scope, $stateParams, Studios, $http, Auth, User) {
    var currentUser = Auth.getCurrentUser()
    var ref;
    var studioId = $stateParams.studioId;
    $scope.classToCreate = {};
    Studios.setCurrentStudio(studioId);
    if (studioId) {
      ref = new Firebase("https://bodyapp.firebaseio.com/studios").child(studioId);
    } else {
      // $location.path('/ralabala/admin')
      ref = new Firebase("https://bodyapp.firebaseio.com/studios").child("ralabala");
    }

    ref.onAuth(function(authData) {
      if (authData) {
        console.log("User is authenticated with fb ");
        getTrainers()
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
              getTrainers()
            }
          }); 
        } else {
          Auth.logout();
          $window.location.reload()
        }
      }
    })

    function getTrainers() {
      ref.child('trainers').on('value', function(snapshot) {
        $scope.trainersPulled = snapshot.val()
        if(!$scope.$$phase) $scope.$apply();
      })  
    }

    $scope.searchForUser = function(userToSearchFor) {
      console.log(userToSearchFor)
      User.getInstructorByEmail({
        id: currentUser._id
      }, {
        email: userToSearchFor
      }).$promise.then(function(instructor) {
        if (instructor._id) {
          $scope.returnedInstructor = instructor;
          $scope.noUserFound = false;
        } else {
          $scope.noUserFound = true;
        }
      })
    }

    $scope.saveInstructor = function(instructorToSave) {
      console.log(instructorToSave)
      // console.log(userInfo);
      // delete userInfo.$promise
      // delete userInfo.$resolved

      // for (var prop in userInfo) {
      //   if (userInfo.hasOwnProperty(prop)) instructorToSave[prop] = userInfo[prop];
      // }

      // instructorToSave.userInfo = userInfo;
      // console.log(instructorToSave)

      // ref.child('trainers').child(userInfo._id).update(instructorToSave)
      ref.child('trainers').child(instructorToSave._id).update(instructorToSave, function(err) {
        console.log("Saved / Updated instructor")
        $scope.returnedInstructor = false;
        $scope.showAddInstructor = false;
        $scope.showEditInstructor = false;
        if(!$scope.$$phase) $scope.$apply();
      })
    }

    $scope.editInstructor = function(toEdit) {
      $scope.showEditInstructor = true;
      $scope.returnedInstructor = toEdit;
    }

    $scope.keyPressed = function(key, enteredSoFar) {
      if (key.keyCode === 13) $scope.searchForUser(enteredSoFar)
    }

    $scope.scrollTop = function() {
      window.scrollTo(0, 0);
    }

  });
