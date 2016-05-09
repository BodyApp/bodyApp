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
    
    $scope.loadEquipment = function($query) {
      return [
        { "name": "Dumbbells" },
        { "name": "Mat" },
        { "name": "Punching Bag" },
        { "name": "TRX" },
        { "name": "Chin-Up Bar" },
        { "name": "Jump Rope" },
        { "name": "Exercise Bands" },
        { "name": "Core Wheel" },
        { "name": "Foam Roller" },
        { "name": "Exercise Ball" },
        { "name": "Thera-Band" }

      ]
      return $http.get('countries.json', { cache: true}).then(function(response) {
        var countries = response.data;
        return countries.filter(function(country) {
          return country.name.toLowerCase().indexOf($query.toLowerCase()) != -1;
        });
      });
    };

  });
