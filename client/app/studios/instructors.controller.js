'use strict';

angular.module('bodyAppApp')
  .controller('InstructorsCtrl', function ($scope, $state, $stateParams, $window, Studios, $http, Auth, User) {
    var currentUser = Auth.getCurrentUser()
    var studioId = $stateParams.studioId;
    if (currentUser.$promise) {
      currentUser.$promise.then(function(data) {
        if (!Studios.isAdmin() && data.role != 'admin') $state.go('storefront', { "studioId": studioId });
      })
    } else if (currentUser.role) {
      if (!Studios.isAdmin() && currentUser.role != 'admin') $state.go('storefront', { "studioId": studioId });
    }
    $scope.classToCreate = {};
    
    
    if (!studioId) studioId = 'ralabala'
    Studios.setCurrentStudio(studioId);
    var ref = firebase.database().ref().child('studios').child(studioId);
    var auth = firebase.auth();
    auth.onAuthStateChanged(function(user) {
      if (user) {
        getInstructors()
      } else {
        // console.log("User is logged out");
        if (currentUser.firebaseToken) {
          auth.signInWithCustomToken(currentUser.firebaseToken).then(function(user) {
            if (currentUser.role === "admin") console.log("Firebase user authentication succeeded!", user);
            getInstructors()
          }); 
        } else {
          console.log("User doesn't have a firebase token saved, should retrieve one.")
        }
      }
    })

    // ref.onAuth(function(authData) {
    //   if (authData) {
    //     // console.log("User is authenticated with fb ");
    //     getInstructors()
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
    //           getInstructors()
    //         }
    //       }); 
    //     } else {
    //       Auth.logout();
    //       $window.location.reload()
    //     }
    //   }
    // })

    function getInstructors() {
      ref.child('instructors').on('value', function(snapshot) {
        if (!snapshot.exists()) return;
        $scope.instructorsPulled = snapshot.val()
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
          $scope.returnedInstructor.permissions = "Instructor";
          $scope.noUserFound = false;
        } else {
          $scope.noUserFound = true;
        }
      })
    }

    $scope.saveInstructor = function(instructorToSave) {
      console.log(instructorToSave)
      // console.log(userInfo);
      if (instructorToSave.$promise) delete instructorToSave.$promise;
      if (instructorToSave.$resolved) delete instructorToSave.$resolved;

      // for (var prop in userInfo) {
      //   if (userInfo.hasOwnProperty(prop)) instructorToSave[prop] = userInfo[prop];
      // }

      // instructorToSave.userInfo = userInfo;
      // console.log(instructorToSave)

      // ref.child('instructors').child(userInfo._id).update(instructorToSave)
      ref.child('instructors').child(instructorToSave._id).update(instructorToSave, function(err) {
        if (err) return console.log(err)
        console.log("Saved / Updated instructor")
        $scope.returnedInstructor = false;
        $scope.showAddInstructor = false;
        $scope.showEditInstructor = false;
        if(!$scope.$$phase) $scope.$apply();
        if (instructorToSave.permissions === "Studio Admin") {
          ref.child('admins').child(instructorToSave._id).set({"isInstructor": true}, function(err) {
            if (err) return console.log(err)
            console.log("Instructor updated as admin")
          })
        }
      })
    }

    $scope.editInstructor = function(toEdit) {
      $scope.showEditInstructor = true;
      $scope.returnedInstructor = toEdit;
    }

    $scope.setupInstructor = function() {
      $scope.showAddInstructor = true; 
      $scope.showEditInstructor = false;
      $scope.scrollTop()
    }

    $scope.keyPressed = function(key, enteredSoFar) {
      if (key.keyCode === 13) $scope.searchForUser(enteredSoFar)
    }

    $scope.scrollTop = function() {
      window.scrollTo(0, 0);
    }

  });
