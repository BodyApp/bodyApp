'use strict';

angular.module('bodyAppApp')
  .controller('ResultsCtrl', function ($scope, Schedule, Auth) {
    
    $scope.currentUser = Auth.getCurrentUser()

    $scope.classCompleted = Schedule.classUserJustJoined;
    $scope.wodToDisplay;

    $scope.today = new Date();
    var classDate = $scope.classCompleted ? new Date($scope.classCompleted.date) : new Date();
    var classKey = ""+classDate.getFullYear()+""+((classDate.getMonth()+1 < 10)?"0"+(classDate.getMonth()+1):classDate.getMonth()+1)+""+((classDate.getDate() < 10)?"0"+classDate.getDate():classDate.getDate())

    console.log($scope.currentUser.results)

    $scope.userResultsToday = $scope.currentUser.results ? $scope.currentUser.results[classKey] : null
    var communityResultsArray;
    var classResultsArray;
    $scope.rankings;
    $scope.communityActive = true;
    $scope.classmateActive;

    $scope.dayList = [];
    setupDayList();
    $scope.selectedDate = new Date(); 

    loadResultsList(classDate)

    $scope.wods;
    var wodsRef = new Firebase("https://bodyapp.firebaseio.com/WODs")
    wodsRef.once('value', function(snapshot) {
      $scope.wods = snapshot.val();  
      console.log($scope.wods);
      $scope.wodToDisplay = $scope.wods[classKey]
      console.log($scope.wodToDisplay)
      $scope.$apply()
    })

    $scope.formattedWodDate = function(newDate) {
      var date = new Date(newDate);
      return ""+date.getFullYear()+""+((date.getMonth()+1 < 10)?"0"+(date.getMonth()+1):date.getMonth()+1)+""+((date.getDate() < 10)?"0"+date.getDate():date.getDate())
    }

    $scope.switchToDay = function(wod) {
      loadResultsList(new Date(wod.dateTime))
      $scope.wodToDisplay = wod
      $scope.wodToDisplay.dateTime = new Date(wod.dateTime);

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
      date = new Date(date);
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
      date = new Date(date);
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

    $scope.fixDate = function(date) {
      return new Date(date);
    }

    function setupDayList() {
      var todayDate = new Date()

      for (var i = 0; i < 7; i ++) {
        var tempDate = new Date()
        tempDate.setDate(todayDate.getDate() - i)
        $scope.dayList.push(tempDate);
      }
    }

    function loadResultsList(classDate) {
      communityResultsArray = [];
      classResultsArray = [];

      classKey = ""+classDate.getFullYear()+""+((classDate.getMonth()+1 < 10)?"0"+(classDate.getMonth()+1):classDate.getMonth()+1)+""+((classDate.getDate() < 10)?"0"+classDate.getDate():classDate.getDate())
      console.log(classKey);
      console.log($scope.currentUser);
      console.log($scope.currentUser.results)
      $scope.userResultsToday = $scope.currentUser.results ? $scope.currentUser.results[classKey] : null;
      console.log($scope.userResultsToday);

      var sunDate = new Date();
      sunDate.setDate(classDate.getDate() - classDate.getDay());
      var sunGetDate = sunDate.getDate();
      var sunGetMonth = sunDate.getMonth()+1;
      var sunGetYear = sunDate.getFullYear();
      var weekOf = "weekof"+ (sunGetMonth<10?"0"+sunGetMonth:sunGetMonth) + (sunGetDate<10?"0"+sunGetDate:sunGetDate) + sunGetYear;    
      var weekOfRef = new Firebase("https://bodyapp.firebaseio.com/" + weekOf)
      var dayRef = weekOfRef.child(classDate.getDay())

      dayRef.child("resultList").orderByChild("score").once('value', function(snapshot) {  
        var i = 1;
        snapshot.forEach(function(childSnapshot) {
          var val = childSnapshot.val();
          val.rank = i;
          i++;
          communityResultsArray.push(val)
          if (val.userId === $scope.currentUser._id && val.score === $scope.currentUser.results[classKey].score) {
            $scope.myCommunityRank = val.rank;
          }
        })

        console.log(communityResultsArray)
        // This populates the community list when first open results page
        // if ($scope.communityActive) {
        $scope.rankings = communityResultsArray;
          
        // }
      })

      if ($scope.userResultsToday) {
        dayRef.child('slots').child($scope.currentUser.results[classKey]["dateTime"]).child("classResultsList").orderByChild("score").once('value', function(snapshot) {    
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
    }

  });
