'use strict';

angular.module('bodyAppApp')
  .controller('ClassStartingCtrl', function ($scope, $location, $interval, $timeout, $uibModal, $firebaseObject, Schedule, Auth, User, Video, DayOfWeekSetter) {
  	
    var classTime;
    var currentUser = Auth.getCurrentUser();
    $scope.currentUser = currentUser;

    var API_KEY = 45425152;;
    var SESSION_ID;
    var TOKEN;

    var TEST_TIMEOUT_MS = 10000; // Internet test lasts 15 seconds.  Increase to increase reliability of the test.

    var timeoutMs = TEST_TIMEOUT_MS;
    // test.testSuccess = false;

    var publisherEl;
    var subscriberEl;

    var session;
    var publisher;
    var subscriber;
    var statusContainerEl;
    var statusMessageEl;
    var statusIconEl;

    var callbacks;

    var networkBitsThreshold = 100000;
    var networkDroppedPackets = 0.1;

    var funnyPhrases = ["Personal Unicorn Sanctuary", "Internet Iditarod", "Gateway to Sexiness", "Squat Paradise", "Pathway to Fitness and Fame", "Favorite Workout Ever", "Fitness Oasis", "Favorite Workout Class", "Upgraded BODY", "Calorie Burnin' Bonfire", "Fitness in a Bottle", "Great Life Decision", "First Step Turning Your Dreams into Reality"]

    var classToJoin;
    var classDate;
    var sunDate;
    // var sunDate = new Date();
    // sunDate.setDate(classDate.getDate() - classDate.getDay());
    var sunGetDate;
    var sunGetMonth;
    var sunGetYear;
    var weekOf;

    var ref = new Firebase("https://bodyapp.firebaseio.com/");
    var classObjRef;

    var userRef;

    var checkTimeInterval;

    //This should be turned into a $promise
    var setupInterval = $interval(function() {
      if (Schedule.classUserJustJoined) {
        $interval.cancel(setupInterval)
        setup()
      }
    }, 250, 20);

    function setup() {
      classToJoin = Schedule.classUserJustJoined;
      classTime = classToJoin.date;
      classDate = new Date(classToJoin.date)
      sunDate = new Date(classDate.getFullYear(), classDate.getMonth(), classDate.getDate() - classDate.getDay(), 11, 0, 0);
      sunGetDate = sunDate.getDate();
      sunGetMonth = sunDate.getMonth()+1;
      sunGetYear = sunDate.getFullYear();
      weekOf = "weekof"+ sunGetYear + (sunGetMonth<10?"0"+sunGetMonth:sunGetMonth) + (sunGetDate<10?"0"+sunGetDate:sunGetDate);
      
      $scope.minutesUntilClass = Math.round(((classTime - new Date().getTime())/1000)/60, 0);

      classObjRef = $firebaseObject(ref
        .child("classes")
        .child(weekOf)
        .child(DayOfWeekSetter.setDay(classDate.getDay()))
        .child("slots")
        .child(classDate.getTime())
      )

      userRef = ref.child("bookings")
      .child(classToJoin.date)
      .child(currentUser._id)

      $scope.classToJoin = classToJoin;
      console.log($scope.classToJoin);

      $scope.overlay1 = true;
      $scope.overlay2 = false;
      $scope.overlay3 = false;
      $scope.overlay4 = false
      $scope.tab1 = true;
      $scope.tab2 = false;
      $scope.instructorBio = false;

      if (!classToJoin) {
        $location.path('/')
      }

      //Check that using Chrome or Firefox
      if (OT.checkSystemRequirements() != 1 || typeof InstallTrigger !== 'undefined') {
        // The client does not support WebRTC.
        var modalInstance = $uibModal.open({
          animation: true,
          backdrop: "static",
          keyboard: false,
          templateUrl: 'app/video/wrongBrowser.html',
          controller: 'WrongBrowserCtrl',
        });

        modalInstance.result.then(function (selectedItem) {
        }, function () {
        });
      }
      
      $scope.phrase = funnyPhrases[Math.floor(Math.random() * funnyPhrases.length)]

      // $scope.instructor = classToJoin.trainer
      // $scope.instructorPicUrl = $scope.instructor.picture

      if (currentUser._id != classToJoin.trainer._id && currentUser.role != 'admin') {
        $scope.networkTestCountdown = timeoutMs + 6000
        $scope.testingNetwork = true;
        $timeout(function() {
          console.log("Prevented standstill at loading screen.")
          $scope.testingNetwork = false;
        }, $scope.networkTestCountdown)
        conductInternetTest(classToJoin.sessionId);
      }



      $scope.numBookedUsers;
      $scope.bookedUsers;

      $scope.trainerRatingRounded;

      getBookedUsers(classToJoin);

      classObjRef.$loaded().then(function() {
        $scope.trainerRatingRounded = Math.round(classObjRef.trainer.trainerRating * 10)/10
        // classObjRef.$watch(function(e) {
        //   getBookedUsers(classObjRef);
        // })
        setupVidAud()
      });

      checkTimeInterval = $interval(function(){ checkTime() }, 20*1000)

      $scope.$on("$destroy", function() { // destroys the session when navigate away
        console.log("Disconnecting session because navigated away.")
        session.disconnect()
        publisher.destroy();
        // session.destroy();
        if (checkTimeInterval) clearInterval(checkTimeInterval)
        $interval.cancel(checkTimeInterval);
      });
    }
    

    // $scope.audioInputDevices;
    // $scope.videoInputDevices;

    // OT.getDevices(function(error, devices) {
    //   if (devices) {
    //     $scope.audioInputDevices = devices.filter(function(element) {
    //       return element.kind == "audioInput";
    //     });
    //     $scope.videoInputDevices = devices.filter(function(element) {
    //       return element.kind == "videoInput";
    //     });
    //     // for (var i = 0; i < $scope.audioInputDevices.length; i++) {
    //     //   console.log("audio input device: ", $scope.audioInputDevices[i]);
    //     // }
    //     // for (i = 0; i < $scope.videoInputDevices.length; i++) {
    //     //   console.log("video input device: ", $scope.videoInputDevices[i]);
    //     // }
    //     $scope.audioInput = $scope.audioInputDevices[0];
    //     if ($scope.audioInput) $scope.setAudioInput($scope.audioInput);
    //     $scope.videoInput = $scope.videoInputDevices[0];
    //     if ($scope.videoInput) $scope.setVideoInput($scope.videoInput);
    //   }
    // });

    function setVideoInput(videoInput) {
      Video.setVideoInput(videoInput);
    }

    function setAudioInput(audioInput) {
      Video.setAudioInput(audioInput);
    }

    function getBookedUsers(classJoined) {
      $scope.bookedUsers = [];

      var bookedUsersRef = ref.child("bookings").child(classToJoin.date);

      bookedUsersRef.on('value', function(snapshot) {
        var bookedUsersReturned = snapshot.val();
        if (snapshot.exists()) {
          $scope.numBookedUsers = Object.keys(snapshot.val()).length;
          $scope.bookedUsers = {};
          console.log(snapshot.val())
          for (var bookedUser in snapshot.val()) {
            if (bookedUser) {
            $scope.bookedUsers[bookedUsersReturned[bookedUser].facebookId] = bookedUsersReturned[bookedUser];
              // Adds security where injuries aren't available unless current user is admin or instructor.
              if (currentUser.role === "admin" || currentUser._id === classToJoin.trainer._id) {
                // console.log(bookedUser)
                var something = User.getUserAndInjuries({id: $scope.currentUser._id}, {userToGet: bookedUser}).$promise.then(function(data) {
                  if (data.injuries && data.profile) {
                    // console.log(userToAdd)
                    // console.log(data)
                    // var userToAdd = data.profile;
                    if ($scope.bookedUsers[data.profile.facebookId]) $scope.bookedUsers[data.profile.facebookId].injuries = data.injuries;
                    // userToAdd.injuries = data.injuries
                    // if (data.profile && data.profile.facebookId) $scope.bookedUsers[data.profile.facebookId] = userToAdd;
                    // console.log($scope.bookedUsers);
                    if(!$scope.$$phase) $scope.$apply();  
                  } 
                  // else {
                  //   // if (data.profile && data.profile.facebookId) $scope.bookedUsers[data.profile.facebookId] = data.profile;
                  //   console.log($scope.bookedUsers)
                  //   if(!$scope.$$phase) $scope.$apply();  
                  // }
                }).catch(function(err) {
                  // $scope.bookedUsers[bookedUsersReturned[bookedUser].facebookId] = bookedUsersReturned[bookedUser];
                  // console.log($scope.bookedUsers)
                  console.log(err);
                })
              } 
              // else {
              //   $scope.bookedUsers[bookedUsersReturned[bookedUser].facebookId] = bookedUsersReturned[bookedUser];

              //   if(!$scope.$$phase) $scope.$apply();  
              // }    
            }
          }
        }
      })
    }

  	function checkTime() {
      if (!classToJoin) $location.path('/');
  		$scope.minutesUntilClass = Math.round(((classToJoin.date - new Date().getTime())/1000)/60, 0);
  		// $scope.$apply();
  		// if ($scope.minutesUntilClass <= 0) {
  			// $scope.joinClassActive = true;
  			// $location.path('/consumervideo')
  		// }
  	}

    $scope.navigateToVideo = function() {
      if (currentUser._id === classToJoin.trainer._id) {
        if (checkTimeInterval) clearInterval(checkTimeInterval)
        $location.path('/trainervideo')
      } else {
        if (checkTimeInterval) clearInterval(checkTimeInterval)
        $location.path('/consumervideo')
      }
    }

    function setupVidAud() {
      var element = document.querySelector('#audioVideoSetup');
      var component = Video.hardwareSetup(element);
    }

    $scope.setToSee = function(pageToView) {
      $scope.overlay1 = false;
      $scope.overlay2 = false;
      $scope.overlay3 = false;
      $scope.overlay3 = false;
      switch (pageToView) {
        case 0: return $scope.overlay1 = true; break;
        case 1: return $scope.overlay2 = true; break;
        case 2: return $scope.overlay3 = true; break;
        case 3: return $scope.overlay4 = true; break;
        default: break;
      }
    }

    $scope.setToSee2 = function(pageToView) {
      $scope.tab1 = false;
      $scope.tab2 = false;
      // $scope.tab3 = false;
      switch (pageToView) {
        case 0: return $scope.tab1 = true; break;
        case 1: return $scope.tab2 = true; break;
        // case 2: return $scope.tab3 = true; break;
        default: break;
      }
    }      

    //Internet Test

    function conductInternetTest(sessionId) {  
      publisherEl = document.createElement('div');
      subscriberEl = document.createElement('div');

      SESSION_ID = sessionId;
      User.createTokBoxToken({ id: currentUser._id }, {
        sessionId: sessionId
      }, function(token) {
        TOKEN = token.token;
        publisher = OT.initPublisher(publisherEl, {}, callbacks.onInitPublisher);
        session = OT.initSession(API_KEY, SESSION_ID);
        session.connect(TOKEN, callbacks.onConnect);
      }, function(err) {
          console.log(err);
      }).$promise;
    }

    var testStreamingCapability = function(subscriber, callback) {
      performQualityTest({subscriber: subscriber, timeout: TEST_TIMEOUT_MS}, function(error, results) {
        console.log('Test concluded', results);

        var audioVideoSupported = results.video.bitsPerSecond > networkBitsThreshold &&
          results.video.packetLossRatioPerSecond < networkDroppedPackets
          // results.audio.bitsPerSecond > 25000 &&
          // results.audio.packetLossRatioPerSecond < 0.05;

        session.disconnect()
        publisher.disconnect();
        publisher.destroy();

        if (audioVideoSupported) {
          console.log("Passed network test")
          $scope.testingNetwork = false;
          if(!$scope.$$phase) $scope.$apply();  
          userRef.child("passedNetworkTest").push({time: new Date().getTime(), results: results})  
          // test.testSuccess = true;
          return callback(false, {
            text: 'You\'re all set!',
            icon: 'assets/icon_tick.svg'
          });
        } else {
          userRef.child("failedNetworkTest").push({time: new Date().getTime(), results: stats})
          console.log("Your internet connection is too slow.")
          var modalInstance = $uibModal.open({
            animation: true,
            backdrop: "static",
            keyboard: false,
            templateUrl: 'app/video/badInternet.html',
            controller: 'BadInternetCtrl',
            windowClass: "modal-tall"
          });

          modalInstance.result.then(function (selectedItem) {
          }, function () {
          });
          return false;
        }

        // if (results.audio.packetLossRatioPerSecond < 0.05) {
        //   return callback(false, {
        //     text: 'Your bandwidth can support audio only',
        //     icon: 'assets/icon_warning.svg'
        //   });
        // }
      });
    };

    callbacks = {
      onInitPublisher: function onInitPublisher(error) {
        if (error) {
          setText(statusMessageEl, 'Could not acquire your camera');
          return;
        }

        setText(statusMessageEl, 'Connecting to session');
      },

      onPublish: function onPublish(error) {
        if (error) {
          // handle publishing errors here
          setText(
            statusMessageEl,
            'Could not publish video'
          );
          return;
        }

        setText(
          statusMessageEl,
          'Subscribing to video'
        );

        subscriber = session.subscribe(
          publisher.stream,
          subscriberEl,
          {
            audioVolume: 0,
            testNetwork: true
          },
          callbacks.onSubscribe
        );
      },

      cleanup: function() {
        session.unsubscribe(subscriber);
        session.unpublish(publisher);
      },

      onSubscribe: function onSubscribe(error, subscriber) {
        if (error) {
          // setText(statusMessageEl, 'Could not subscribe to video');
          return;
        }

        setText(statusMessageEl, 'Checking your available bandwidth');

        testStreamingCapability(subscriber, function(error, message) {
          callbacks.cleanup();
        });
      },

      onConnect: function onConnect(error) {
        if (error) {
          // setText(statusMessageEl, 'Could not connect to OpenTok');
        }
      }
    };

    compositeOfCallbacks(
      callbacks,
      ['onInitPublisher', 'onConnect'],
      function(error) {
        if (error) {
          var modalInstance = $uibModal.open({
            animation: true,
            backdrop: "static",
            keyboard: false,
            templateUrl: 'app/video/badInternet.html',
            controller: 'BadInternetCtrl',
            windowClass: "modal-tall"
          });

          modalInstance.result.then(function (selectedItem) {
          }, function () {
          });
          return;
        }

        setText(statusMessageEl, 'Publishing video');
        session.publish(publisher, callbacks.onPublish);
      }
    );

    // Helpers
    function setText(el, text) {
      if (!el) {
        return;
      }

      if (el.textContent) {
        el.textContent = text;
      }

      if (el.innerText) {
        el.innerText = text;
      }
    }

    function pluck(arr, propertName) {
      return arr.map(function(value) {
        return value[propertName];
      });
    }

    function sum(arr, propertyName) {
      if (typeof propertyName !== 'undefined') {
        arr = pluck(arr, propertyName);
      }

      return arr.reduce(function(previous, current) {
        return previous + current;
      }, 0);
    }

    function max(arr) {
      return Math.max.apply(undefined, arr);
    }

    function min(arr) {
      return Math.min.apply(undefined, arr);
    }

    function calculatePerSecondStats(statsBuffer, seconds) {
      var stats = {};
      ['video', 'audio'].forEach(function(type) {
        stats[type] = {
          packetsPerSecond: sum(pluck(statsBuffer, type), 'packetsReceived') / seconds,
          bitsPerSecond: (sum(pluck(statsBuffer, type), 'bytesReceived') * 8) / seconds,
          packetsLostPerSecond: sum(pluck(statsBuffer, type), 'packetsLost') / seconds
        };
        stats[type].packetLossRatioPerSecond = (
          stats[type].packetsLostPerSecond / stats[type].packetsPerSecond
        );
      });

      stats.windowSize = seconds;
      return stats;
    }

    function getSampleWindowSize(samples) {
      var times = pluck(samples, 'timestamp');
      return (max(times) - min(times)) / 1000;
    }

    if (!Array.prototype.forEach) {
      Array.prototype.forEach = function(fn, scope) {
        for (var i = 0, len = this.length; i < len; ++i) {
          fn.call(scope, this[i], i, this);
        }
      };
    }

    function compositeOfCallbacks(obj, fns, callback) {
      var results = {};
      var hasError = false;

      var checkDone = function checkDone() {
        if (Object.keys(results).length === fns.length) {
          callback(hasError, results);
          callback = function() {};
        }
      };

      fns.forEach(function(key) {
        var originalCallback = obj[key];

        obj[key] = function(error) {
          results[key] = {
            error: error,
            args: Array.prototype.slice.call(arguments, 1)
          };

          if (error) {
            hasError = true;
          }

          originalCallback.apply(obj, arguments);
          checkDone();
        };
      });
    }

    function bandwidthCalculatorObj(config) {
      var intervalId;

      config.pollingInterval = config.pollingInterval || 500;
      config.windowSize = config.windowSize || 2000;
      if (!config.subscriber) return
      config.subscriber = config.subscriber || undefined;

      return {
        start: function(reportFunction) {
          var statsBuffer = [];
          var last = {
            audio: {},
            video: {}
          };

          intervalId = window.setInterval(function() {
            config.subscriber.getStats(function(error, stats) {
              var snapshot = {};
              var nowMs = new Date().getTime();
              var sampleWindowSize;

              ['audio', 'video'].forEach(function(type) {
                snapshot[type] = Object.keys(stats[type]).reduce(function(result, key) {
                  result[key] = stats[type][key] - (last[type][key] || 0);
                  last[type][key] = stats[type][key];
                  return result;
                }, {});
              });

              // get a snapshot of now, and keep the last values for next round
              snapshot.timestamp = stats.timestamp;

              statsBuffer.push(snapshot);
              statsBuffer = statsBuffer.filter(function(value) {
                return nowMs - value.timestamp < config.windowSize;
              });

              sampleWindowSize = getSampleWindowSize(statsBuffer);

              if (sampleWindowSize !== 0) {
                reportFunction(calculatePerSecondStats(
                  statsBuffer,
                  sampleWindowSize
                ));
              }
            });
          }, config.pollingInterval);
        },

        stop: function() {
          window.clearInterval(intervalId);
        }
      };
    }

    function performQualityTest(config, callback) {
      var startMs = new Date().getTime();
      var testTimeout;
      var currentStats;

      var bandwidthCalculator = bandwidthCalculatorObj({
        subscriber: config.subscriber
      });

      var cleanupAndReport = function() {
        currentStats.elapsedTimeMs = new Date().getTime() - startMs;
        callback(undefined, currentStats);

        window.clearTimeout(testTimeout);
        bandwidthCalculator.stop();

        callback = function() {};
      };

      // bail out of the test after 30 seconds
      window.setTimeout(cleanupAndReport, config.timeout);

      bandwidthCalculator.start(function(stats) {
        if (stats.video.bitsPerSecond < networkBitsThreshold || stats.video.packetLossRatioPerSecond > networkDroppedPackets) { //Made much less stringent for this iteration.
        // if (stats.video.bitsPerSecond < 250000 || stats.video.packetLossRatioPerSecond > 0.05) {
          window.clearTimeout(testTimeout);
          bandwidthCalculator.stop();
          session.disconnect()
          publisher.disconnect();
          publisher.destroy();
          console.log(stats);
          userRef.child("failedNetworkTest").push({time: new Date().getTime(), results: stats})
          // classRef.bookedUsers[currentUser._id]["failedNetworkTest"] = classRef.bookedUsers[currentUser._id]["failedNetworkTest"] || []
          // classRef.bookedUsers[currentUser._id]["failedNetworkTest"].push({time: new Date().getTime(), results: stats})
          // classRef.$save()
          // classRef.child("bookedUsers").child(currentUser._id).child("failedNetworkTest").update(stats)
          //Pop up modal with warning that internet isn't going to work.
          // alert("Your internet connection is too low quality to participate in BODY classes.  Please improve your connection and try joining this class again.")
          var modalInstance = $uibModal.open({
            animation: true,
            backdrop: "static",
            keyboard: false,
            templateUrl: 'app/video/badInternet.html',
            controller: 'BadInternetCtrl',
            windowClass: "modal-tall"
          });

          modalInstance.result.then(function (selectedItem) {
          }, function () {
          });
          return false;
        }

        // you could do something smart here like determine if the bandwidth is
        // stable or acceptable and exit early
        currentStats = stats;
      });
    }  

    $scope.auditClass = function() {
      $scope.auditingClass = Schedule.auditClass()
    }

    $scope.cancelAuditClass = function() {
      $scope.auditingClass = Schedule.cancelAuditClass()
    }

    // load cookie, or start new tour
    // $scope.currentStep = 0;

    // save cookie after each step
    // $scope.stepComplete = function() {
    //   // ipCookie('dashboardTour', $scope.currentStep, { expires: 3000 });
    //   $scope.currentStep = 0
    // };
    
    // // callback for when we've finished going through the tour
    // $scope.postTourCallback = function() {
    //   $scope.currentStep = 0
    //   console.log('tour over');
    // };
    // // optional way of saving tour progress with cookies
    // $scope.postStepCallback = function() {
    //     $scope.currentStep = 0
    //   // ipCookie('dashboardTour', $scope.currentStep, { expires: 3000 });
    // };
  })