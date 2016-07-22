'use strict';

angular.module('bodyAppApp')
  .controller('AdminCtrl', function ($scope, $mdDialog, $location) {

    Intercom('trackEvent', 'navigatedToStatsPage')

    var ref = firebase.database().ref();
    var auth = firebase.auth();
    
    var startAt = new Date().getTime() - 7*24*60*60*1000;
    var endAt = startAt + 7*24*60*60*1000;
    $scope.rightNow = new Date().getTime();
    $scope.dataInvalidDate = new Date(2016, 6, 18, 0, 1); //Data prior to 7/18/16 is inaccurate

    var prompt = $mdDialog.prompt({
      title: "Welcome To the BODY Stats Page!",
      textContent: "Please enter the stats password. You can email daniel@getbodyapp.com if you don't have one yet.",
      ok: "OK!",
      cancel: 'Nevermind'
    });

    ref.child('statsPassword').once('value', function(snapshot) {
      if (!snapshot.val()) return alert("Sorry, no stats available right now.")
      return $mdDialog.show( prompt ).then(function(result) {
        if (result === snapshot.val().password) {
          Intercom('trackEvent', 'enteredCorrectPassword')
          setDateTimePicker()
          // getStats()
        }
      }, function() {
        console.log("Didn't enter password.")
        $location.path('/')
      })
    })
    

    // setDateTimePicker()
    // getStats()

    $scope.calculate = function() {
      getStats()
    }

    function getStats() {
      $scope.numberOfClassesScheduled = 0;
      $scope.numberOfStudiosThatScheduledClass = 0;
      $scope.numberOfBookings = 0;
      $scope.numberOfUsersThatScheduledAClass = 0;
      $scope.numberOfUsersThatTookAClass = 0;
      $scope.classesTaken = 0;
      $scope.numberOfCancellations = 0;
      $scope.numberOfUsersThatCancelledAClass = 0;
      $scope.classesByStudio = [];

      startAt = new Date($('#datetimepickerStart').data().date).getTime();
      $scope.startAt = startAt;
      endAt = new Date($('#datetimepickerEnd').data().date).getTime();
      Intercom('trackEvent', 'lookedAtStats', {startAt: startAt, endAt: endAt})
      ref.child('userBookings').once('value', function(user) {
        user.forEach(function(bookings) {
          bookings.ref.orderByKey().startAt(startAt.toString()).endAt(endAt.toString()).once('value', function(snapshot) {
            console.log(snapshot.val())
            if (!snapshot.exists()) return;
            $scope.numberOfBookings += snapshot.numChildren();
            $scope.numberOfUsersThatScheduledAClass += 1;  
            if(!$scope.$$phase) $scope.$apply(); 
          })
        })
      });

      ref.child('bookingCancellations').once('value', function(user) {
        user.forEach(function(bookings) {
          bookings.ref.orderByKey().startAt(startAt.toString()).endAt(endAt.toString()).once('value', function(snapshot) {
            console.log(snapshot.val())
            if (!snapshot.exists()) return;
            $scope.numberOfCancellations += snapshot.numChildren();
            $scope.numberOfUsersThatCancelledAClass += 1;
            if(!$scope.$$phase) $scope.$apply(); 
          })
        })
      });

      ref.child('tookClass').once('value', function(user) {
        user.forEach(function(bookings) {
          bookings.ref.orderByKey().startAt(startAt.toString()).endAt(endAt.toString()).once('value', function(snapshot) {
            if (!snapshot.exists()) return;
            $scope.classesTaken += snapshot.numChildren();
            $scope.numberOfUsersThatTookAClass += 1;
            console.log($scope.numberOfUsersThatTookAClass);
            if(!$scope.$$phase) $scope.$apply(); 
          })
        })
      });

      ref.child('studios').once('value', function(studios) {
        $scope.numberOfStudios = studios.numChildren()
        console.log(studios.numChildren())
        studios.forEach(function(studio) {
          // studio.ref.child('userBookings').orderByChild('dateTime').startAt(startAt.toString()).endAt(endAt.toString()).once('value', function(snapshot) {
          //   console.log(studio.val().storefrontInfo.studioName + " had " + snapshot.numChildren() + " bookings.")
          //   if (!snapshot.exists()) return;
          //   $scope.numberOfBookings += snapshot.numChildren();
          //   $scope.numberOfUsersThatScheduledAClass += 1;
          //   console.log($scope.numberOfBookings)
          // });
          studio.ref.child('classes').orderByKey().startAt(startAt.toString()).endAt(endAt.toString()).once('value', function(snapshot) {
            console.log(studio.val().storefrontInfo.studioName + " scheduled " + snapshot.numChildren() + " classes.")
            if (!snapshot.exists()) return;
            $scope.classesByStudio.push({studioId: studio.val().storefrontInfo.studioId, studioName: studio.val().storefrontInfo.studioName, numClasses: snapshot.numChildren()})
            $scope.numberOfClassesScheduled += snapshot.numChildren();
            $scope.numberOfStudiosThatScheduledClass += 1;
            if(!$scope.$$phase) $scope.$apply();
          })
        })
      })
    }

    $scope.getStats = function() {
      getStats()
    }

    $scope.round = function(numberToRound) {
      return numberToRound.toFixed(1)
    }

    function setDateTimePicker() {
      $scope.loaded = true;
      if(!$scope.$$phase) $scope.$apply();
      $('#datetimepickerStart').datetimepicker({
        sideBySide: true,
        minDate: $scope.dataInvalidDate,
        defaultDate: new Date().getTime() - 7*24*60*60*1000 > $scope.dataInvalidDate ? new Date().getTime() - 7*24*60*60*1000 : $scope.dataInvalidDate
      });
      $('#datetimepickerEnd').datetimepicker({
        sideBySide: true,
        defaultDate: new Date().getTime()
      });
      // $('#datetimepickerStart').data("DateTimePicker").minDate(new Date());
    }
  })

  .filter('orderObjectBy', function() {
  return function(items, field, reverse) {
    var filtered = [];
    angular.forEach(items, function(item) {
      filtered.push(item);
    });
    filtered.sort(function (a, b) {
      return (a[field] > b[field] ? 1 : -1);
    });
    if(reverse) filtered.reverse();
    return filtered;
  };
});


