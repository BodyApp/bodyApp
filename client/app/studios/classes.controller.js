'use strict';

angular.module('bodyAppApp')
  .controller('ClassesCtrl', function ($scope, $stateParams, $state, $window, $rootScope, $cookies, Studios, $http, Auth) {
    var currentUser = Auth.getCurrentUser()
    var studioId = $stateParams.studioId;

    $scope.showClassTypesAlert = $cookies.get('showClassTypesAlert')

    $rootScope.adminOf = $rootScope.adminOf || {};
    if (currentUser.$promise) {
      currentUser.$promise.then(function(data) {
        if (!$rootScope.adminOf[studioId] && data.role != 'admin') return $state.go('storefront', { "studioId": studioId });
      })
    } else if (currentUser.role) {
      if (!$rootScope.adminOf[studioId] && currentUser.role != 'admin') return $state.go('storefront', { "studioId": studioId });
    }
    // if (!Studios.isAdmin() && currentUser.role != 'admin') $state.go('storefront');
    // var ref;
    
    $scope.classToCreate = {};
    Studios.setCurrentStudio(studioId);
    $scope.maxDescriptionLength = 500;
    $scope.maxParticipantsOptions = [1,2,3,4,5,6,7,8,9,10,11,12]

    // if (!studioId) studioId = 'body'
    var ref = firebase.database().ref().child('studios').child(studioId);
    var auth = firebase.auth();
    auth.onAuthStateChanged(function(user) {
      if (user) {
        getClassTypes();
        Intercom('trackEvent', 'navigatedToEditSchedule', { studio: studioId });
      } else {
        // console.log("User is logged out");
        if (currentUser.firebaseToken) {
          auth.signInWithCustomToken(currentUser.firebaseToken).then(function(user) {
            if (currentUser.role === "admin") console.log("Firebase user authentication succeeded!", user);
            getClassTypes();
            Intercom('trackEvent', 'navigatedToClassTypes', { studio: studioId });
          }); 
        } else {
          console.log("User doesn't have a firebase token saved, should retrieve one.")
        }
      }
    })

    // ref.onAuth(function(authData) {
    //   if (authData) {
    //     // console.log("User is authenticated with fb ");
    //     getClassTypes();
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
    //           getClassTypes();
    //         }
    //       }); 
    //     } else {
    //       Auth.logout();
    //       $window.location.reload()
    //     }
    //   }
    // })

    // $scope.tags = [
    //   { name: "Brazil", flag: "Brazil.png" },
    //   { name: "Italy", flag: "Italy.png" },
    //   { name: "Spain", flag: "Spain.png" },
    //   { name: "Germany", flag: "Germany.png" },
    // ];
    function getClassTypes() {
      ref.child('classTypes').orderByChild('updated').on('value', function(snapshot) {
        if (!snapshot.exists()) {
          $scope.savedClassTypes = false;
          $scope.showAddClass = true;
          if(!$scope.$$phase) $scope.$apply();
          return;
        }
        $scope.savedClassTypes = snapshot.val()
        if(!$scope.$$phase) $scope.$apply();
        // snapshot.forEach(function(classType) {
        //   $scope.savedClassTypes.push(classType.val());
        //   // console.log(classType.val().updated)
        //   if(!$scope.$$phase) $scope.$apply();
        // })
        // $scope.savedClassTypes = snapshot.val()
        // console.log($scope.savedClassTypes)
      })  
    }
    
    $scope.saveClassType = function(classToSave) {
      if (!classToSave.name) return $scope.missingName = true;
      // if (!classToSave.equipment) return $scope.missingEquipment = true
      if (!classToSave.classDescription) return $scope.missingDescription = true;
      if (classToSave.classDescription.length > $scope.maxDescriptionLength) return $scope.descriptionTooLong = classToSave.classDescription.length;
      classToSave.created = new Date().getTime();
      classToSave.updated = new Date().getTime();
      classToSave.createdBy = Auth.getCurrentUser()._id

      if (classToSave.specialtyClass) {
        classToSave.classType = "Specialty"
      } else {
        classToSave.classType = "Regular"
        if (classToSave.specialtyClassRate) delete classToSave.specialtyClassRate;
      }

      //Should change equipment so not array.

      var toPush = ref.child("classTypes").push(classToSave, function(err) {
        if (err) return console.log(err);
        console.log("Class successfully saved")
        ref.child('toSetup').child('classTypes').remove(function(err) {
          if (err) console.log(err)
        })
        ref.child("classTypes").child(toPush.key).update({id: toPush.key}, function(err) {
          if (err) return console.log(err)
        })
        $scope.classToCreate = {};
        $scope.classToCreate.openTo = "All (Members &amp; Drop Ins)";
        $scope.missingName = false;
        $scope.missingDescription = false;
        $scope.descriptionTooLong = false;
        $scope.showAddClass = false;
        $scope.showEditClass = false;
        if(!$scope.$$phase) $scope.$apply();
      })
    }

    $scope.editClass = function(key, classToEdit) {
      $scope.showEditClass = {classKey: key, classToEdit: classToEdit};
      $scope.showAddClass = false;
      window.scrollTo(0, 0);
    }

    $scope.updateClassType = function(classKey, classToEdit) {

      if (classToEdit.equipment) {
        for (var i = 0; i < classToEdit.equipment.length; i++) { //Being added because firebase doesn't like arrays
          delete classToEdit.equipment[i].$$hashKey
        }
      }

      if (classToEdit.$$hashKey) delete classToEdit.$$hashKey

      if (classToEdit.specialtyClass) {
        classToEdit.classType = "Specialty"
      } else {
        classToEdit.classType = "Regular"
        classToEdit.specialtyClassRate = null;
      }

      classToEdit.updated = new Date().getTime();
      classToEdit.updatedBy = Auth.getCurrentUser()._id

      if (!classToEdit.name) return $scope.missingName = true;
      if (!classToEdit.classDescription) return $scope.missingDescription = true;
      if (classToEdit.classDescription.length > $scope.maxDescriptionLength) return $scope.descriptionTooLong = classToEdit.classDescription.length;
      ref.child('classTypes').child(classKey).update(classToEdit, function(err) {
        console.log("Class successfully updated")
        Intercom('trackEvent', "classTypeUpdated", {classType: classKey})
        $scope.showEditClass = false;
        $scope.missingName = false;
        $scope.missingDescription = false;
        $scope.descriptionTooLong = false;
        if(!$scope.$$phase) $scope.$apply();
      })
    }
    
    $scope.loadEquipment = function($query) {
      return [
        { "name": "Dumbbells", 'id': "sdfjweoiWE342"},
        { "name": "Mat", 'id': "fwej22bboi8" },
        { "name": "Punching Bag", "id": "23sdfnn98beu" },
        { "name": "TRX", "id": "nj230abspoj"},
        { "name": "Chin-Up Bar", "id": "b239ancBIUH30" },
        { "name": "Jump Rope", "id": "29BAu87B2j73" },
        { "name": "Exercise Bands", "id": "3gs1b0E8wb7" },
        { "name": "Core Wheel", "id": "h2bf03nBaP" },
        { "name": "Foam Roller", "id": "23bf2u3ehdi" },
        { "name": "Exercise Ball", "id": "293hfnQ8WDA" },
        { "name": "Thera-Band", "id": "8nf0wejde82" }

      ]
      // return $http.get('countries.json', { cache: true}).then(function(response) {
      //   var countries = response.data;
      //   return countries.filter(function(country) {
      //     return country.name.toLowerCase().indexOf($query.toLowerCase()) != -1;
      //   });
      // });
    };

    $scope.scrollTop = function() {
      window.scrollTo(0, 0);
    }

    $scope.deleteClassType = function(classTypeId) {
      var rightNow = new Date().getTime();
      console.log($scope.savedClassTypes)
      if ($scope.savedClassTypes[classTypeId].workoutsUsingClass) return alert("There are workouts that use this class type.  Please delete the workouts prior to deleting this class type.")
      ref.child('classes').orderByChild('classType').equalTo(classTypeId).once('value', function(snapshot) {
        if (!snapshot.exists()) {
          ref.child('classTypes').child(classTypeId).remove(function(err) {
            if (err) return console.log(err)
            console.log("Successfully removed class type since there were no workouts or future classes based on it.")
            Intercom('trackEvent', "classTypeDeleted", {classType: classTypeId})
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
        if (futureClasses.length > 0) return alert("There are " + futureClasses.length + " classes coming up that use this class type.  Can't delete without first deleting those classes.")
        ref.child('classTypes').child(classTypeId).remove(function(err) {
          if (err) return console.log(err)
          console.log("Successfully removed class type since there were no workouts or future classes based on it.")
          Intercom('trackEvent', "classTypeDeleted", {classType: classTypeId})
        })
      })
    }

    $scope.closeAlertPushed = function() {
      $cookies.remove('showClassTypesAlert')
      $scope.showScheduleAlert = false;
    }

  });
