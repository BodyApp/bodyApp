'use strict';

angular.module('bodyAppApp')
.controller('VideoCtrl', function ($scope, $location, Video, User, Auth) {

	var studioId = Video.getStudio();
	var classId = Video.getClassId();

	var currentUser = Auth.getCurrentUser()

	if (!studioId || !classId) {
		return $location.path('/')
	}

	var ref = firebase.database().ref().child('studios').child(studioId);
  var storageRef = firebase.storage().ref().child('studios').child(studioId);
  var auth = firebase.auth();

  var audioPlayer;

  $scope.showWorkout = true;
  var userIsInstructor;

  var session;
  var publisher;
  var publisherInitialized;
	var connected;
  $scope.consumerObjects = {};
  var connectionCount = 0;

	auth.onAuthStateChanged(function(user) {
    if (user) {     
      getClassDetails()
      getBookedUsers()
      getHeaderImage()
      receiveRealTimeData()
    }
  })

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

  function getClassDetails() {
    ref.child('classes').child(classId).on('value', function(snapshot) {
    	if (!snapshot.exists()) return console.log("No class found") //Instead, should return $location.path('/studios/'+studioId)
    	$scope.classDetails = snapshot.val();
    	if(!$scope.$$phase) $scope.$apply();
    	userIsInstructor = $scope.classDetails.instructor === Auth.getCurrentUser()._id;
    	if ($scope.bookedUsers) connect($scope.classDetails)
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
  		if (!snapshot.exists()) return $scope.numBookedUsers = 0;
  		$scope.bookedUsers = snapshot.val()
  		$scope.numBookedUsers = Object.keys($scope.bookedUsers).length
    	if(!$scope.$$phase) $scope.$apply();
  		if ($scope.classDetails) connect($scope.classDetails)
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
  	canConsumersHearEachOther();
  }

  function getMusicVolume() {
  	ref.child('realTimeControls').child(classId).child('musicVolume').on('value', function(snapshot) {
  		if (snapshot.exists()) {
  			$scope.musicVolume = snapshot.val()
  		} else {
  			$scope.musicVolume = 50;
  		}
  		
  		if(!$scope.$$phase) $scope.$apply();
  		
  		if (!userIsInstructor) {
  			audioPlayer.setVolume(snapshot.val() / 100);
  			console.log("Music volume set to " + snapshot.val())
  		}
  	})
  }

  function canConsumersHearEachOther() {
  	ref.child('realTimeControls').child(classId).child('consumersCanHearEachOther').on('value', function(snapshot) {
  		$scope.consumersCanHearEachOther = snapshot.val()
  		if(!$scope.$$phase) $scope.$apply();

  		for (prop in $scope.consumerObjects) {
	  		if ($scope.consumersCanHearEachOther) {
	  			$scope.consumerObjects[prop].subscriber.subscribeToAudio(true);
	  		} else {
	  			$scope.consumerObjects[prop].subscriber.subscribeToAudio(false);
	  		}
  		}
  	})
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
				var element = document.getElementById('audioPlayer')
				audioPlayer = SC.Widget(element);
				audioPlayer.load(snapshot.val().soundcloudUrl);

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
									if (userIsInstructor) audioPlayer.setVolume(0)
									return audioPlayer.play()
								}
							}	
						})
					}
				})		

				audioPlayer.bind(SC.Widget.Events.PLAY, function(){
					if (!userIsInstructor) audioPlayer.setVolume($scope.musicVolume);

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

	//Only gets called if/when at least 1 user has booked class.
	function connect(classToJoin) {
		// OT.setLogLevel(OT.DEBUG); //Lots of additional debugging for dev purposes.
		var apiKey = 45425152;
		var sessionId = classToJoin.sessionId;

		setPublisher();

		if (OT.checkSystemRequirements() == 1) {
			session = OT.initSession(apiKey, sessionId);
			
			$scope.$on("$destroy", function() { // destroys the session and turns off green light when navigate away
      	console.log("Disconnecting session because navigated away.")
        session.disconnect()
        Video.destroyHardwareSetup()
        publisher.destroy();
        // session.destroy();
	    });
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
			  	setSessionEvents(classToJoin)
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
		      resolution: suggestedResolution,
		      frameRate: suggestedFPS,
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
	    insertMode: 'after',
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
	  		if (!userIsInstructor && !instructorStream) subscriber.restrictFrameRate(true); // When the frame rate is restricted, the Subscriber video frame will update once or less per second and only works with router, not relayed. It reduces CPU usage. It reduces the network bandwidth consumed by the app. It lets you subscribe to more streams simultaneously.
		  	console.log("Received stream with streamId " +streamId);

		  	if (!instructorStream) {
					// if (!$scope.consumerObjects[streamId]) console.log("subscriber with id " + streamId + " successfully added to subscriber list.")
					// if ($scope.consumerObjects[streamId]) console.log("subscriber with id " + streamId + " already existed and is being overwritten with new subscriber object.")
					$scope.consumerObjects[streamId].subscriber = subscriber; //Add subscriber to $scope.consumerObjects (used to turn audio on/off)				
				} else {
					$scope.instructorDisplayed = true;
					if(!$scope.$$phase) $scope.$apply();
				}

		  	SpeakerDetection(subscriber, function() { //Used to turn volume down or highlight box when stream is 'talking'
				  console.log('started talking');
				  // if (userIsInstructor) { document.getElementById(getIdOfBox(streamBoxNumber)).style.border = "thick solid #0000FF"; }
				  // setMusicVolume($scope.musicVolume/2.5)
				  audioPlayer.setVolume($scope.musicVolume / 250);
				}, function() {
					// setMusicVolume($scope.musicVolume)
					audioPlayer.setVolume($scope.musicVolume / 100);
				  console.log('stopped talking');
				  // if (userIsInstructor) { document.getElementById(getIdOfBox(streamBoxNumber)).style.border = "none"; }
				});

		  	if (!instructorStream) {
		  		subscriber.setAudioVolume(100);
		  		subscriber.subscribeToAudio(false);
		  	} else {
		  		subscriber.setAudioVolume(100);
		  		subscriber.subscribeToAudio(true);
		  	}

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
				var instructorStream = false
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
					console.log("Received trainer stream")
					instructorStream = true;
					// vidWidth = "100%";
				} else {
				// if ($scope.consumerObjects[streamId]) {
					// streamBoxNumber = $scope.consumerObjects[streamId].boxNumber;
					// subscriberBox = instructorStream ? "trainerVideo" : "consumer" + streamBoxNumber)
				// } else {
					if (!userIsInstructor && Object.keys($scope.consumerObjects).length > 3) return //Consumers should only see 3 other consumers
					if ($scope.bookedUsers && $scope.bookedUsers[streamId]) $scope.consumerObjects[streamId] = $scope.bookedUsers[streamId]
					if(!$scope.$$phase) $scope.$apply();
				}	
				subscriberBox = instructorStream ? "trainerVideo" : "consumer" + (Object.keys($scope.consumerObjects).length-1).toString()
				console.log(subscriberBox)
				subscribeToStream(event.stream, subscriberBox, instructorStream, vidWidth)		
			},
			streamDestroyed: function (event) {
				var streamId = event.stream.connection.data.toString();
				if ($scope.consumerObjects[streamId]) delete $scope.consumerObjects[streamId]
				if (streamId === $scope.classDetails.instructor) $scope.instructorDisplayed = false;
				if(!$scope.$$phase) $scope.$apply();
			},
		  connectionCreated: function (event) {
		    connectionCount++;
		    if (event.connection.connectionId != session.connection.connectionId) {
		      console.log('Another client connected. ' + connectionCount + ' total.');
		    }
		  },
		  connectionDestroyed: function connectionDestroyedHandler(event) {
		    connectionCount--;
		    console.log('A client disconnected. ' + connectionCount + ' total.');
		  },
		  sessionDisconnected: function sessionDisconnectHandler(event) {
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