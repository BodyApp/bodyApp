'use strict';

angular.module('bodyAppApp')
  .controller('ClassesCtrl', function ($scope, $stateParams, Studios, $http) {
    var ref;
    var studioId = $stateParams.studioId;
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

    $scope.saveClassType = function(classToSave) {
      console.log(classToSave)
      if (!classToSave.className) return $scope.missingName = true;
      // if (!classToSave.equipment) return $scope.missingEquipment = true
      if (!classToSave.classDescription) return $scope.missingDescription = true;
      if (classToSave.classDescription.length > 200) return $scope.descriptionTooLong = classToSave.classDescription.length;
      ref.child("classTypes").push(classToSave, function(err) {
        if (err) return console.log(err);
        console.log("Class successfully saved")
        $scope.classToCreate = {};
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
      return $http.get('countries.json', { cache: true}).then(function(response) {
        var countries = response.data;
        return countries.filter(function(country) {
          return country.name.toLowerCase().indexOf($query.toLowerCase()) != -1;
        });
      });
    };

  });
