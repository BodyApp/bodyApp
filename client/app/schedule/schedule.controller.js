'use strict';

angular.module('bodyAppApp')
  .controller('ConsumerScheduleCtrl', function ($scope, $http, socket, $location, $firebaseObject, Auth, Schedule) {
    

    var currentUser = Auth.getCurrentUser();
    var currentUserEmail = currentUser.email
    console.log(currentUser)
    $scope.currentUser = currentUser;

    Schedule("weekOf9272015").$bindTo($scope, 'days')
});

