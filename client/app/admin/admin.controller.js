'use strict';

angular.module('bodyAppApp')
  .controller('AdminCtrl', function ($scope, $http, $location, $uibModal, SoundCloudLogin, SoundCloudAPI, Auth, User, DayOfWeekSetter, $firebaseObject, $firebaseArray) {
    // if (!(Auth.isInstructor() || Auth.isAdmin())) {
    //   $location.path('/')
    // }

    Auth.getCurrentUser().$promise.then(function(data){
      if (data.role != "admin") {
        console.log("You aren't an admin, so you can't access this page")
        console.log(data);
        $location.path('/')
      }
    })

    
    // Use the User $resource to fetch all users
    // $scope.users = User.query();

    $scope.wod = {};
    var classDate;
    var classKey;
    var wodRef = new Firebase("https://bodyapp.firebaseio.com/WODs");

    $scope.scoreTypes = []
    $scope.scoreTypes.push({label: "Time To Complete", id: 0})
    $scope.scoreTypes.push({label: "Rounds Completed", id: 1})

    $scope.instructors = [];
    $scope.levels = ["Intro", "Level One", "Level Two", "Level Three", "Test"]

    var http = location.protocol;
    var slashes = http.concat("//");
    var host = slashes.concat(window.location.hostname);
    if (host === "http://localhost") {
      $scope.levels = ["Test"]      
    }

    $scope.workoutToCreate = {playlistUrl: {title: "Connect with SoundCloud Below"}, level: $scope.levels[0]};
    getAdminsAndInstructors()
    
    $scope.playlists = [];
    var defaultPlaylist;
    loadDefaultPlaylist();

    $scope.createdClass = {};
    var nextSessionToSave;

    Auth.getCurrentUser().$promise.then(function() {
      createInitialTokBoxSession()
    })

    // createInitialTokBoxSession()

    function createInitialTokBoxSession() {
      User.createTokBoxSession({id: Auth.getCurrentUser()._id}).$promise.then(function(session) {
        console.log(session)
        nextSessionToSave = session;
      })
    }

    $scope.changeDate = function(date) {
      classDate = date;
      classKey = ""+classDate.getFullYear()+""+((classDate.getMonth()+1 < 10)?"0"+(classDate.getMonth()+1):classDate.getMonth()+1)+""+((classDate.getDate() < 10)?"0"+classDate.getDate():classDate.getDate())

      wodRef.child(classKey).once('value', function(snapshot) {
        var val = snapshot.val();
        $scope.wod = val;
        if(!$scope.$$phase) $scope.$apply();
        if (!$scope.wod) {
          $scope.wod = {};
          $scope.wod.date = classKey;
          $scope.wod.scoreType = $scope.scoreTypes[0];
        }
      }) 
    }

    $scope.saveWod = function(wod, date) {
      classDate = date;
      classKey = ""+classDate.getFullYear()+""+((classDate.getMonth()+1 < 10)?"0"+(classDate.getMonth()+1):classDate.getMonth()+1)+""+((classDate.getDate() < 10)?"0"+classDate.getDate():classDate.getDate())
      wod.dateTime = new Date(date).setHours(10) //Makes sure it's set in the middle of the day to avoid timezone issues
      // wod.dateTime = tempDate.getTime();
      wod.date = classKey;
      for (var bullet in wod.challenge.bullets) {
        console.log(wod.challenge.bullets[bullet]);
        if (!wod.challenge.bullets[bullet]) {
          delete wod.challenge.bullets[bullet]
        }
      }
      wodRef.child(classKey).set(wod);
    }
    
    $scope.soundcloudAuth = function() {
      SoundCloudLogin.connect().then(function(token) {
        SoundCloudAPI.me().then(function(myInfo) {
          SoundCloudAPI.myPlaylists().then(function(playlists) {
            $scope.playlists = playlists;
            $scope.playlists.push(defaultPlaylist);
            $scope.workoutToCreate.playlistUrl = $scope.playlists[0];
          })
        })
      })
    }  

    function loadDefaultPlaylist() {
      SoundCloudAPI.defaultPlaylist().then(function(playlist) {
        defaultPlaylist = playlist
        $scope.playlists.push(playlist);
        $scope.workoutToCreate.playlistUrl = $scope.playlists[0]
      })
    }

    $scope.roundMins = function(mins) {
      return Math.round(mins);
    }

    function getAdminsAndInstructors() {
      var instructors = Auth.getInstructors().$promise.then(function(data) {
        $scope.instructors = data;
        
        Auth.getAdmins().$promise.then(function(data) {
          for (var i = 0; i < data.length; i++) {
            $scope.instructors.push(data[i]);
          }
          // $scope.instructors.push(Auth.getCurrentUser());  
          $scope.workoutToCreate.trainer = $scope.instructors[0];  
        }).catch(function(err) { console.log(err)})

      }).catch(function(err) {
        console.log(err);
      });
    }

    function openCreatingModal() {
        var modalInstance = $uibModal.open({
          animation: true,
          templateUrl: 'app/admin/creating.html',
          controller: 'AdminCtrl',
          backdrop: "static",
          keyboard: false
        });

        modalInstance.result.then(function (selectedItem) {
          $scope.selected = selectedItem;
        }, function () {
          $log.info('Modal dismissed at: ' + new Date());
        });

        return modalInstance;
    }

    $scope.createWorkout = function(workoutToCreate) {
      var modalInstance = openCreatingModal();
      var date = workoutToCreate.date;
      var workoutDate = new Date(date);
      // $scope.workoutDate = workoutDate
      var todayDayOfWeek = workoutDate.getDay();

      console.log(workoutDate.getDate())

      // var monthToSet = workoutDate.getDate - workoutDate.getDay() <= 0 ? workoutDate.getMonth() - 1 : workoutDate.getMonth;

      var sunDate = new Date(workoutDate.getFullYear(), workoutDate.getMonth(), workoutDate.getDate() - workoutDate.getDay(), 11, 0, 0);
      // sunDate.setDate(workoutDate.getDate() - workoutDate.getDay());
      console.log(sunDate)
      var sunGetDate = sunDate.getDate();
      var sunGetMonth = sunDate.getMonth()+1;
      var sunGetYear = sunDate.getFullYear();
      var weekOf = "weekof"+ sunGetYear + (sunGetMonth<10?"0"+sunGetMonth:sunGetMonth) + (sunGetDate<10?"0"+sunGetDate:sunGetDate);

      var weekOfRef = new Firebase("https://bodyapp.firebaseio.com/classes/" + weekOf);  
      //This is a good way to do this, but functionality is slightly broken and it's dangerous.
      // weekOfRef.once('value', function(snapshot) {
      //   if (!snapshot.exists()) {
      //     //Sets up week for first time if doesn't exist
      //     console.log("Setting up week for first time.")
      //     for (var i = 0; i < 7; i++) {
      //       var thisDate = new Date(sunDate.getFullYear(), sunDate.getMonth(), sunDate.getDate() + i, 11, 0, 0);
      //       weekOfRef.child(DayOfWeekSetter.setDay(i)).update({    
      //         dayOfWeek: i,
      //         formattedDate: ""+(thisDate.getMonth()+1)+"/"+thisDate.getDate()+"",
      //         name: getDayOfWeek(i)
      //       })
      //     }
      //   }
      // })
      // var syncObject = $firebaseObject(weekOfRef);
      
      var trainerInfoToSave = {firstName: workoutToCreate.trainer.firstName, lastName: workoutToCreate.trainer.lastName, _id: workoutToCreate.trainer._id, facebookId: workoutToCreate.trainer.facebookId, gender: workoutToCreate.trainer.gender, picture: workoutToCreate.trainer.picture};
      if (workoutToCreate.trainer.trainerCredential1) trainerInfoToSave.trainerCredential1 = workoutToCreate.trainer.trainerCredential1;
      if (workoutToCreate.trainer.trainerCredential2) trainerInfoToSave.trainerCredential2 = workoutToCreate.trainer.trainerCredential2;
      if (workoutToCreate.trainer.trainerCredential3) trainerInfoToSave.trainerCredential3 = workoutToCreate.trainer.trainerCredential3;
      if (workoutToCreate.trainer.trainerCredential4) trainerInfoToSave.trainerCredential4 = workoutToCreate.trainer.trainerCredential4;
      if (workoutToCreate.trainer.trainerCredential1) trainerInfoToSave.trainerCredential1 = workoutToCreate.trainer.trainerCredential1;
      if (workoutToCreate.trainer.trainerCredential1) trainerInfoToSave.trainerCredential1 = workoutToCreate.trainer.trainerCredential1;
      if (workoutToCreate.trainer.trainerRating) trainerInfoToSave.trainerRating = workoutToCreate.trainer.trainerRating;
      if (workoutToCreate.trainer.funFacts) trainerInfoToSave.funFacts = workoutToCreate.trainer.funFacts;
      if (workoutToCreate.trainer.otherTidbits) trainerInfoToSave.otherTidbits = workoutToCreate.trainer.otherTidbits;

      workoutToCreate.playlistUrl = workoutToCreate.playlistUrl || playlists[0];

      // syncObject.$loaded().then(function() {
        //Set up the week if this is first class of week
        // if (!syncObject[DayOfWeekSetter.setDay(date.getDay())]) {
          
        // }

        //Set up the class
        var dayToSet = DayOfWeekSetter.setDay(date.getDay())
        var classToSetRef = weekOfRef.child(dayToSet).child("slots").child(date.getTime())
        // syncObject[dayToSet].slots = syncObject[dayToSet].slots || {}; 
        classToSetRef.set({
          time: timeFormatter(date),
          date: date.getTime(),
          playlistSource: 'SoundCloud',
          level: workoutToCreate.level,
          // playlist: workoutToCreate.playlistUrl,
          playlist: {
            soundcloudUrl: workoutToCreate.playlistUrl.uri,
            duration: workoutToCreate.playlistUrl.duration,
            id: workoutToCreate.playlistUrl.id,
            lastModified: new Date(workoutToCreate.playlistUrl.last_modified),
            title: workoutToCreate.playlistUrl.title,
            trackCount: workoutToCreate.playlistUrl.track_count,
            tracks: workoutToCreate.playlistUrl.tracks,
            // secretUri: workoutToCreate.playlistUrl.secret_uri,
            sharing: workoutToCreate.playlistUrl.sharing,
            user_id: workoutToCreate.playlistUrl.user_id
          },
          // stopwatch: {
          //   start: date.getTime(),
          //   stop: date.getTime(),
          //   currentState: "stop"
          // },
          trainer: trainerInfoToSave,
          classFull: false,
          consumersCanHearEachOther: false,
          musicVolume: 50,
          sessionId: nextSessionToSave.sessionId, 
          past: false,
          spots: 15
        }, function() {
          console.log("New workout saved.  Creating tokbox session.")
          if (workoutToCreate.level === "Intro") {
            console.log("Setting to upcomingIntros.")
            var introToSet = {};
            introToSet[date.getTime()] = true
            var fbRef = new Firebase("https://bodyapp.firebaseio.com"); 
            var upcomingIntroRef = fbRef.child('upcomingIntros').child(date.getTime())
            var dateKey = ""+date.getFullYear()+""+((date.getMonth()+1 < 10)?"0"+(date.getMonth()+1):date.getMonth()+1)+""+((date.getDate() < 10)?"0"+date.getDate():date.getDate())
            upcomingIntroRef.set(dateKey, function(){console.log("Saved Intro class to intro list")})
          }
          var trainerClassesRef = new Firebase("https://bodyapp.firebaseio.com/trainerClasses/");
          trainerClassesRef.child(trainerInfoToSave._id).child("classesTeaching").child(date.getTime()).set({date: date.getTime(), level: workoutToCreate.level}, function() {
            modalInstance.close();
          })

          User.createTokBoxSession({id: Auth.getCurrentUser()._id}).$promise.then(function(session) {
            nextSessionToSave = session;
              //Need to add class to trainer object somehow
            
          //   var dayToSet = DayOfWeekSetter.setDay(date.getDay())
          //   syncObject[dayToSet].slots[date.getTime()] = syncObject[dayToSet].slots[date.getTime()] || {}
          //   syncObject[dayToSet].slots[date.getTime()].sessionId = session.sessionId;
          //   syncObject.$save().then(function() {
          //     console.log("Tokbox session added to class object.")
          //     User.saveClassTaught({
          //       id: Auth.getCurrentUser()
          //     }, {
          //       classToAdd: date.getTime(), userToAddClassTo: trainerInfoToSave
          //     }).$promise.then(function(confirmation) {
          //       console.log("Successfully saved class +" + date.getTime() + " to " + workoutToCreate.trainer.firstName + "'s user object.")
          //       // $location.path('/');
          //       console.log("new workout saved");
                
          //     })
          //   })  
          // }).catch(function(err) {
          //   console.log("error saving new workout: " + err)
          // })
        })
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

    function newDate(date) {
      var newDate = new Date(date);
      newDate.month = newDate.getMonth() + 1;
      newDate.day = newDate.getDate();
      return newDate;
    }

    function getDayOfWeek(day) {
      switch (day) {
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
