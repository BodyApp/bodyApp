'use strict';

angular.module('bodyAppApp')
  .controller('ClassesCtrl', function ($scope, $stateParams, Studios, $http, Auth) {
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

    // $scope.tags = [
    //   { name: "Brazil", flag: "Brazil.png" },
    //   { name: "Italy", flag: "Italy.png" },
    //   { name: "Spain", flag: "Spain.png" },
    //   { name: "Germany", flag: "Germany.png" },
    // ];

    ref.child('classTypes').orderByChild('updated').on('value', function(snapshot) {
      $scope.savedClassTypes = []
      snapshot.forEach(function(classType) {
        $scope.savedClassTypes.push(classType.val());
        // console.log(classType.val().updated)
      })
      // $scope.savedClassTypes = snapshot.val()
      // console.log($scope.savedClassTypes)
      if(!$scope.$$phase) $scope.$apply();

    })


    $scope.saveClassType = function(classToSave) {

      if (!classToSave.name) return $scope.missingName = true;
      // if (!classToSave.equipment) return $scope.missingEquipment = true
      if (!classToSave.classDescription) return $scope.missingDescription = true;
      if (classToSave.classDescription.length > 200) return $scope.descriptionTooLong = classToSave.classDescription.length;
      classToSave.created = new Date().getTime();
      classToSave.updated = new Date().getTime();
      classToSave.createdBy = Auth.getCurrentUser()._id

      //Should change equipment so not array.

      var toPush = ref.child("classTypes").push(classToSave, function(err) {
        if (err) return console.log(err);
        console.log("Class successfully saved")
        ref.child("classTypes").child(toPush.key()).update({id: toPush.key()})
        $scope.classToCreate = {};
        $scope.classToCreate.openTo = "All (Members &amp; Drop Ins)";
        $scope.missingName = false;
        $scope.missingDescription = false;
        $scope.descriptionTooLong = false;
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

      classToEdit.updated = new Date().getTime();
      classToEdit.updatedBy = Auth.getCurrentUser()._id

      if (!classToEdit.name) return $scope.missingName = true;
      if (!classToEdit.classDescription) return $scope.missingDescription = true;
      if (classToEdit.classDescription.length > 200) return $scope.descriptionTooLong = classToEdit.classDescription.length;
      ref.child('classTypes').child(classKey).update(classToEdit, function(err) {
        console.log("Class successfully updated")
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

  });
