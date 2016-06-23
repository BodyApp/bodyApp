'use strict';

angular.module('bodyAppApp')
  .controller('InstructorsCtrl', function ($scope, $state, $stateParams, $window, $rootScope, Studios, $http, Auth, User) {
    var currentUser = Auth.getCurrentUser()
    var studioId = $stateParams.studioId;
    
    $rootScope.adminOf = $rootScope.adminOf || {};
    if (currentUser.$promise) {
      currentUser.$promise.then(function(data) {
        if (!$rootScope.adminOf[studioId] && data.role != 'admin') return $state.go('storefront', { "studioId": studioId });
      })
    } else if (currentUser.role) {
      if (!$rootScope.adminOf[studioId] && currentUser.role != 'admin') return $state.go('storefront', { "studioId": studioId });
    }

    $scope.classToCreate = {};
        
    // if (!studioId) studioId = 'body'
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
        if (!snapshot.exists()) {
          $scope.instructorsPulled = false;
          if(!$scope.$$phase) $scope.$apply();
          return;
        }
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
      // console.log(userInfo);
      if (instructorToSave.$promise) delete instructorToSave.$promise;
      if (instructorToSave.$resolved) delete instructorToSave.$resolved;

      instructorToSave.trainerNumRatings = 0;
      instructorToSave.trainerRating = 5;

      // for (var prop in userInfo) {
      //   if (userInfo.hasOwnProperty(prop)) instructorToSave[prop] = userInfo[prop];
      // }

      // instructorToSave.userInfo = userInfo;
      // console.log(instructorToSave)

      // ref.child('instructors').child(userInfo._id).update(instructorToSave)
      ref.child('instructors').child(instructorToSave._id).update(instructorToSave, function(err) {
        if (err) return console.log(err)
        console.log("Saved / Updated instructor")
        ref.child('toSetup').child('instructors').remove(function(err) {
          if (err) console.log(err)
        })
        $scope.returnedInstructor = false;
        $scope.showAddInstructor = false;
        $scope.showEditInstructor = false;
        if(!$scope.$$phase) $scope.$apply();
        if (instructorToSave.permissions === "Studio Admin") {
          ref.child('admins').child(instructorToSave._id).set({"isInstructor": true, facebookId: instructorToSave.facebookId}, function(err) {
            if (err) return console.log(err)
            console.log("Instructor updated as admin")
            var toSet = {};
            toSet[studioId] = true;
            firebase.database().ref().child('fbUsers').child(instructorToSave.facebookId).child('studiosAdmin').update(toSet, function(err) {
              if (err) return console.log("Error setting studiosAdmin in fbUsers object")
              console.log("Set studiosAdmin in fbUsers object");
            })
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

    $scope.deleteById = function(idToDelete) {
      var rightNow = new Date().getTime();
      ref.child('classes').orderByChild('instructor').equalTo(idToDelete).once('value', function(snapshot) {
        if (!snapshot.exists()) {
            console.log("No classes found for specified class. Safe to delete.")
            return ref.child('instructors').child(idToDelete).remove(function(err) {
              if (err) return console.log(err)
              ref.child('admins').child(idToDelete).remove(function(err) {
                if (err) return console.log(err)
                console.log("Removed admin")
              })
              return console.log("Successfully removed instructor since they aren't scheduled to teach any future classes.")
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
        if (futureClasses.length > 0) return alert("Instructor is schedule to teach " + futureClasses.length + " classes.  Can't delete instructor without first editing or deleting those classes.")
        ref.child('instructors').child(idToDelete).remove(function(err) {
          if (err) return console.log(err)
            ref.child('admins').child(idToDelete).remove(function(err) {
              if (err) return console.log(err)
              console.log("Removed admin")
            })
          console.log("Successfully removed instructor since they aren't scheduled to teach any future classes.")
        })
      })
    }

    $scope.keyPressed = function(key, enteredSoFar) {
      if (key.keyCode === 13) $scope.searchForUser(enteredSoFar)
    }

    $scope.scrollTop = function() {
      window.scrollTo(0, 0);
    }

  });
