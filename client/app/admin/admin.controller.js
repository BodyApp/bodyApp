'use strict';

angular.module('bodyAppApp')
  .controller('AdminCtrl', function ($scope, $http, $location, $modal, SoundCloudLogin, SoundCloudAPI, Auth, User, $firebaseObject, $firebaseArray) {
    // if (!(Auth.isInstructor() || Auth.isAdmin())) {
    //   $location.path('/')
    // }

    // if (!Auth.isAdmin()) {
    //   $location.path('/')
    // }
    // Use the User $resource to fetch all users
    // $scope.users = User.query();

    var wodRef = new Firebase("https://bodyapp.firebaseio.com/WOD");
    $scope.wod = $firebaseObject(wodRef);

    $scope.instructors = [];
    $scope.levels = ["Intro", "Level One", "Level Two", "Level Three"]
    $scope.workoutToCreate = {playlistUrl: {title: "Connect with SoundCloud Below"}, level: $scope.levels[0]};
    getAdminsAndInstructors()
    
    $scope.playlists = [];
    var defaultPlaylist;
    loadDefaultPlaylist();

    $scope.createdClass = {};
    
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
      // if (user.role === "instructor") {
      //   $scope.instructors = user;
      // } else {
      // if (Auth.isAdmin()) {
        // var instructors = Auth.getInstructors().$promise.then(function(data) {
        //   $scope.instructors = data;
          
        //   Auth.getAdmins().$promise.then(function(data) {
        //     for (var i = 0; i < data.length; i++) {
        //       $scope.instructors.push(data[i]);              
        //     }
        //     $scope.workoutToCreate.trainer = $scope.instructors[0];  
        //   }).catch(function(err) { console.log(err)})

        // }).catch(function(err) {
        //   console.log(err);
        // });;
      // } else {
        $scope.instructors.push(Auth.getCurrentUser());
        $scope.workoutToCreate.trainer = $scope.instructors[0];  
      // }
      // }
    }

    function openCreatingModal() {
        var modalInstance = $modal.open({
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
      var date = workoutToCreate.date;
      var workoutDate = new Date(date);
      // $scope.workoutDate = workoutDate
      var todayDayOfWeek = workoutDate.getDay();

      var sunDate = new Date();
      sunDate.setDate(workoutDate.getDate() - workoutDate.getDay());
      var sunGetDate = sunDate.getDate();
      var sunGetMonth = sunDate.getMonth()+1;
      var sunGetYear = sunDate.getFullYear();
      var weekOf = "weekof"+ (sunGetMonth<10?"0"+sunGetMonth:sunGetMonth) + (sunGetDate<10?"0"+sunGetDate:sunGetDate) + sunGetYear;

      var weekOfRef = new Firebase("https://bodyapp.firebaseio.com/" + weekOf);  
      var syncObject = $firebaseObject(weekOfRef);
      
      workoutToCreate.playlistUrl = workoutToCreate.playlistUrl || playlists[0];

      //Set up the week if this is first class of week
      if (!syncObject[date.getDay()]) {
        for (var i = 0; i < 7; i++) {
          var thisDate = new Date();
          thisDate.setDate(sunDate.getDate() + i)

          syncObject[i] = {    
            dayOfWeek: i,
            formattedDate: ""+(thisDate.getMonth()+1)+"/"+thisDate.getDate()+"",
            name: getDayOfWeek(i),
            slots: {}
          };
        }
      }

      //Set up the class
      syncObject[date.getDay()].slots = syncObject[date.getDay()].slots || {} 
      syncObject[date.getDay()].slots[date.getTime()] = {
        time: timeFormatter(date),
        date: date.getTime(),
        booked: false,
        playlistSource: 'SoundCloud',
        level: workoutToCreate.level,
        bookedUsers: {},
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
        trainer: workoutToCreate.trainer,
        classFull: false,
        musicVolume: 50,
        past: false,
        spots: 12,
        spotsTaken: 0
      }

      var modalInstance = openCreatingModal();

      User.createTokBoxSession({id: Auth.getCurrentUser()._id}).$promise.then(function(session) {
        syncObject[date.getDay()] = syncObject[date.getDay()] || {}
        syncObject[date.getDay()].slots = syncObject[date.getDay()].slots || {}
        syncObject[date.getDay()].slots[date.getTime()].sessionId = session.sessionId;
        syncObject.$save().then(function() {
          console.log("new workout saved");
          modalInstance.close();
          if (workoutToCreate.level === "Intro") {
            var fbRef = new Firebase("https://bodyapp.firebaseio.com"); 
            var upcomingIntroRef = $firebaseArray(fbRef.child('upcomingIntros'))
            upcomingIntroRef.$add(date.getTime())
            // var upcomingIntroRef = $firebaseObject(fbRef.child('upcomingIntros').child(date.getTime()))
            // upcomingIntroRef["numInClass"] = 0
            // upcomingIntroRef.$save()
          }

          User.saveClassTaught({id: Auth.getCurrentUser()}, {classToAdd: date.getTime(), userToAddClassTo: workoutToCreate.trainer}).$promise.then(function(confirmation) {
            console.log("Successfully saved class +" + date.getTime() + " to " + workoutToCreate.trainer.firstName + "'s user object.")
          })
          $location.path('/');
        }).catch(function(err) {
          console.log("error saving new workout: " + err)
        })
      }, function(err) {
        console.log(err)
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
