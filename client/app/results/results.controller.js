'use strict';

angular.module('bodyAppApp')
  .controller('ResultsCtrl', function ($scope, Schedule, Auth) {
    
    $scope.currentUser = Auth.getCurrentUser()

    $scope.classCompleted = Schedule.classUserJustJoined;

    var classDate = $scope.classCompleted ? new Date($scope.classCompleted.date) : new Date();

    var classKey = ""+classDate.getFullYear()+""+((classDate.getMonth()+1 < 10)?"0"+(classDate.getMonth()+1):classDate.getMonth()+1)+""+((classDate.getDate() < 10)?"0"+classDate.getDate():classDate.getDate())

    $scope.userResultsToday = $scope.currentUser.results ? $scope.currentUser.results[classKey] : null
    console.log($scope.currentUser);
    var communityResultsArray;
    var classResultsArray;
    $scope.rankings;
    $scope.communityActive = true;
    $scope.classmateActive;

    $scope.myRank;

    var sunDate = new Date();
    sunDate.setDate(classDate.getDate() - classDate.getDay());
    var sunGetDate = sunDate.getDate();
    var sunGetMonth = sunDate.getMonth()+1;
    var sunGetYear = sunDate.getFullYear();
    var weekOf = "weekof"+ (sunGetMonth<10?"0"+sunGetMonth:sunGetMonth) + (sunGetDate<10?"0"+sunGetDate:sunGetDate) + sunGetYear;    
    var weekOfRef = new Firebase("https://bodyapp.firebaseio.com/" + weekOf)
    var dayRef = weekOfRef.child(classDate.getDay())

    dayRef.child("resultList").orderByChild("score").on('value', function(snapshot) {
      communityResultsArray = [];
      var i = 1;
      snapshot.forEach(function(childSnapshot) {
        var val = childSnapshot.val();
        val.rank = i;
        i++;
        communityResultsArray.push(val)
        if (val.userId === $scope.currentUser._id) {
          $scope.myCommunityRank = val.rank;
        }
      })
      // communityResultsArray = snapshot.val();

      // communityResultsArray = snapshot.val();
      // for (var i = 0; i < communityResultsArray.length; i++) {
      //   console.log("hey")
      //   communityResultsArray[i].rank = i+1;
      //   console.log('yo')
      // }
      console.log(communityResultsArray)
      // This populates the community list when first open results page
      if ($scope.communityActive) {
        $scope.rankings = communityResultsArray;
        console.log("Reloading community list");
        $scope.$apply();
      }
    })

    if ($scope.currentUser.results[classKey]) {
      dayRef.child('slots').child($scope.currentUser.results[classKey]["dateTime"]).child("classResultsList").orderByChild("score").on('value', function(snapshot) {
        classResultsArray = [];
        var i = 1;
        snapshot.forEach(function(childSnapshot) {
          var val = childSnapshot.val();
          val.rank = i;
          i++;
          classResultsArray.push(val)
          if (val.userId === $scope.currentUser._id) {
            $scope.myClassRank = val.rank;
          }
        })
      })
    }

    $scope.showClassmates = function() {
      $scope.rankings = classResultsArray;
      $scope.classmateActive = true;
      $scope.communityActive = false;
    }

    $scope.showCommunity = function() {
      $scope.rankings = communityResultsArray;
      $scope.classmateActive = false;
      $scope.communityActive = true;
    }

  });
