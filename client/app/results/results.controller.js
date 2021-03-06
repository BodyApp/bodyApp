'use strict';

angular.module('bodyAppApp')
  .controller('ResultsCtrl', function ($scope, Schedule, Auth, DayOfWeekSetter, Video) {
    
    $scope.currentUser = Auth.getCurrentUser()

    $scope.classCompleted = Schedule.classUserJustJoined;
    $scope.wodToDisplay;

    $scope.today = new Date();
    var classDate = $scope.classCompleted ? new Date($scope.classCompleted.dateTime) : new Date();
    // var classDate = $scope.classCompleted ? new Date($scope.classCompleted.dateTime) : new Date();
    var classKey = ""+classDate.getFullYear()+""+((classDate.getMonth()+1 < 10)?"0"+(classDate.getMonth()+1):classDate.getMonth()+1)+""+((classDate.getDate() < 10)?"0"+classDate.getDate():classDate.getDate());

    $scope.userResultsToday = $scope.currentUser.results ? $scope.currentUser.results[classKey] : null;
    var communityResultsArray;
    var classResultsArray;
    // var myFriendsArray;
    $scope.rankings;
    $scope.communityActive = true;
    $scope.classmateActive;
    $scope.myCommunityRank;
    $scope.myClassRank;
    // $scope.myFriendsRank;

    Video.destroyHardwareSetup()

    $scope.dayList = [];
    setupDayList();
    // $scope.selectedDate = new Date();     

    var ref = firebase.database().ref();
    var auth = firebase.auth();
    auth.onAuthStateChanged(function(user) {
      if (user) {
      } else {
        if (currentUser.firebaseToken) {
          auth.signInWithCustomToken(currentUser.firebaseToken).then(function(user) {
            if (currentUser.role === "admin") console.log("Firebase user authentication succeeded!", user);
          }); 
        } else {
          console.log("User doesn't have a firebase token saved, should retrieve one.")
        }
      }
    })

    $scope.wods;
    var wodsRef = ref.child("WODs");
    wodsRef.once('value', function(snapshot) {
      $scope.wods = snapshot.val();  
      $scope.wodToDisplay = $scope.wods[classKey];
      loadResultsList(classDate);
      if(!$scope.$$phase) $scope.$apply();
    })

    $scope.formatScore = function(score) {
      if (score > 20) {
        var minutes = Math.floor(score / 60);
        var seconds = score % 60;
        return minutes + ":" + ((seconds < 10) ? "0" + seconds : seconds);
      } else {
        return score;
      }
    }

    $scope.formattedWodDate = function(newDate) {
      var date = new Date(newDate);
      return ""+date.getFullYear()+""+((date.getMonth()+1 < 10)?"0"+(date.getMonth()+1):date.getMonth()+1)+""+((date.getDate() < 10)?"0"+date.getDate():date.getDate())
    }

    $scope.switchToDay = function(wod) {
      $scope.userResultsToday = undefined;
      $scope.myClassRank = undefined;
      $scope.myCommunityRank = undefined;
      $scope.rankings = [];
      if (wod) loadResultsList(new Date(wod.dateTime))
      $scope.wodToDisplay = wod
      if (wod) $scope.wodToDisplay.dateTime = new Date(wod.dateTime);
      if(!$scope.$$phase) $scope.$apply();
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
      $scope.rankings = [];

      classKey = ""+classDate.getFullYear()+""+((classDate.getMonth()+1 < 10)?"0"+(classDate.getMonth()+1):classDate.getMonth()+1)+""+((classDate.getDate() < 10)?"0"+classDate.getDate():classDate.getDate())

      ref.child("resultsByUser").child($scope.currentUser._id).child(classKey).once('value', function(snapshot) {
        $scope.userResultsToday = snapshot.val();
        if(!$scope.$$phase) $scope.$apply();
      }, function(err) {if (!err) console.log("User results loaded for " + classKey)})  

      // $scope.userResultsToday = $scope.currentUser.results ? $scope.currentUser.results[classKey] : null;

      // var sunDate = new Date(classDate.getFullYear(), classDate.getMonth(), classDate.getDate() - classDate.getDay(), 11, 0, 0);
      // var sunDate = new Date();
      // sunDate.setDate(classDate.getDate() - classDate.getDay());
      // var sunGetDate = sunDate.getDate();
      // var sunGetMonth = sunDate.getMonth()+1;
      // var sunGetYear = sunDate.getFullYear();
      // var weekOf = "weekof"+ sunGetYear + (sunGetMonth<10?"0"+sunGetMonth:sunGetMonth) + (sunGetDate<10?"0"+sunGetDate:sunGetDate);
      // var weekOfRef = new Firebase("https://bodyapp.firebaseio.com/classes/" + weekOf)
      // var dayRef = weekOfRef.child(DayOfWeekSetter.setDay(classDate.getDay()))

      // dayRef.child("resultList").orderByChild("score").once('value', function(snapshot) {  
      ref.child("resultsByDay").child(classKey).orderByChild("score").once('value', function(snapshot) {  
        if ($scope.wodToDisplay && $scope.wodToDisplay.scoreType.id === 1) { // If wod is AMRAP
          var i = snapshot.numChildren()
          snapshot.forEach(function(childSnapshot) {
            var val = childSnapshot.val();
            val.rank = i;
            i--;
            communityResultsArray.unshift(val)
            // if (val.userId === $scope.currentUser._id && !$scope.myCommunityRank) {
            if (val.userId === $scope.currentUser._id) {
              $scope.myCommunityRank = val.rank;
              if(!$scope.$$phase) $scope.$apply();
              // $scope.userResultsToday = val;
              // loadClassmates()
            }
          })
          $scope.rankings = communityResultsArray;
          if(!$scope.$$phase) $scope.$apply();
        } else { // If wod is 'for time'
          var i = 1;
          snapshot.forEach(function(childSnapshot) {
            var val = childSnapshot.val();
            val.rank = i;
            i++;
            communityResultsArray.push(val)
            // if (val.userId === $scope.currentUser._id && !$scope.myCommunityRank) {
            if (val.userId === $scope.currentUser._id) {
              $scope.myCommunityRank = val.rank;
              if(!$scope.$$phase) $scope.$apply();
              // $scope.userResultsToday = val;
              // loadClassmates()
            }
          })
          $scope.rankings = communityResultsArray;
          if(!$scope.$$phase) $scope.$apply();
        }
        loadClassmates()
      })

      function loadClassmates() {
        if ($scope.userResultsToday && $scope.userResultsToday.classDateTime) {
          // dayRef.child('slots').child($scope.userResultsToday.classDateTime).child("classResultsList").orderByChild("score").once('value', function(snapshot) {    
          ref.child("resultsByClass").child($scope.userResultsToday.classDateTime).orderByChild("score").once('value', function(snapshot) {    
            //All the work below determines ranking
            if ($scope.wodToDisplay && $scope.wodToDisplay.scoreType && $scope.wodToDisplay.scoreType.id === 1) { //If wod is AMRAP
              var i = snapshot.numChildren()
              snapshot.forEach(function(childSnapshot) {
                var val = childSnapshot.val();
                val.rank = i;
                i--;
                classResultsArray.unshift(val)
                // if (val.userId === $scope.currentUser._id && !$scope.myClassRank) {
                if (val.userId === $scope.currentUser._id) {
                  $scope.myClassRank = val.rank;
                  if(!$scope.$$phase) $scope.$apply();
                }
              })
            } else { //If wod is 'for time'
              var i = 1;
              snapshot.forEach(function(childSnapshot) {
                var val = childSnapshot.val();
                val.rank = i;
                i++;
                classResultsArray.push(val)
                // if (val.userId === $scope.currentUser._id && !$scope.myClassRank) {
                if (val.userId === $scope.currentUser._id) {
                  $scope.myClassRank = val.rank;
                  if(!$scope.$$phase) $scope.$apply();
                }
              })
            }
            if(!$scope.$$phase) $scope.$apply();
          })
        }
      }
    }

    // function loadClassmatesList(dayRef, classDateTime) { 
    //   console.log(classDateTime)
    //   if (classDateTime) {
    //     dayRef.child('slots').child(classDateTime).child("classResultsList").orderByChild("score").once('value', function(snapshot) {    
    //       if ($scope.wodToDisplay.scoreType.id === 1) { 
    //         var i = snapshot.numChildren()
    //         snapshot.forEach(function(childSnapshot) {
    //           var val = childSnapshot.val();
    //           val.rank = i;
    //           i--;
    //           classResultsArray.unshift(val)
    //           if (val.userId === $scope.currentUser._id && !$scope.myClassRank) {
    //             $scope.myClassRank = val.rank;
    //           }
    //         })
    //       } else { 
    //         var i = 1;
    //         snapshot.forEach(function(childSnapshot) {
    //           var val = childSnapshot.val();
    //           val.rank = i;
    //           i++;
    //           classResultsArray.push(val)
    //           if (val.userId === $scope.currentUser._id && !$scope.myClassRank) {
    //             $scope.myClassRank = val.rank;
    //           }
    //         })
    //       }
    //     })
    //   }
    // }

    // function loadResultsList(classDate) {
    //   communityResultsArray = [];
    //   classResultsArray = [];
    //   $scope.rankings = [];

    //   classKey = ""+classDate.getFullYear()+""+((classDate.getMonth()+1 < 10)?"0"+(classDate.getMonth()+1):classDate.getMonth()+1)+""+((classDate.getDate() < 10)?"0"+classDate.getDate():classDate.getDate())

    //   // $scope.userResultsToday = $scope.currentUser.results ? $scope.currentUser.results[classKey] : null;

    //   var sunDate = new Date();
    //   sunDate.setDate(classDate.getDate() - classDate.getDay());
    //   var sunGetDate = sunDate.getDate();
    //   var sunGetMonth = sunDate.getMonth()+1;
    //   var sunGetYear = sunDate.getFullYear();
    //   var weekOf = "weekof"+ (sunGetMonth<10?"0"+sunGetMonth:sunGetMonth) + (sunGetDate<10?"0"+sunGetDate:sunGetDate) + sunGetYear;    
    //   var weekOfRef = new Firebase("https://bodyapp.firebaseio.com/" + weekOf)
    //   var dayRef = weekOfRef.child(classDate.getDay())

    //   dayRef.child("resultList").orderByChild("score").once('value', function(snapshot) {  
    //     if ($scope.wodToDisplay.scoreType.id === 1) { 
    //       var i = snapshot.numChildren()
    //       snapshot.forEach(function(childSnapshot) {
    //         var val = childSnapshot.val();
    //         val.rank = i;
    //         i--;
    //         communityResultsArray.unshift(val)
    //         if (val.userId === $scope.currentUser._id && !$scope.userResultsToday) {
    //           $scope.myCommunityRank = val.rank;
    //           $scope.userResultsToday = val;
    //           loadClassmatesList(dayRef, val.classDateTime)
    //         }
    //       })
    //       $scope.rankings = communityResultsArray;
    //     } else { 
    //       var i = 1;
    //       snapshot.forEach(function(childSnapshot) {
    //         var val = childSnapshot.val();
    //         val.rank = i;
    //         i++;
    //         communityResultsArray.push(val)
    //         if (val.userId === $scope.currentUser._id && !$scope.userResultsToday) {
    //           $scope.myCommunityRank = val.rank;
    //           $scope.userResultsToday = val;
    //           loadClassmatesList(dayRef, val.classDateTime)
    //         }
    //       })
    //       $scope.rankings = communityResultsArray;
    //       if(!$scope.$$phase) $scope.$apply();
    //     }        
    //   })
    // }

  });
