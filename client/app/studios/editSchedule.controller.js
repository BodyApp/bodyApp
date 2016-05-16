angular.module('bodyAppApp')
  .controller('EditScheduleCtrl', function ($scope, $stateParams, $state, $location, $window, Studios, $http, Auth, User) {
    var currentUser = Auth.getCurrentUser()
    if (!Studios.isAdmin() && currentUser.role != 'admin') $state.go('storefront');
    var ref;
    var studioId = $stateParams.studioId;
    $scope.classToCreate = {};
    $scope.minDate = new Date();
    Studios.setCurrentStudio(studioId);
    if (studioId) {
      ref = new Firebase("https://bodyapp.firebaseio.com/studios").child(studioId);
    } else {
      // $location.path('/ralabala/admin')
      ref = new Firebase("https://bodyapp.firebaseio.com/studios").child("ralabala");
    }

    var tzName = jstz().timezone_name;
    $scope.timezone = moment().tz(tzName).format('z');

    // $scope.firstDayShown.formattedDate = $scope.getFormattedDateTime($scope.firstDayShown.dateTime)
    // console.log($scope.firstDayShown)

    // $scope.classTypes = {};
    // $scope.workouts = {};
    // $scope.instructors = {};
    // $scope.playlistsObject = {};
    $scope.numBookingsByClass = {};

    var daysInFuture = 0;
    var numDaysToShow = 7;

    $scope.showingNextWeek = false;
    $scope.showWeekView = true;

    $scope.durationOptions = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60]

    var nextSessionToSave;

    ref.onAuth(function(authData) {
      if (authData) {
        console.log("User is authenticated with fb ");
        getClassTypes();
        getInstructors();
        getPlaylists();
        getClasses(daysInFuture);
        getWorkouts();
        getPlaylistObjects();
        createSchedule(numDaysToShow, daysInFuture);
        createInitialTokBoxSession();
      } else {
        console.log("User is logged out");
        if (currentUser.firebaseToken) {
          ref.authWithCustomToken(currentUser.firebaseToken, function(error, authData) {
            if (error) {
              Auth.logout();
              $window.location.reload()
              console.log("Firebase user authentication failed", error);
            } else {
              if (currentUser.role === "admin") console.log("Firebase user authentication succeeded!", authData);
              getClassTypes();
              getInstructors();
              getPlaylists();
              getClasses(daysInFuture);
              getWorkouts();
              getPlaylistObjects();
              createSchedule(numDaysToShow, daysInFuture);
              createInitialTokBoxSession();
            }
          }); 
        } else {
          Auth.logout();
          $window.location.reload()
        }
      }
    })

    function createInitialTokBoxSession() {
      User.createTokBoxSession({id: Auth.getCurrentUser()._id}).$promise.then(function(session) {
        nextSessionToSave = session;
      })
    }

    function getClasses(daysInFuture) {
      var startAt = new Date().getTime() - 1*60*60*1000 //Can see classes that started an hour ago
      startAt = (startAt*1 + daysInFuture*24*60*60*1000).toString()
      var numberOfDaysToDisplay = numDaysToShow;
      var toAdd = numberOfDaysToDisplay * 24 * 60 * 60 * 1000
      var endAt = (startAt*1 + toAdd + 1*60*60*1000).toString()

      ref.child('classes').orderByKey().startAt(startAt).endAt(endAt).on('value', function(snapshot) {
        $scope.classSchedule = snapshot.val();
        console.log("Pulled " + Object.keys($scope.classSchedule).length + " classes for schedule.")
        if(!$scope.$$phase) $scope.$apply();
      })
    }

    function getPlaylists() {
      ref.child('playlists').orderByChild("lastModified").once('value', function(snapshot) {
        $scope.playlists = [];
        snapshot.forEach(function(playlist) {
          $scope.playlists.unshift(playlist.val())
        })
        $scope.workoutToCreate = $scope.workoutToCreate || {};
        if (!$scope.workoutToCreate.playlist) $scope.workoutToCreate.playlist = $scope.playlists[0];
      })
    }

    function getInstructors() {
      ref.child('instructors').once('value', function(snapshot) {
        $scope.instructors = snapshot.val()
        Studios.saveInstructors(snapshot.val())
        // console.log($scope.instructors)
        $scope.workoutToCreate = $scope.workoutToCreate || {};
        if (!$scope.workoutToCreate.instructor) $scope.workoutToCreate.instructor = $scope.instructors[Object.keys($scope.instructors)[0]];
      })
    }

    function getClassTypes() {
      ref.child('classTypes').once('value', function(snapshot) {
        $scope.classTypes = snapshot.val()
        Studios.saveClassTypes(snapshot.val())
        //Sets initial class type
        $scope.workoutToCreate = $scope.workoutToCreate || {};
        if (!$scope.workoutToCreate.classType) $scope.workoutToCreate.classType = $scope.classTypes[Object.keys($scope.classTypes)[0]];
        selectClassType($scope.workoutToCreate.classType) //Grab workouts
        if(!$scope.$$phase) $scope.$apply();
      })  
    }

    function selectClassType(classType) {
      $scope.workoutOptions = {};
      for (var prop in classType.workoutsUsingClass) {
        ref.child('workouts').child(prop).once('value', function(snapshot) {
          if (!snapshot.exists()) return
          $scope.workoutOptions[prop] = snapshot.val() 
          if (!$scope.workoutToCreate.workout) $scope.workoutToCreate.workout = $scope.workoutOptions[prop] //Initiates workout
          if(!$scope.$$phase) $scope.$apply();
        })
      }
    }

    $scope.selectClassType = function(classType) {
       return selectClassType(classType); 
    }

    function checkIfExists(workoutToSave) {
      ref.child('classes').child(workoutToSave.dateTime).once('value', function(snapshot) {
        if (snapshot.exists()) {
          workoutToSave.dateTime +=1;
          checkIfExists(workoutToSave);  //Recursive
        } else {
          ref.child('classes').child(workoutToSave.dateTime).update(workoutToSave, function(err) {
            if (err) return console.log(err);
            console.log("Saved Class")
            User.createTokBoxSession({id: Auth.getCurrentUser()._id}).$promise.then(function(session) {
              nextSessionToSave = session;
            })
          })      
        }
      })
    }

    $scope.saveWorkout = function(workoutToCreate) {
      var workoutToSave = {};
      workoutToSave.classType = workoutToCreate.classType.id;
      workoutToSave.dateTime = new Date(workoutToCreate.dateTime).getTime();
      workoutToSave.instructor = workoutToCreate.instructor._id;
      workoutToSave.playlist = workoutToCreate.playlist.id;
      workoutToSave.workout = workoutToCreate.workout.id;
      workoutToSave.duration = workoutToCreate.duration;
      workoutToSave.spots = 12;
      workoutToSave.sessionId = nextSessionToSave.sessionId
      console.log(workoutToSave)

      checkIfExists(workoutToSave); 
    }

    function createSchedule(days, daysInFuture) {
      $scope.daysToShow = [];
      var dateTimeNow = new Date();
      var beginningDateToday = new Date(dateTimeNow.getFullYear(), dateTimeNow.getMonth(), dateTimeNow.getDate(), 0, 0, 0, 1).getTime();
      beginningDateToday = beginningDateToday + daysInFuture*24*60*60*1000;
      for (var i=0; i<days; i++) {
        var day = {}
        day.beginDateTime = beginningDateToday + i*24*60*60*1000
        day.endDateTime = day.beginDateTime + 24*60*60*1000-1000
        day.formattedDate = getFormattedDateTime(day.beginDateTime).dayOfWeek + ", " + getFormattedDateTime(day.beginDateTime).month + " " + getFormattedDateTime(day.beginDateTime).day;
        day.formattedDayOfWeek = getFormattedDateTime(day.beginDateTime).dayOfWeek;
        day.formattedMonthAndDay = getFormattedDateTime(day.beginDateTime).month + " " + getFormattedDateTime(day.beginDateTime).day;

        $scope.daysToShow.push(day)
        if(!$scope.$$phase) $scope.$apply();
      }
    }

    function getWorkouts() {
      ref.child('workouts').once('value', function(snapshot) {
        $scope.workouts = snapshot.val()
        Studios.saveWorkouts(snapshot.val())
        if(!$scope.$$phase) $scope.$apply();
      })
    }

    function getPlaylistObjects() {
      ref.child('playlists').once('value', function(snapshot) {
        $scope.playlistObjects = snapshot.val();
        Studios.savePlaylistObjects(snapshot.val())
        if(!$scope.$$phase) $scope.$apply();
      })
    }

    $scope.getNumberOfBookings = function(dateTime) {
      if ($scope.numBookingsByClass[dateTime]) return $scope.numBookingsByClass[dateTime];
      ref.child('bookings').child(dateTime).once('value', function(snapshot) {
        $scope.numBookingsByClass[dateTime] = snapshot.numChildren();
        return $scope.numBookingsByClass[dateTime];
      })
    }

    $scope.changeWeek = function() {
      if ($scope.showingNextWeek) {
        getClasses(0);
        createSchedule(7, 0);
        $scope.showingNextWeek = false;
      } else {
        getClasses(7);
        createSchedule(7, 7);
        $scope.showingNextWeek = true;
      }
    }

    $scope.changeView = function() {
      if ($scope.showListView) {
        $scope.showListView = false;
        $scope.showWeekView = true;
      } else {
        $scope.showListView = true;
        $scope.showWeekView = false;
      }
    }

    $scope.navigateToClassDetails = function(classId) {
      $location.path('/studios/'+studioId+'/classdetails/'+classId)
    }

    $scope.getFormattedDateTime = function(dateTime, noToday) {
      return getFormattedDateTime(dateTime, noToday);
    }

    function getFormattedDateTime(dateTime, noToday) {
      var newDate = new Date(dateTime);
      var formatted = {};

      if (newDate.getHours() == 12) {
          formatted.classTime = newDate.getHours() +":"+ ((newDate.getMinutes() < 10)?"0":"") + newDate.getMinutes() + "pm"
      } else if (newDate.getHours() == 0) {
          formatted.classTime = 12 +":"+ ((newDate.getMinutes() < 10)?"0":"") + newDate.getMinutes() + "am"
      } else {
          formatted.classTime = ((newDate.getHours() < 13)? newDate.getHours() : newDate.getHours()-12) +":"+ ((newDate.getMinutes() < 10)?"0":"") + newDate.getMinutes() + ((newDate.getHours() < 13)? "am" : "pm")
      } 
      
      formatted.day = newDate.getDate();
      formatted.year = newDate.getFullYear();
      
      // $scope.dayOfWeek;
      
      switch (newDate.getDay()) {
          case 0: formatted.dayOfWeek = "Sun"; break;
          case 1: formatted.dayOfWeek = "Mon"; break;
          case 2: formatted.dayOfWeek = "Tue"; break;
          case 3: formatted.dayOfWeek = "Wed"; break;
          case 4: formatted.dayOfWeek = "Thu"; break;
          case 5: formatted.dayOfWeek = "Fri"; break;
          case 6: formatted.dayOfWeek = "Sat"; break;
          default: break;
      }

      if (newDate.getDay() == new Date().getDay() && newDate.getDate() === new Date().getDate() && !noToday) {
          formatted.dayOfWeek = "Today"
      }

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

      formatted.month = month[newDate.getMonth()]    
      // console.log(formatted);       
      return formatted;
    }

    $scope.keyPressed = function(key, enteredSoFar) {
      if (key.keyCode === 13) $scope.searchForUser(enteredSoFar)
    }

    $scope.scrollTop = function() {
      window.scrollTo(0, 0);
    }

  });
