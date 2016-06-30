'use strict';

angular.module('bodyAppApp')
.controller('VideoCtrl', function ($scope, $location, Video, User, Auth) {

	var studioId = Video.getStudio();
	$scope.studioId = studioId;
	var classId = Video.getClassId();

	var currentUser = Auth.getCurrentUser()

	if (!studioId || !classId) {
		return $location.path('/')
	}

	var ref = firebase.database().ref().child('studios').child(studioId);
  var storageRef = firebase.storage().ref().child('studios').child(studioId);
  var auth = firebase.auth();

  var audioPlayer;
  var element = document.getElementById('audioPlayer')
  if (typeof SC !== 'undefined' && SC.Widget != 'undefined') {
		audioPlayer = SC.Widget(element);
		audioPlayer.setVolume(0)
	}

  $scope.showWorkout = true;
  var userIsInstructor;

  var session;
  var publisher;
  var publisherInitialized;
	var connected;
  $scope.consumerObjects = {};
  var previouslyClickedConsumerId;
  var connectionCount = 0;

  var viewCounter = 3;
  var viewOptions = ["user-videos-stack", "user-videos-boxed", "user-videos-grid"]
  $scope.videoView = viewOptions[0]

  generateTimerOptions()
  $scope.timerWorking = true;

	auth.onAuthStateChanged(function(user) {
    if (user) {     
      getClassDetails()
      getBookedUsers()
      getHeaderImage()
      receiveRealTimeData()
    }
  })

  $scope.$on("$destroy", function() { // destroys the session and turns off green light when navigate away
  	console.log("Disconnecting session because navigated away.")
    session.disconnect()
    Video.destroyHardwareSetup()
    publisher.destroy();
    // session.destroy();
  });

	$scope.increaseVolume = function() {
		if ($scope.musicVolume >= 100) return
		ref.child('realTimeControls').child(classId).update({'musicVolume': $scope.musicVolume + 25}, function(err) {
			if (err) return console.log(err)
		})
	}

	$scope.decreaseVolume = function() {
		if ($scope.musicVolume <= 0) return
		ref.child('realTimeControls').child(classId).update({'musicVolume': $scope.musicVolume - 25}, function(err) {
			if (err) return console.log(err)
		})	
	}

	$scope.switchView = function(incrementBy) {
		viewCounter += incrementBy;
		var optionChosen = viewCounter % 3;
		$scope.videoView = viewOptions[optionChosen];
 
		switch (optionChosen) {
			case 0: 
				$scope.videoView += ""; 
				break;
			case 1: 
				if (Object.keys($scope.consumerObjects).length > 7) {
					$scope.videoView += "-over7";
				} else {
					$scope.videoView += "-7andUnder";
				}
				break;
			case 2:
				switch (Object.keys($scope.consumerObjects).length) {
					case 0: $scope.videoView += "-1"; break;
					case 1: $scope.videoView += "-1"; break;
					case 2: $scope.videoView += "-2"; break;
					case 3: $scope.videoView += "-3or4"; break;
					case 4: $scope.videoView += "-3or4"; break;
					case 5: $scope.videoView += "-5or6"; break;
					case 6: $scope.videoView += "-5or6"; break;
					case 7: $scope.videoView += "-7or8"; break;
					case 8: $scope.videoView += "-7or8"; break;
					case 9: $scope.videoView += "-9"; break;
					case 10: $scope.videoView += "-12andUnder"; break;
					case 11: $scope.videoView += "-12andUnder"; break;
					case 12: $scope.videoView += "-12andUnder"; break;
					default: $scope.videoView += "-1"; break;
				}
				break;
			default: $scope.videoView += ""; break;
		}
  	// console.log(Object.keys($scope.consumerObjects).length)
  	// console.log($scope.videoView)

    if(!$scope.$$phase) $scope.$apply();
	}

  function getClassDetails() {
    ref.child('classes').child(classId).on('value', function(snapshot) {
    	if (!snapshot.exists()) return console.log("No class found") //Instead, should return $location.path('/studios/'+studioId)
    	$scope.classDetails = snapshot.val();
    	if(!$scope.$$phase) $scope.$apply();
    	userIsInstructor = $scope.classDetails.instructor === Auth.getCurrentUser()._id;
    	if (!userIsInstructor) {
	    	Intercom('trackEvent', 'tookClass', {
          dateOfClass_at: Math.floor($scope.classDetails.dateTime/1000),
          classId: classId,
          studioId: studioId,
          classType: $scope.classDetails.classType,
          instructor: $scope.classDetails.instructor
        });
	    } else {
	    	Intercom('trackEvent', 'taughtClass', {
          dateOfClass_at: Math.floor($scope.classDetails.dateTime/1000),
          classId: classId,
          studioId: studioId,
          classType: $scope.classDetails.classType
        });
	    }
    	if ($scope.bookingsPulled && !session) connect($scope.classDetails)
    	getWorkout($scope.classDetails.workout)
	    getInstructorDetails($scope.classDetails.instructor)
	    setMusicPlayer($scope.classDetails)
	    
    })
  }

  function getHeaderImage() {
		storageRef.child('images/header.jpg').getDownloadURL().then(function(url) {
      // $scope.headerUrl = url;
      $scope.headerImageUrl = url
      console.log(url)
      if(!$scope.$$phase) $scope.$apply();
    }).catch(function(error) {
      console.log(error)
    });
	}

  function getBookedUsers() {
  	ref.child('bookings').child(classId).on('value', function(snapshot) {
  		$scope.bookingsPulled = true;
  		if ($scope.classDetails && !session) connect($scope.classDetails)
  		if (!snapshot.exists()) return $scope.numBookedUsers = 0;
  		$scope.bookedUsers = snapshot.val()
  		$scope.numBookedUsers = Object.keys($scope.bookedUsers).length
    	if(!$scope.$$phase) $scope.$apply();
  		snapshot.forEach(function(bookedUser) {
  			var userDetails = bookedUser.val()
  			firebase.database().ref().child('fbUsers').child(userDetails.facebookId).child('location').on('value', function(snapshot) {
  				if (snapshot.exists()) $scope.bookedUsers[bookedUser.key].location = snapshot.val()
		    	if(!$scope.$$phase) $scope.$apply();
  			})
  		})
  	})
  }

  function getInstructorDetails(instructorId) {
  	ref.child('instructors').child(instructorId).on('value', function(snapshot) {
  		$scope.instructor = snapshot.val()
    	if(!$scope.$$phase) $scope.$apply();
  	})
  }

  function getWorkout(workoutId) {
  	ref.child('workouts').child(workoutId).once('value', function(snapshot) {
  		$scope.workout = snapshot.val()
  		if(!$scope.$$phase) $scope.$apply();
  	})
  }

  function receiveRealTimeData() {
  	getMusicVolume();
  	// canConsumersHearEachOther();
  	getTimer()
  }

  function getMusicVolume() {
  	ref.child('realTimeControls').child(classId).child('musicVolume').on('value', function(snapshot) {
  		if (snapshot.exists()) {
			$scope.musicVolume = snapshot.val();
			 // || 50;
  		} else {
  			$scope.musicVolume = 50;
  		}
  		
  		if(!$scope.$$phase) $scope.$apply();
  		
			if (!userIsInstructor && audioPlayer && $scope.musicVolume > 0) {
				audioPlayer.setVolume($scope.musicVolume / 100);
				console.log("Music volume set to " + snapshot.val())
			} else {
				audioPlayer.setVolume(0);
			}
  	})
  }

  // function canConsumersHearEachOther() {
  // 	ref.child('realTimeControls').child(classId).child('consumersCanHearEachOther').on('value', function(snapshot) {
  // 		$scope.consumersCanHearEachOther = snapshot.val()
  // 		if(!$scope.$$phase) $scope.$apply();

  // 		for (var prop in $scope.consumerObjects) {
	 //  		if ($scope.consumersCanHearEachOther) {
	 //  			$scope.consumerObjects[prop].subscriber.subscribeToAudio(true);
	 //  		} else {
	 //  			$scope.consumerObjects[prop].subscriber.subscribeToAudio(false);
	 //  		}
  // 		}
  // 	})
  // }

  function generateTimerOptions() {
		$scope.workOptions = [];
		$scope.restOptions = [];
		$scope.roundOptions = [];
		
		for (var i = 0; i < 20; i++) {
			$scope.workOptions.push(i+1)
		}

		for (var i = 0; i < 5; i++) {
			$scope.restOptions.push(i+1)
		}

		for (var i = 0; i < 20; i++) {
			$scope.roundOptions.push(i+1)
		}

		$scope.timer = {};
		$scope.timer.type = 'Tabata';
		$scope.timer.work = $scope.workOptions[4];
		$scope.timer.rest = $scope.restOptions[1];
		$scope.timer.rounds = $scope.roundOptions[4];
	}

	$scope.saveTimer = function() {
		if (!$scope.timer.work) return
		ref.child('realTimeControls').child(classId).child('timer').update({"type": $scope.timer.type, "work": $scope.timer.work, "rest": $scope.timer.rest, "rounds": $scope.timer.rounds, "saved": new Date().getTime()}, function(err) {
			if (err) return console.log(err)
			console.log("Timer updated")
			$scope.resetButtonPushed()
		})
	}

  function getTimer() {
  	ref.child('realTimeControls').child(classId).child('timer').on('value', function(snapshot) {
  		if (!snapshot.exists()) return
  		$scope.realTimeTimer = snapshot.val();
  		$scope.currentTimerSeconds = snapshot.val().work*60;
  		$scope.roundsLeft = snapshot.val().rounds;
  		if(!$scope.$$phase) $scope.$apply();
  		if (snapshot.val().reset > snapshot.val().start) document.getElementById('timer').reset();	
  		if (snapshot.val().saved > snapshot.val().start) return;
  		if (snapshot.val().start > snapshot.val().reset || (snapshot.val().start && !snapshot.val().reset)) {
  			// Can add functionality that catches user up to wherever the class is if join late
  			document.getElementById('timer').reset();
  			document.getElementById('timer').start();	
  			$scope.timerWorking = true;
  		} 
  	})
  }

  $scope.$on('timer-tick', function (event, args) {
  	if ($scope.timerWorking && $scope.realTimeTimer.work) {
  		$scope.timeCountdown = (args.millis/1000)/($scope.realTimeTimer.work*60)*100
	  	if(!$scope.$$phase) $scope.$apply();	
  	} else if ($scope.realTimeTimer.rest){
  		$scope.timeCountdown = (args.millis/1000)/($scope.realTimeTimer.rest*60)*100
  		if(!$scope.$$phase) $scope.$apply();	
  	}
  });

  $scope.playButtonPushed = function() {
  	if (!$scope.realTimeTimer.work) return
  	ref.child('realTimeControls').child(classId).child('timer').update({"start": new Date().getTime()}, function(err) {
  		if (err) return console.log(err)
  	})
  }

  $scope.resetButtonPushed = function() {
  	ref.child('realTimeControls').child(classId).child('timer').update({"reset": new Date().getTime()}, function(err) {
  		if (err) return console.log(err)
  	})
  }

  $scope.timerAtZero = function() {
  	if ($scope.timerWorking && $scope.roundsLeft > 0) {
  		$scope.timerWorking = false;
  		$scope.timerResting = true;
  		$scope.currentTimerSeconds = $scope.realTimeTimer.rest*60;
  		$scope.roundsLeft --;
  		if(!$scope.$$phase) $scope.$apply();
  		document.getElementById('timer').reset();
			document.getElementById('timer').start();
  	} else if ($scope.roundsLeft > 0){
  		$scope.timerWorking = true;
  		$scope.timerResting = false;
  		$scope.currentTimerSeconds = $scope.realTimeTimer.work*60;
  		if(!$scope.$$phase) $scope.$apply();
  		document.getElementById('timer').reset();
			document.getElementById('timer').start();
  	}
  }

	$scope.openIntercomMessage = function() {
		Intercom('showNewMessage', "");
	}

	function sendIntercomTokboxError(error) {
		Intercom('trackEvent', 'tokboxError', {
			errorDate_at: Math.floor(new Date() / 1000),
			error: error
		});
	}

	function goBackToClassStarting() {
		$location.path('/studios/'+studioId+'/classstarting/'+classId)
	}

	function setMusicPlayer(classToJoin) {
		var firstTimePlayingSong = true;
		$scope.currentSong = {};
		var currentSongIndex = 0;
		var soundsLength = 0
		var songArray = [];
		var elapsedTime;

		ref.child("playlists").child(classToJoin.playlist).once('value', function(snapshot) {
			$scope.playlist = snapshot.val()
			if (typeof SC !== 'undefined' && SC.Widget != 'undefined') {
				// var element = document.getElementById('audioPlayer')
				// audioPlayer = SC.Widget(element);
				audioPlayer.load(snapshot.val().soundcloudUrl);
				// if (!userIsInstructor && audioPlayer && $scope.musicVolume) audioPlayer.setVolume($scope.musicVolume/100);

				audioPlayer.bind(SC.Widget.Events.READY, function() {
					if (firstTimePlayingSong) {
						elapsedTime = Math.round((new Date().getTime() - classToJoin.dateTime + 1000*60*5), 0) //Starts music 5 minutes before official class start time

						audioPlayer.getSounds(function(soundArray) {
							songArray = soundArray
							$scope.soundArray = soundArray;
				  		if(!$scope.$$phase) $scope.$apply();

							for (var i = 0; i < soundArray.length; i++) {
								if (elapsedTime > soundsLength + soundArray[i].duration) {
									soundsLength += soundArray[i].duration;
									if (audioPlayer) audioPlayer.next();
								} else {
									console.log("seeking to track " + (i+1));
									currentSongIndex = i;			
									// if (userIsInstructor && audioPlayer) audioPlayer.setVolume(0)
									if (!userIsInstructor && $scope.musicVolume > 0) {
										audioPlayer.setVolume($scope.musicVolume/100)
										// if ($scope.musicVolume > 0) audioPlayer.setVolume($scope.musicVolume/100)
										// if ($scope.musicVolume === 0) audioPlayer.setVolume(0)
										console.log("Playing song with volume " + $scope.musicVolume)
									} else {
										audioPlayer.setVolume(0)
									}
									// if (!userIsInstructor && audioPlayer) audioPlayer.setVolume(($scope.musicVolume ? $scope.musicVolume : 50)/100);
									if (audioPlayer) return audioPlayer.play()
								}
							}	
						})
					}
				})		

				audioPlayer.bind(SC.Widget.Events.PLAY, function(){
					// if (!userIsInstructor && audioPlayer) audioPlayer.setVolume(($scope.musicVolume ? $scope.musicVolume : 50)/100);

					if (!firstTimePlayingSong && songArray.length > 0) {
						currentSongIndex++
						$scope.currentSong = songArray[currentSongIndex];
						if(!$scope.$$phase) $scope.$apply();
					}
					if (firstTimePlayingSong) {
						elapsedTime = Math.round((new Date().getTime() - classToJoin.dateTime + 1000*60*5), 0) //Starts music 5 minutes before official class start time
						var seekingTo = elapsedTime - soundsLength
						if (audioPlayer) audioPlayer.seekTo(seekingTo);
						console.log("seeking to position " + seekingTo);
						$scope.currentSong = songArray[currentSongIndex];
						if(!$scope.$$phase) $scope.$apply();
						firstTimePlayingSong = false;
					} 
				});
			} else {
				alert("Your ad blocker is preventing music from playing.  Please disable it and reload this page.")
			}
		})
	}

	$scope.clickOnConsumer = function(consumerId) { //Trainer only
		if (audioPlayer) audioPlayer.setVolume(0);
		if (previouslyClickedConsumerId && $scope.consumerObjects[previouslyClickedConsumerId]) {
			$scope.consumerObjects[previouslyClickedConsumerId].subscriber.subscribeToAudio(false)	
			var previousSubscriberBox = $scope.consumerObjects[previouslyClickedConsumerId].subscriberBox;
			$('#' + previousSubscriberBox).removeClass('user-videos-large');
		}

		if ($scope.hearAll) {
			$scope.hearAll = false;
			for (var prop in $scope.consumerObjects) {
				$scope.consumerObjects[prop].subscriber.subscribeToAudio(false);
			}
		}
		
		if (consumerId) {
			$scope.consumerObjects[consumerId].subscriber.subscribeToAudio(true)
			var subscriberBox = $scope.consumerObjects[consumerId].subscriberBox;
			$('#' + subscriberBox).addClass('user-videos-large');
			previouslyClickedConsumerId = consumerId;
		}
	} 

	$scope.trainerClicksOnSelf = function() {
		$scope.hearAll = false;
		$scope.trainerClickedHimself = true;
		// if (audioPlayer) audioPlayer.setVolume($scope.musicVolume/200);
		for (var prop in $scope.consumerObjects) {
			$scope.consumerObjects[prop].subscriber.subscribeToAudio(false);
		}
	}

	$scope.trainerClicksHearAll = function() {
		if (audioPlayer) audioPlayer.setVolume(0);
		if ($scope.hearAll) {
			$scope.hearAll = false;
			for (var prop in $scope.consumerObjects) {
				$scope.consumerObjects[prop].subscriber.subscribeToAudio(false);
			}	
		} else {
			$scope.hearAll = true;
			for (var prop in $scope.consumerObjects) {
				$scope.consumerObjects[prop].subscriber.subscribeToAudio(true);
			}	
		}
	}

	//Only gets called if/when at least 1 user has booked class.
	function connect(classToJoin) {
		// OT.setLogLevel(OT.DEBUG); //Lots of additional debugging for dev purposes.
		var apiKey = 45425152;
		var sessionId = classToJoin.sessionId;
		if (session) return

		setPublisher();

		if (OT.checkSystemRequirements() == 1) {
			session = OT.initSession(apiKey, sessionId);
			setSessionEvents(classToJoin)
			
			// $scope.$on("$destroy", function() { // destroys the session and turns off green light when navigate away
   //    	console.log("Disconnecting session because navigated away.")
   //      session.disconnect()
   //      Video.destroyHardwareSetup()
   //      publisher.destroy();
   //      // session.destroy();
	  //   });
		} else {
		  // The client does not support WebRTC.
		  console.log("Not using Chrome or Firefox")
		  alert('BODY is not available in your browser. Please switch to Chrome or Firefox.');
	  	return goBackToClassStarting()
		}

		User.createTokBoxToken({ id: currentUser._id }, {
      sessionId: classToJoin.sessionId
    }, function(token) {
    	connectToSession(token.token)
    }, function(err) {
        console.log(err);
    }).$promise;	

		function connectToSession(token) {
			session.connect(token, function(error) {
			  if (error) {
			  	console.log(error);
			  	sendIntercomTokboxError(error)
			  	if (error.code === 1006) {
			  		alert('Failed to connect. Please check your connection and try connecting again.');
			  	} else {
			  		alert("Unknown error occured while connecting. Please try reloading or contact BODY Support at (216) 408-2902 to get this worked out.")
			  	}
			  } else {
				  connected = true;
			    publish();
			    if (session.capabilities.publish != 1) {
			    	session.disconnect()
			    	// session.destroy();
			    	sendIntercomTokboxError("session.capabilities.publish != 1")
	  				alert("There was an issue. It might might be that you don't have a working webcam or microphone, so nobody else will see you. Please try reloading or contact BODY Support at (216) 408-2902 to get this worked out.")
	  				return goBackToClassStarting()
	  			}
			  }
			});	
		};

		function setPublisher() {
			var vidWidth = "100%";
			var vidHeight;
			var suggestedResolution;
			var suggestedFPS;

			if (userIsInstructor) {
				// vidWidth = "100%";
				// vidHeight = "16.67%";
				suggestedResolution = "640x480";
				suggestedFPS = 30;
			} else {
				// vidWidth = "100%"
				suggestedResolution = "320x240";
				suggestedFPS = 7;
			}

			var audioInputDevice = Video.getAudioInput() ? Video.getAudioInput().deviceId : undefined;
			var videoInputDevice = Video.getVideoInput() ? Video.getVideoInput().deviceId : undefined; 

			//Prevents accidentally not having an audio device
			if (audioInputDevice && videoInputDevice) {
				initPublisher(audioInputDevice, videoInputDevice, suggestedResolution, suggestedFPS, vidWidth)
			} else {
				OT.getDevices(function(error, devices) {
					if (devices) {
					  var audioInputDevices = devices.filter(function(element) {
					    return element.kind == "audioInput";
					  });
					  var videoInputDevices = devices.filter(function(element) {
					    return element.kind == "videoInput";
					  });
					  if (!audioInputDevice) audioInputDevice = audioInputDevices[0];
					  if (!videoInputDevice) videoInputDevice = videoInputDevices[0];
					  initPublisher(audioInputDevice, videoInputDevice, suggestedResolution, suggestedFPS, vidWidth)
					  // for (var i = 0; i < audioInputDevices.length; i++) {
					  //   console.log("audio input device: ", audioInputDevices[i].deviceId);
					  // }
					} else {
						console.log("No devices discovered " + err)
					}
				});
			}

			function initPublisher(audioInputDevice, videoInputDevice, suggestedResolution, suggestedFPS, vidWidth) {
				publisher = OT.initPublisher('myfeed', {
		      insertMode: 'append',
		      audioSource: audioInputDevice, 
		      videoSource: videoInputDevice,
		      // resolution: suggestedResolution,
		      // frameRate: suggestedFPS,
		      publishAudio:true, 
		      publishVideo:true,
		      mirror: true,
		      width: vidWidth,
				  height: undefined,
		      name: currentUser.firstName + " " + currentUser.lastName.charAt(0),
		      style: {
		      	buttonDisplayMode: 'off', //Mute microphone button
		      	nameDisplayMode: 'off' //Can also be off or auto
		      }
		    }, function(err) {
		    	if (err) {
		    		sendIntercomTokboxError(err);
				    if (err.code === 1500 && err.message.indexOf('Publisher Access Denied:') >= 0) {
				      // Access denied can also be handled by the accessDenied event
				      alert('Please allow access to the Camera and Microphone and try publishing again.');
				    } else {
				      alert('Failed to get access to your camera or microphone. Please check that your webcam'
				        + ' is connected and not being used by another application and try again.');
				    }
				    publisher.destroy();
				    publisher = null;
				    console.log(err)
		    	} else {
			    	publisherInitialized = true;
			    	setPublisherEvents()
				    publish();
			    	console.log("Publisher successfully initialized")
			    }
		    })
			}				
		}
	};

	var publish = function() {
	  if (connected && publisherInitialized) {
	    session.publish(publisher, function(err) {
			  if(err) {
			  	sendIntercomTokboxError(err);
			  	console.log(err);
			    if (err.code === 1553 || (err.code === 1500 && err.message.indexOf("Publisher PeerConnection Error:") >= 0)) {
			      alert("Streaming connection failed. This could be due to a restrictive firewall.");
			    } else {
			      alert("An unknown error occurred while trying to publish your video. Please try again later.");
			    }
			    publisher.destroy();
			    publisher = null;
			  }
			});
	  }
	};

	function setPublisherEvents() {
		publisher.on({
			streamCreated: function (event) {
				console.log('The publisher started streaming with id ' + event.stream.id);
		   
		   	if (event.stream && event.stream.id) Intercom('update', { "latestTokboxStreamId": event.stream.id });
				if (event.connection && event.connection.connectionId) Intercom('update', { "latestTokboxConnectionId": event.connection.connectionId });
			},
			streamDestroyed: function (event) {
				event.preventDefault();
			  console.log("The publisher stopped streaming. Reason: " + event.reason);
			  if (event.reason === 'networkDisconnected') {
		      alert('You lost internet connection, so we sent you to the dashboard. Please try joining the class again.');
		      goBackToClassStarting()
		    }
			},
		  accessAllowed: function (event) {
		    // The user has granted access to the camera and mic.
		  },
		  accessDenied: function accessDeniedHandler(event) {
		  	sendIntercomTokboxError("User denied access to video and/or microphone");
		  	console.log("User denied access to video and/or microphone")
		    alert("Oh no!  If you don't allow us access to your video and microphone, we can't stream your video to others!  Please reload this page and accept the camera / microphone access request.")
		  },
		  accessDialogOpened: function (event) {
		    // Show allow camera message to give some background on why camera access is being requested
		    // pleaseAllowCamera.style.display = 'block';
		  },
		  accessDialogClosed: function (event) {
		    // Hide allow camera message
		    // pleaseAllowCamera.style.display = 'none';
		  }
		});
	}

	function subscribeToStream(streamEvent, subscriberBox, instructorStream, vidWidth, vidHeight) {
		var streamId = streamEvent.connection.data.toString()
	  var subscriber = session.subscribe(streamEvent, subscriberBox, {
	    insertMode: 'append',
	    width: vidWidth,
		  height: vidHeight,
		  mirror: true,
	    style: {
	    	buttonDisplayMode: 'off',
	    	nameDisplayMode: 'off'
	    } // Mute button turned off.  Might want to consider turning on for trainer vid since other consumers already ahve audio turned off.
	  }, function(err) {
	  	if (err) {
	  		console.log(err)
	  	} else {
	  		// if (!userIsInstructor && !instructorStream && Object.keys($scope.consumerObjects).length > 4) subscriber.restrictFrameRate(true); // When the frame rate is restricted, the Subscriber video frame will update once or less per second and only works with router, not relayed. It reduces CPU usage. It reduces the network bandwidth consumed by the app. It lets you subscribe to more streams simultaneously.
		  	// console.log("Received stream with streamId " +streamId);

		  	if (!instructorStream) {
					// if (!$scope.consumerObjects[streamId]) console.log("subscriber with id " + streamId + " successfully added to subscriber list.")
					// if ($scope.consumerObjects[streamId]) console.log("subscriber with id " + streamId + " already existed and is being overwritten with new subscriber object.")
					$scope.consumerObjects[streamId].subscriber = subscriber; //Add subscriber to $scope.consumerObjects (used to turn audio on/off)				
				} else {
					$scope.instructorDisplayed = true;
					if(!$scope.$$phase) $scope.$apply();
				}

		  	if (!instructorStream) {
		  		subscriber.setAudioVolume(100);
		  		subscriber.subscribeToAudio(false);
		  	} else {
		  		subscriber.setAudioVolume(100);
		  		subscriber.subscribeToAudio(true);
		  	}

				if (!$scope.firstStream && !instructorStream && userIsInstructor) {
					$scope.firstStream = true;
					$('#' + subscriberBox).addClass('user-videos-large')
					subscriber.subscribeToAudio(true);
					previouslyClickedConsumerId = streamId;
				}

				if (userIsInstructor) {
					$scope.switchView(0)
				}

		  	SpeakerDetection(subscriber, function() { //Used to turn volume down or highlight box when stream is 'talking'
				  console.log('started talking');
				  // if (userIsInstructor) { document.getElementById(getIdOfBox(streamBoxNumber)).style.border = "thick solid #0000FF"; }
				  // setMusicVolume($scope.musicVolume/2.5)
				  if (audioPlayer && $scope.musicVolume) audioPlayer.setVolume($scope.musicVolume / 250);
				}, function() {
					// setMusicVolume($scope.musicVolume)
					if (audioPlayer && $scope.musicVolume) audioPlayer.setVolume($scope.musicVolume / 100);
				  console.log('stopped talking');
				  // if (userIsInstructor) { document.getElementById(getIdOfBox(streamBoxNumber)).style.border = "none"; }
				});



		  	// if ((!userIsInstructor && !instructorStream) || userIsInstructor) { // Now turns all consumer sound off for instructor. Instructor turns on sound streams by putting mouse over consumer.
		  	// 	subscriber.setAudioVolume(100);
		  	// 	subscriber.subscribeToAudio(false); // audio off only if user is a consumer and stream is a consumer or if user is instructor.
		  	// } else {
		  	// 	subscriber.setAudioVolume(100);
		  	// 	subscriber.subscribeToAudio(true); // Audio on in any other case
		  	// }

				// if (userIsInstructor) {
				// 	subscriber.setStyle("nameDisplayMode", "on");
				// } else {
				// 	subscriber.setStyle("nameDisplayMode", "off");	
				// }
		  	
		  	subscriber.setStyle('backgroundImageURI', $scope.consumerObjects[streamId] ? $scope.consumerObjects[streamId].picture : $scope.instructor.picture); //Sets image to be displayed when no video
		  	subscriber.setStyle('audioLevelDisplayMode', 'off');

		  	subscriber.on("videoDisabled", function(event) { // Router will disable video if quality is below a certain threshold
		  		console.log("Video temporarily disabled due to internet quality being low.")
				  // Set picture overlay
				  // domElement = document.getElementById(subscriber.id);
				  // domElement.style["visibility"] = "hidden";
				});

				subscriber.on("videoEnabled", function(event) { // Router will re-enable video if quality comes above certain threshold
					console.log("Video re-enabled due to internet quality being high enough.")
					// Remove picture overlay
				  // domElement = document.getElementById(subscriber.id);
				  // domElement.style["visibility"] = "visible";
				});
		  }
	  });
	}

	function setSessionEvents(classToJoin) {
		session.on({
			streamCreated: function (event) {
				var instructorStream = false;
				var instructorInfo;
				var vidWidth = "100%";
				// var vidHeight = 70;
				var subscriberBox = null;
				// var vidHeight = 70;

				// if (userIsInstructor) {
				// 	vidWidth = "16.67%";
				// 	vidHeight = "16.67%";
				// }

				var streamId = event.stream.connection.data.toString();

				// var streamBoxNumber = 1;

				if (streamId === classToJoin.instructor.toString()) {
					console.log("Received trainer stream " + streamId)
					instructorStream = true;
					// vidWidth = "100%";
				} else {
					console.log("Received consumer stream " + streamId)
				// if ($scope.consumerObjects[streamId]) {
					// streamBoxNumber = $scope.consumerObjects[streamId].boxNumber;
					// subscriberBox = instructorStream ? "trainerVideo" : "consumer" + streamBoxNumber)
				// } else {
					if (!userIsInstructor && Object.keys($scope.consumerObjects).length > 3) return //Consumers should only see 3 other consumers
					if ($scope.bookedUsers && $scope.bookedUsers[streamId]) $scope.consumerObjects[streamId] = $scope.bookedUsers[streamId]
					if(!$scope.$$phase) $scope.$apply();
				}	
				subscriberBox = instructorStream ? "trainerVideo" : "consumer" + (Object.keys($scope.consumerObjects).length-1).toString()
				if (!instructorStream) $scope.consumerObjects[streamId].subscriberBox = subscriberBox;
				console.log(subscriberBox)
				subscribeToStream(event.stream, subscriberBox, instructorStream, vidWidth)		
			},
			streamDestroyed: function (event) {
				var streamId = event.stream.connection.data.toString();
				console.log("Stream " + streamId + " disconnected")
				if ($scope.consumerObjects[streamId]) delete $scope.consumerObjects[streamId]
				if (streamId === $scope.classDetails.instructor) $scope.instructorDisplayed = false;
				if(!$scope.$$phase) $scope.$apply();
				if (userIsInstructor) {
					$scope.switchView(0)
				}
			},
		  connectionCreated: function (event) {
		    if (event.connection.connectionId != session.connection.connectionId) {
		    	connectionCount++;
		      console.log('Another client connected. ' + connectionCount + ' total.');
		    }
		  },
		  connectionDestroyed: function (event) {
		    if (event.connection.connectionId != session.connection.connectionId) {
		    	connectionCount--;
			    console.log('A client disconnected. ' + connectionCount + ' total.');
			  }
		  },
		  sessionDisconnected: function (event) {
	      // The event is defined by the SessionDisconnectEvent class
	      console.log('Disconnected from the session.');
	      console.log(event.reason);
	      if (event.reason == 'networkDisconnected') {
	        alert('You lost your internet connection. Please check your connection and try connecting again.')
	      }
	    }
		});
	}

	var SpeakerDetection = function(subscriber, startTalking, stopTalking) { // Used to determine whether stream is talking
	  var activity = null;
	  subscriber.on('audioLevelUpdated', function(event) {
	    var now = Date.now();
	    if (event.audioLevel > 0.2) {
	      if (!activity) {
	        activity = {timestamp: now, talking: false};
	      } else if (activity.talking) {
	        activity.timestamp = now;
	      } else if (now - activity.timestamp > 500) {
	        // detected audio activity for more than half second for the first time.
	        activity.talking = true;
	        if (typeof(startTalking) === 'function') {
	          startTalking();
	        }
	      }
	    } else if (activity && now - activity.timestamp > 2000) {
	      // detected low audio activity for more than 2s
	      if (activity.talking) {
	        if (typeof(stopTalking) === 'function') {
	          stopTalking();
	        }
	      }
	      activity = null;
	    }
	  });
	};
})