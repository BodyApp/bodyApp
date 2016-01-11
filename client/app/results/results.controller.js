'use strict';

angular.module('bodyAppApp')
  .controller('ResultsCtrl', function ($scope, Schedule, Auth) {
    
    $scope.currentUser = Auth.getCurrentUser()

    $scope.classCompleted = Schedule.classUserJustJoined;

    $scope.today = new Date();

    var classDate = $scope.classCompleted ? new Date($scope.classCompleted.date) : new Date();

    var classKey = ""+classDate.getFullYear()+""+((classDate.getMonth()+1 < 10)?"0"+(classDate.getMonth()+1):classDate.getMonth()+1)+""+((classDate.getDate() < 10)?"0"+classDate.getDate():classDate.getDate())

    $scope.userResultsToday = $scope.currentUser.results ? $scope.currentUser.results[classKey] : null
    console.log($scope.currentUser);
    var communityResultsArray;
    var classResultsArray;
    $scope.rankings;
    $scope.communityActive = true;
    $scope.classmateActive;

    $scope.dayList = [];
    setupDayList();

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

      console.log(communityResultsArray)
      // This populates the community list when first open results page
      if ($scope.communityActive) {
        $scope.rankings = communityResultsArray;
        console.log("Reloading community list");
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

    $scope.formattedDayOfWeek = function(date) {
      if (date.getDay() === new Date().getDay()) {
        return "Today"
      }

      switch (date.getDay()) {
          case 0: return "Sun"; break;
          case 1: return "Mon"; break;
          case 2: return "Tue"; break;
          case 3: return "Wed"; break;
          case 4: return "Thu"; break;
          case 5: return "Fri"; break;
          case 6: return "Sat"; break;
          default: break;
      }
    }

    $scope.formattedMonth = function(date) {
      var month = new Array();
      month[0] = "Jan";
      month[1] = "Feb";
      month[2] = "Mar";
      month[3] = "Apr";
      month[4] = "May";
      month[5] = "Jun";
      month[6] = "Jul";
      month[7] = "Aug";
      month[8] = "Sept";
      month[9] = "Oct";
      month[10] = "Nov";
      month[11] = "Dec";

      return month[date.getMonth()]    
    }

    function setupDayList() {
      var todayDate = new Date()

      for (var i = 0; i < 7; i ++) {
        var tempDate = new Date()
        tempDate.setDate(todayDate.getDate() - i)
        $scope.dayList.push(tempDate);
      }
    }

  });
