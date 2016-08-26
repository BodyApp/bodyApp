angular.module('bodyAppApp')
  .controller('UserScheduleCtrl', function ($scope, $location, $state, $http, Auth) {
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
        delayStart();
      } else {
        console.log("User is logged out");
        if (currentUser.firebaseToken) {
          auth.signInWithCustomToken(currentUser.firebaseToken).then(function(user) {
            if (currentUser.role === "admin") console.log("Firebase user authentication succeeded!", user);
            delayStart();
          }); 
        } else {
          User.createFirebaseToken({ id: currentUser._id }, {}, function(token) {
            auth.signInWithCustomToken(token).then(function(user) {
              console.log("Created firebase token and logged in")
              if (currentUser.role === "admin") console.log("Firebase user authentication succeeded!", user);
              delayStart();
            }); 
          })
        }
      }
    })

    // $('#nutritionLabel1').nutritionLabel();

    function delayStart() {
      getUserBookings()
      getClassesAllTime()
      getTimeOfLastWeek()
    }

    function getUserBookings() {
      ref.child('userBookings').child($scope.currentUser._id.toString()).orderByKey().startAt(startAtCalendar.toString()).on('value', function(snapshot) {
        if (!snapshot.exists()) console.log("No user bookings found")
        $scope.userBookings = snapshot.val();
        $scope.numUserBookings = snapshot.numChildren();
        if(!$scope.$$phase) $scope.$apply();
        Intercom('trackEvent', 'pulledUpcomingClasses', { numUpcomingClasses: snapshot.numChildren() });
        analytics.track('pulledUpcomingClasses', { numUpcomingClasses: snapshot.numChildren()})
      })
    }
 
    function getClassesAllTime() {
      $scope.myStudios = $scope.myStudios || {};
      ref.child('tookClass').child($scope.currentUser._id.toString()).once('value', function(snapshot) {
        $scope.classesAllTime = snapshot.numChildren()
        snapshot.forEach(function(classTaken) {
          $scope.myStudios[classTaken.val().studioId] = $scope.myStudios[classTaken.val().studioId] || 0;
          $scope.myStudios[classTaken.val().studioId]++;
          if(!$scope.$$phase) $scope.$apply();  
        })
        if(!$scope.$$phase) $scope.$apply();
      })
    }

    function getTimeOfLastWeek() {
      ref.child('tookClass').child($scope.currentUser._id.toString()).orderByKey().startAt(startAt.toString()).once('value', function(snapshot) {
        console.log(snapshot.val())
        $scope.minutesTaken = 0;
        snapshot.forEach(function(classTaken) {
          ref.child('studios').child(classTaken.val().studioId).child('classes').child(classTaken.val().classId).child('duration').once('value', function(classDuration) {
            $scope.minutesTaken += classDuration.val();
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

    $scope.nutritionClicked = function() {
      $scope.nutritionActive = true;
      if(!$scope.$$phase) $scope.$apply();
    }

    $scope.dashboardClicked = function() {
      $scope.nutritionActive = false;
      if(!$scope.$$phase) $scope.$apply();
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

    $scope.goToStudio = function(studioId) {
      $location.path('/studios/'+studioId)
    }

    $scope.searchForFood = function(foodString) {
      var req = {
        method: 'POST',
        url: 'https://api.nutritionix.com/v1/search',
        headers: {
          'Content-Type': 'application/json'
        },
        data: { 
          "appId": "2dabc129",
        "appKey": "d4ae3234d5b02afc5fdfaed5ee019fe6", 
        "query": foodString.toString()
        }
      }

      $http(req).then(function(data){
        console.log(data)
      }, function(err) {
        console.log(err)
      });
    }
  })