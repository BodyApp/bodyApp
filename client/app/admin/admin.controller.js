'use strict';

angular.module('bodyAppApp')
  .controller('AdminCtrl', function ($scope, $http, $location, $uibModal, SoundCloudLogin, SoundCloudAPI, Auth, User, DayOfWeekSetter, $firebaseObject, $firebaseArray, $stateParams) {
    // if (!(Auth.isInstructor() || Auth.isAdmin())) {
    //   $location.path('/')
    // }

    Auth.getCurrentUser().$promise.then(function(data){
      if (data.role != "admin") {
        console.log("You aren't an admin, so you can't access this page")
        console.log(data);
        $location.path('/')
      }
      $scope.currentUser = data;

      thisWeek()

      User.getMembersOfStudio({
        id: data._id
      }, {
        studioId: $stateParams.studioId
      }).$promise.then(function(memberList) {
        // console.log(memberList)
        $scope.memberList = memberList
      })
    })

    var todayDate = new Date();
    $scope.todayDayOfWeek = todayDate.getDay();
    
    // Use the User $resource to fetch all users
    // $scope.users = User.query();

    $scope.wod = {};
    var classDate;
    var classKey;
    var ref;
    var studioId = $stateParams.studioId;
    if (studioId) {
      ref = new Firebase("https://bodyapp.firebaseio.com/studios").child(studioId);
    } else {
      // $location.path('/ralabala/admin')
      ref = new Firebase("https://bodyapp.firebaseio.com/studios").child("ralabala");
    }

    var wodRef = ref.child("WODs");
    var trainerClassesRef = ref.child("trainerClasses");

    $scope.scoreTypes = []
    $scope.scoreTypes.push({label: "Time To Complete", id: 0})
    $scope.scoreTypes.push({label: "Rounds Completed", id: 1})

    $scope.instructors = [];
    $scope.levels = ["Intro", "Test", "Open"]  
    ref.child("classTypes").once('value', function(snapshot) {
      console.log(snapshot.val())
      snapshot.forEach(function(child) {
        $scope.levels.push(child.val())  
      })
    })

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

    Auth.getCurrentUser().$promise.then(function(data) {
      createInitialTokBoxSession()
    })

    ref.child('trainers').once('value', function(snapshot) {
      $scope.trainers = snapshot.val();
    })

    // createInitialTokBoxSession()

    function createInitialTokBoxSession() {
      User.createTokBoxSession({id: Auth.getCurrentUser()._id}).$promise.then(function(session) {
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

      var weekOfRef = ref.child("classes").child(weekOf);  
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
      if (workoutToCreate.trainer.funFact) trainerInfoToSave.funFact = workoutToCreate.trainer.funFact;
      if (workoutToCreate.trainer.bio) trainerInfoToSave.bio = workoutToCreate.trainer.bio;

      workoutToCreate.playlistUrl = workoutToCreate.playlistUrl || playlists[0];

      ref.child("trainers").child(trainerInfoToSave._id).update(trainerInfoToSave)

      ref.child("playlists").child(workoutToCreate.playlistUrl.id).update({
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
      }, function(err){if (err) console.log(err)})

      // syncObject.$loaded().then(function() {
        //Set up the week if this is first class of week
        // if (!syncObject[DayOfWeekSetter.setDay(date.getDay())]) {
          
        // }

        //Set up the class
        var dayToSet = DayOfWeekSetter.setDay(date.getDay())

        //Sets up day metadata
        var thisDate = new Date(sunDate.getFullYear(), sunDate.getMonth(), sunDate.getDate() + date.getDay(), 11, 0, 0);
        weekOfRef.child(dayToSet).update({    
          dayOfWeek: date.getDay(),
          formattedDate: ""+(thisDate.getMonth()+1)+"/"+thisDate.getDate()+"",
          name: getDayOfWeek(date.getDay())
        })
        
        var classToSetRef = weekOfRef.child(dayToSet).child("slots").child(date.getTime())
        // syncObject[dayToSet].slots = syncObject[dayToSet].slots || {}; 
        classToSetRef.set({
          time: timeFormatter(date),
          date: date.getTime(),
          playlistSource: 'SoundCloud',
          level: workoutToCreate.level,
          playlist: workoutToCreate.playlistUrl.id,
          // playlist: {
          //   soundcloudUrl: workoutToCreate.playlistUrl.uri,
          //   duration: workoutToCreate.playlistUrl.duration,
          //   id: workoutToCreate.playlistUrl.id,
          //   lastModified: new Date(workoutToCreate.playlistUrl.last_modified),
          //   title: workoutToCreate.playlistUrl.title,
          //   trackCount: workoutToCreate.playlistUrl.track_count,
          //   tracks: workoutToCreate.playlistUrl.tracks,
          //   // secretUri: workoutToCreate.playlistUrl.secret_uri,
          //   sharing: workoutToCreate.playlistUrl.sharing,
          //   user_id: workoutToCreate.playlistUrl.user_id
          // },
          // stopwatch: {
          //   start: date.getTime(),
          //   stop: date.getTime(),
          //   currentState: "stop"
          // },
          trainer: trainerInfoToSave._id,
          classFull: false,
          // consumersCanHearEachOther: false,
          // musicVolume: 50,
          sessionId: nextSessionToSave.sessionId, 
          spots: 12
        }, function(err) {
          if (err) return console.log(err)
          console.log("New workout saved to classes object.")
          // if (workoutToCreate.level === "Intro") {
          //   console.log("Setting to upcomingIntros.")
          //   var introToSet = {};
          //   introToSet[date.getTime()] = true
            // var fbRef = new Firebase("https://bodyapp.firebaseio.com"); 
            // var upcomingIntroRef = fbRef.child('upcomingIntros').child(date.getTime())
            // var dateKey = ""+date.getFullYear()+""+((date.getMonth()+1 < 10)?"0"+(date.getMonth()+1):date.getMonth()+1)+""+((date.getDate() < 10)?"0"+date.getDate():date.getDate())
            // upcomingIntroRef.set(dateKey, function(){console.log("Saved Intro class to intro list")})
          // }

          trainerClassesRef.child(trainerInfoToSave._id).child("classesTeaching").child(date.getTime()).set({date: date.getTime(), level: workoutToCreate.level}, function(err) {
            modalInstance.close();
            if (err) console.log(err)
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

      $scope.changeWeek = function() {
        if ($scope.thisWeek) {
          $scope.setCalendarToNextWeek()
        } else {
          $scope.setCalendarToThisWeek()
        }
      }

      $scope.setCalendarToThisWeek = function() { thisWeek() }
      function thisWeek() {
        $scope.thisWeek = true; 
        
        $scope.dateToday = "" + todayDate.getMonth() + todayDate.getDate();

        var sunDate = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate() - todayDate.getDay(), 11, 0, 0);
        // var sunDate = new Date();
        // sunDate.setDate(todayDate.getDate() - todayDate.getDay());
        var sunGetDate = sunDate.getDate();
        var sunGetMonth = sunDate.getMonth()+1;
        var sunGetYear = sunDate.getFullYear();
        var weekOf = "weekof"+ sunGetYear + (sunGetMonth<10?"0"+sunGetMonth:sunGetMonth) + (sunGetDate<10?"0"+sunGetDate:sunGetDate);
        
        $scope.days = $firebaseObject(ref.child("classes").child(weekOf))
      }

      $scope.setCalendarToNextWeek = function() { nextWeek() }
      function nextWeek() {
        $scope.thisWeek = false;
        var todayDate = new Date();
        var nextWeekTime = todayDate.getTime() + 1000*60*60*24*7;
        var nextWeekDate = new Date(nextWeekTime);
        $scope.dateToday = "" + nextWeekDate.getMonth() + nextWeekDate.getDate();

        var sunDate = new Date(nextWeekDate.getFullYear(), nextWeekDate.getMonth(), nextWeekDate.getDate() - nextWeekDate.getDay(), 11, 0, 0);
        // var sunDate = new Date();
        // sunDate.setDate(nextWeekDate.getDate() - nextWeekDate.getDay());
        var sunGetDate = sunDate.getDate();
        var sunGetMonth = sunDate.getMonth()+1;
        var sunGetYear = sunDate.getFullYear();
        var weekOf = "weekof"+ sunGetYear + (sunGetMonth<10?"0"+sunGetMonth:sunGetMonth) + (sunGetDate<10?"0"+sunGetDate:sunGetDate);

        // unbindMethod()
        $scope.days = $firebaseObject(ref.child("classes").child(weekOf))
        // Schedule.setFirebaseObject(weekOf).$bindTo($scope, 'days').then(function(unbind) {
          // unbindMethod = unbind
        // });
      }

      $scope.getFormattedDateTime = function(slot, noToday) {
          slot = slot || {};
          slot.date = slot.date || new Date();
          var newDate = new Date(slot.date);
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

      $scope.checkIfFriends = function(slot) {
        console.log("yo")
        var rightNow = new Date().getTime();
        ref.child("bookings").child(slot.date).once('value', function(snapshot) {
          $scope.bookingsBySlot = $scope.bookingsBySlot || {};
          $scope.bookingsBySlot[slot.date] = [];
          if (!snapshot.exists()) return
          for (var prop in snapshot.val()) {
            var user = snapshot.val()[prop];
            $scope.bookingsBySlot[slot.date].push(user);
            if(!$scope.$$phase) $scope.$apply();
          }
        })
      }

      $scope.deleteClass = function(slot) {
        if (confirm("Are you sure you want to delete class?") === true) {
          var slotDate = new Date(slot.date)
          
          var sunDate = new Date(slotDate.getFullYear(), slotDate.getMonth(), slotDate.getDate() - slotDate.getDay(), 11, 0, 0);
          var sunGetDate = sunDate.getDate();
          var sunGetMonth = sunDate.getMonth()+1;
          var sunGetYear = sunDate.getFullYear();
          var weekOf = "weekof"+ sunGetYear + (sunGetMonth<10?"0"+sunGetMonth:sunGetMonth) + (sunGetDate<10?"0"+sunGetDate:sunGetDate);

          var dayOfSlot = DayOfWeekSetter.setDay(slotDate.getDay())
          ref.child("classes").child(weekOf).child(dayOfSlot).child("slots").child(slot.date).remove(function() {
            ref.child("trainerClasses").child(slot.trainer).child("classesTeaching").child(slot.date).remove(function() {
              console.log("Class successfully removed.")
            })
          })
        }
      }
  });
