'use strict';

angular.module('bodyAppApp')
  .controller('ResultsCtrl', function ($scope, Schedule, Auth) {
    
    $scope.currentUser = Auth.getCurrentUser()

    $scope.classCompleted = Schedule.classUserJustJoined;

    var classDate = $scope.classCompleted ? new Date($scope.classCompleted.date) : new Date()

    var classKey = ""+classDate.getFullYear()+""+((classDate.getMonth()+1 < 10)?"0"+(classDate.getMonth()+1):classDate.getMonth()+1)+""+((classDate.getDate() < 10)?"0"+classDate.getDate():classDate.getDate())

    $scope.userResultsToday = $scope.currentUser.results[classKey];
    var communityResultsArray;
    var classResultsArray;
    $scope.rankings;

    var sunDate = new Date();
    sunDate.setDate(classDate.getDate() - classDate.getDay());
    var sunGetDate = sunDate.getDate();
    var sunGetMonth = sunDate.getMonth()+1;
    var sunGetYear = sunDate.getFullYear();
    var weekOf = "weekof"+ (sunGetMonth<10?"0"+sunGetMonth:sunGetMonth) + (sunGetDate<10?"0"+sunGetDate:sunGetDate) + sunGetYear;
    var weekOfRef = new Firebase("https://bodyapp.firebaseio.com/" + weekOf)
    var dayRef = weekOfRef.child(classDate.getDay())

    dayRef.child("resultList").on('value', function(snapshot) {
      communityResultsArray = snapshot.val();
      console.log(communityResultsArray)
    })

    dayRef.child('slots').child(classDate.getTime()).child("classResultsList").on('value', function(snapshot) {
      classResultsArray = snapshot.val();
      console.log(classResultsArray)
    })

    $scope.showClassmates = function() {
      $scope.rankings = classResultsArray;
    }

    $scope.showCommunity = function() {
      $scope.rankings = communityResultsArray;
    }

  });
