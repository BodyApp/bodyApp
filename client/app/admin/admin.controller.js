'use strict';

angular.module('bodyAppApp')
  .controller('AdminCtrl', function ($scope, $http, Auth, User, $firebaseObject) {

    // Use the User $resource to fetch all users
    $scope.users = User.query();
    var todayDate = new Date();
    $scope.todayDate = todayDate
    var todayDayOfWeek = todayDate.getDay();

    var sunDate = new Date();
    sunDate.setDate(todayDate.getDate() - todayDate.getDay());
    var weekOf = "weekof"+(sunDate.getMonth()+1)+sunDate.getDate()+sunDate.getFullYear()

    var ref = new Firebase("https://bodyapp.firebaseio.com/"+weekOf);  
    var syncObject = $firebaseObject(ref);

    var wodRef = new Firebase("https://bodyapp.firebaseio.com/WOD");
    $scope.wod = $firebaseObject(wodRef);

    $scope.createWorkout = function(workoutToCreate) {
      var date = workoutToCreate.date
      syncObject[date.getDay()] = syncObject[date.getDay()] || {    
          dayOfWeek: date.getDay(),
          formattedDate: ""+(date.getMonth()+1)+"/"+date.getDate()+"",
          name: getDayOfWeek(date),
          slots: {}
      };

      syncObject[date.getDay()].slots[date.getTime()] = {
        time: timeFormatter(date),
        date: date.getTime(),
        booked: false,
        trainer: workoutToCreate.trainer,
        classFull: false,
        past: false,
        spots: 12,
        spotsTaken: 0
      }

      syncObject.$save().then(function() {
        console.log("new workout saved")
      }).catch(function(err) {
        console.log("error saving new workout: " + err)
      })
    }

    function timeFormatter(date) {
      var formatted;
      if (date.getHours() == 12) {
          formatted = date.getHours() +":"+ ((date.getMinutes() < 10)?"0":"") + date.getMinutes() + "pm"
      } else if (date.getHours() == 24) {
          formatted = date.getHours()-12 +":"+ ((date.getMinutes() < 10)?"0":"") + date.getMinutes() + "am"
      } else {
          formatted = ((date.getHours() < 13)? date.getHours() : date.getHours()-12) +":"+ ((date.getMinutes() < 10)?"0":"") + date.getMinutes() + ((date.getHours() < 13)? "am" : "pm")
      } 
      return formatted
    }

    function getDayOfWeek(date) {
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
  });
