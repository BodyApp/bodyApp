'use strict';

angular.module('bodyAppApp')
  .controller('StudioWalkthroughCtrl', function ($scope, $location, $stateParams) {
    var studioId = $stateParams.studioId;
    $scope.studioId = studioId;
    var ref = firebase.database().ref().child('studios').child(studioId);

    getToSetup()

    function getToSetup() {
      ref.child('toSetup').on('value', function(snapshot) {
        $scope.toSetup = snapshot.val()
        if(!$scope.$$phase) $scope.$apply();
      })
    }
  });