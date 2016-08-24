angular.module('bodyAppApp')
  .controller('UserScheduleCtrl', function ($scope, $location, $state, Auth) {
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
      getUserBookings()
      getClassesAllTime()
      getTimeOfLastWeek()
    }

    function getUserBookings() {
      ref.child('userBookings').child($scope.currentUser._id.toString()).orderByKey().startAt(startAtCalendar.toString()).on('value', function(snapshot) {
        if (!snapshot.exists()) console.log("No user bookings found")
        console.log(snapshot.val())
        $scope.userBookings = snapshot.val();
        $scope.numUserBookings = snapshot.numChildren();
        if(!$scope.$$phase) $scope.$apply();
        Intercom('trackEvent', 'pulledUpcomingClasses', { numUpcomingClasses: snapshot.numChildren() });
        analytics.track('pulledUpcomingClasses', { numUpcomingClasses: snapshot.numChildren()})
      })
    }
 
    function getClassesAllTime() {
      ref.child('tookClass').child($scope.currentUser._id.toString()).once('value', function(snapshot) {
        $scope.classesAllTime = snapshot.numChildren()
        if(!$scope.$$phase) $scope.$apply();
      })
    }

    function getTimeOfLastWeek() {
      ref.child('tookClass').child($scope.currentUser._id.toString()).orderByValue().startAt(startAt.toString()).once('value', function(snapshot) {
        $scope.minutesTaken = 0;
        snapshot.forEach(function(classTaken) {
          ref.child('studios').child(classTaken.val().studioId).child('classes').child(classTaken.val().classId).child('duration').once('value', function(classDuration) {
            $scope.minutesTaken += classDuration.val()
            $scope.maxMinutesTaken = Math.min(100, $scope.minutesTaken)
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
    
    $scope.editProfileClicked = function() {
      $state.go('settings', {teammates: false, profilePage: true})
    }

    $scope.friendsClicked = function() {
      $state.go('settings', {teammates: true, profilePage: false})
    }

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