angular.module('bodyAppApp')
  .controller('UserScheduleCtrl', function ($scope, $location, Auth) {
  	var ref = firebase.database().ref();
    var auth = firebase.auth();
    var timezone = jstz().timezone_name;
    var bar;

    $scope.currentUser = Auth.getCurrentUser();

    Intercom('trackEvent', 'navigatedToUserSchedule');

    var startAtCalendar = (new Date().getTime() - 60*60*1000) //Can see bookings from up to an hour ago
    var startAt = (new Date().getTime() - 7*24*60*60*1000) //7 days ago

    auth.onAuthStateChanged(function(user) {
        if (user) {
          delayStart()
          // setMinutes()
        } else {
          // console.log("User is logged out");
          if (currentUser.firebaseToken) {
            auth.signInWithCustomToken(currentUser.firebaseToken).then(function(user) {
              if (currentUser.role === "admin") console.log("Firebase user authentication succeeded!", user);
              delayStart()
              // setMinutes()
            }); 
          } else {
            console.log("User doesn't have a firebase token saved, should retrieve one.")
          }
        }
    })

    function delayStart() {
        ref.child('userBookings').child(Auth.getCurrentUser()._id.toString()).orderByKey().startAt(startAtCalendar.toString()).once('value', function(snapshot) {
          $scope.userBookings = snapshot.val();
          $scope.numUserBookings = snapshot.numChildren()
          if(!$scope.$$phase) $scope.$apply();
          Intercom('trackEvent', 'pulledUpcomingClasses', { numUpcomingClasses: snapshot.numChildren() });
          analytics.track('pulledUpcomingClasses', { numUpcomingClasses: snapshot.numChildren()})
          getClassesAllTime()
          getTimeOfLastWeek()
        })
    }

    function getClassesAllTime() {
      ref.child('tookClass').child(Auth.getCurrentUser()._id.toString()).once('value', function(snapshot) {
        $scope.classesAllTime = snapshot.numChildren()
        if(!$scope.$$phase) $scope.$apply();
      })
    }

    function getTimeOfLastWeek() {
      ref.child('tookClass').child(Auth.getCurrentUser()._id.toString()).orderByValue().startAt(startAt.toString()).once('value', function(snapshot) {
        $scope.minutesTaken = 0;
        console.log(snapshot.val())
        snapshot.forEach(function(classTaken) {
          console.log(classTaken.val())
          ref.child('studios').child(classTaken.val().studioId).child('classes').child(classTaken.val().classId).child('duration').once('value', function(classDuration) {
            console.log(classDuration.val())
            $scope.minutesTaken += classDuration.val()
            if(!$scope.$$phase) $scope.$apply();
          })
        })
      })
    }

    // function setMinutes() {
    //    bar = new ProgressBar.SemiCircle('#semicircle_progress_bar', {
    //       strokeWidth: 6,
    //       easing: 'easeInOut',
    //       duration: 1400,
    //       color: '#FFEA82',
    //       trailColor: '#eee',
    //       trailWidth: 20,
    //       svgStyle: null
    //     });
    // }
    

    $scope.formatDate = function(dateTime) {
    	return moment(dateTime).format('ddd MMM Do')
    }

    $scope.formatTime = function(dateTime) {
    	return moment(dateTime).tz(timezone).format('h:mm a z')
    }

    $scope.goToClassInfo = function(classToGoTo) {
    	$location.path('/studios/'+classToGoTo.studioId+"/classinfo/"+classToGoTo.classId)
    }
  })