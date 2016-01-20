'use strict';

angular.module('bodyAppApp')
  .controller('VideoCtrl', function ($scope, $state, $location, $timeout, $interval, $window, $document, $firebaseObject, Auth, User, Schedule, Video) {

  	var classToJoin = Schedule.classUserJustJoined;
  	if (!classToJoin) {
			return $location.path('/')
		}

		$scope.classTime = classToJoin.date;
		$scope.trainer = classToJoin.trainer;

		var lastConsumerTrainerCouldHear;

		var classClosesTime = (classToJoin.date + 1000*60*70);
		var classHalfway = (classToJoin.date + 1000*60*30);
		var endClassCheckInterval = $interval(function() {
			var currentTime = (new Date()).getTime()
			if (classClosesTime < currentTime) {
				console.log("class is over, booting people out");
				$location.path('/classfeedback');
			} else if (classHalfway < currentTime ) {
				classTaken()
			} else {
				console.log("class currently in session");
			}
		}, 1000*60*15)
  	
		var firstTimePlayingSong = true;
		$scope.currentSong = {};
		var currentSongIndex = 0;
		var soundsLength = 0
		var songArray = [];
		var elapsedTime = Math.round((new Date().getTime() - classToJoin.date), 0)

		var currentUser = Auth.getCurrentUser();
		$scope.currentUser = currentUser;

		var subscriberArray = []; //Array of subscriber objects generated by TokBox.
		$scope.consumerList = [];
		$scope.consumerObjects = {};
		var maxCALLERS = 10;
		var connectionCount = 0;
		var session;
		var publisher;

		var userIsInstructor = currentUser._id.toString() === classToJoin.trainer._id.toString()
		var userIsDan = currentUser.facebookId === "10100958748247716"
		// if (userIsDan) userIsInstructor = true;
		if (!userIsInstructor) {
			$scope.consumerList.push(currentUser._id);
			$scope.consumerObjects[currentUser._id] = currentUser;
		}

		var audioPlayer;
		$scope.musicVolume = 50;
		var oldSoundVolume; //Used for toggling whether users can hear each other or not

		var classDate = new Date(classToJoin.date)
		var classKey = ""+classDate.getFullYear()+""+((classDate.getMonth()+1 < 10)?"0"+(classDate.getMonth()+1):classDate.getMonth()+1)+""+((classDate.getDate() < 10)?"0"+classDate.getDate():classDate.getDate())
    var sunDate = new Date();
    sunDate.setDate(classDate.getDate() - classDate.getDay());
    var sunGetDate = sunDate.getDate();
    var sunGetMonth = sunDate.getMonth()+1;
    var sunGetYear = sunDate.getFullYear();
    var weekOf = "weekof"+ (sunGetMonth<10?"0"+sunGetMonth:sunGetMonth) + (sunGetDate<10?"0"+sunGetDate:sunGetDate) + sunGetYear;
    var ref = new Firebase("https://bodyapp.firebaseio.com/")

    setTabataOptions()

    // $scope.tabata = $firebaseObject(
    // 	ref.child(weekOf)
    //   .child(classDate.getDay())
    //   .child("slots")
    //   .child(classDate.getTime())
    //   .child("tabata"));

		//3-way data bind for tabata time and rounds
    $firebaseObject(ref.child(weekOf)
      .child(classDate.getDay())
      .child("slots")
      .child(classDate.getTime())
      .child("tabata")).$bindTo($scope, 'tabata').then(function() {
      	if (userIsInstructor) {return $scope.tabata.tabataActive = true}
      	else if (!userIsInstructor) {
      		console.log("Watching whether tabata is on or off.")
      		$scope.$watch('tabata.isOn', function(data){
	          document.getElementById('tabata').stop();
						document.getElementById('tabata').reset();
						if ($scope.tabata.lastStart > $scope.tabata.lastSet) {
							console.log("Starting consumer tabata")
							document.getElementById('tabata').start();
						}
	        });
      		
      		$scope.$watch('tabata.lastSet', function(data){
	          document.getElementById('tabata').stop();
						document.getElementById('tabata').reset();
						console.log("Stopping and resetting tabata")
	        });

	        $scope.$watch('tabata.lastStart', function(data){
	        	if ($scope.tabata.lastStart > $scope.tabata.lastSet) {
							document.getElementById('tabata').start();
							console.log("Starting tabata")
						}
	        });
      	}
      })

    var stopwatchRef = $firebaseObject(
    	ref.child(weekOf)
      .child(classDate.getDay())
      .child("slots")
      .child(classDate.getTime())
      .child("stopwatch")
      .child("running"));
  	
  	stopwatchRef.$watch(function() {
  		if (stopwatchRef.$value) {
  			document.getElementById('stopwatch').start();
  		} else {
  			document.getElementById('stopwatch').stop();
  			document.getElementById('stopwatch').reset();
  		}
  	})

    // //2-way data bind for tabata controls
    // var tabataIsOnRef = $firebaseObject(
    // 	ref.child(weekOf)
    //   .child(classDate.getDay())
    //   .child("slots")
    //   .child(classDate.getTime())
    //   .child("tabata")
    //   .child("isOn"));

    // console.log(tabataIsOnRef);

    $scope.consumersCanHearEachOther;

    var canHearRef = $firebaseObject(
    	ref.child(weekOf)
      .child(classDate.getDay())
      .child("slots")
      .child(classDate.getTime())
      .child("consumersCanHearEachOther"));

    var volumeRef = $firebaseObject(
      ref.child(weekOf)
      .child(classDate.getDay())
      .child("slots")
      .child(classDate.getTime())
      .child("musicVolume"));

		volumeRef.$loaded().then(function() {
			$scope.musicVolume = volumeRef.$value
			setMusicVolume($scope.musicVolume);
	  });

		volumeRef.$watch(function() {
			$scope.musicVolume = volumeRef.$value
			setMusicVolume($scope.musicVolume);
			if(!$scope.$$phase) $scope.$apply();
	  });

	  canHearRef.$loaded().then(function() {
			$scope.consumersCanHearEachOther = canHearRef.$value
			if ($scope.consumersCanHearEachOther) {
	  		for (var i = 0; i < subscriberArray.length; i++) {
	  			console.log("Can hear user " + subscriberArray[i].streamId)
	  			subscriberArray[i].subscribeToAudio(true);
	  		}
	  	} else {
	  		for (var i = 0; i < subscriberArray.length; i++) {
	  			console.log("Can no longer hear user " + subscriberArray[i].streamId)
	  			subscriberArray[i].subscribeToAudio(false);
	  		}
	  	}
	  });

		canHearRef.$watch(function() {
			$scope.consumersCanHearEachOther = canHearRef.$value
			if ($scope.consumersCanHearEachOther) {
	  		for (var i = 0; i < subscriberArray.length; i++) {
	  			console.log("Can hear user " + subscriberArray[i].streamId)
	  			subscriberArray[i].subscribeToAudio(true);
	  		}
	  	} else {
	  		for (var i = 0; i < subscriberArray.length; i++) {
	  			console.log("Can no longer hear user " + subscriberArray[i].streamId)
	  			subscriberArray[i].subscribeToAudio(false);
	  		}
	  	}
	  });

		// if (!userIsInstructor) {
		//   $scope.consumersCanHearEachOther.$watch(function() {
		//   	$scope.consumersCanHearEachOther = $scope.consumersCanHearEachOther;
		//   	if ($scope.consumersCanHearEachOther) {
		//   		for (var i = 0; i < subscriberArray.length; i++) {
		//   			subscriberArray[i].subscribeToAudio(true);
		//   		}
		//   	} else {
		//   		for (var i = 0; i < subscriberArray.length; i++) {
		//   			subscriberArray[i].subscribeToAudio(false);
		//   		}
		//   	}
		//   })
		// }

		if (typeof SC !== 'undefined' && SC.Widget != 'undefined') {
			var element = document.getElementById('audioPlayer')
			audioPlayer = SC.Widget(element);
			audioPlayer.load(classToJoin.playlist.soundcloudUrl);

			audioPlayer.bind(SC.Widget.Events.READY, function() {
				if (firstTimePlayingSong) {
					elapsedTime = Math.round((new Date().getTime() - classToJoin.date), 0)
					
					setMusicVolume($scope.musicVolume);

					audioPlayer.getSounds(function(soundArray) {
						songArray = soundArray		
						for (var i = 0; i < soundArray.length; i++) {
							if (elapsedTime > soundsLength + soundArray[i].duration) {
								soundsLength += soundArray[i].duration;
								audioPlayer.next();
							} else {
								console.log("seeking to track " + (i+1));
								currentSongIndex = i;			
								return audioPlayer.play()
							}
						}	
					})
				}
			})		

			audioPlayer.bind(SC.Widget.Events.PLAY, function(){
				if (!firstTimePlayingSong && songArray.length > 0) {
					currentSongIndex++
					$scope.currentSong = songArray[currentSongIndex];
					if(!$scope.$$phase) $scope.$apply();
				}
				if (firstTimePlayingSong) {
					elapsedTime = new Date().getTime() - classToJoin.date
					var seekingTo = elapsedTime - soundsLength
					audioPlayer.seekTo(seekingTo);
					console.log("seeking to position " + seekingTo);
					$scope.currentSong = songArray[currentSongIndex];
					if(!$scope.$$phase) $scope.$apply();
					firstTimePlayingSong = false;
				} 
			});
		} else {
			alert("Your ad blocker is preventing music from playing.  Please disable it and reload this page.")
		}

		var wodRef = ref.child("WODs").child(classKey)
		wodRef.once('value', function(snapshot) {
			$scope.todayWod = snapshot.val()
		})

		$scope.letConsumersHearEachOther = function() {
			$scope.consumersCanHearEachOther = true;
			canHearRef.$value = true;
			canHearRef.$save()

			oldSoundVolume = $scope.musicVolume;
			$scope.musicVolume = 0;
			volumeRef.$value = $scope.musicVolume
			volumeRef.$save()
			setMusicVolume(musicVolume)
		}

		$scope.stopConsumersFromHearingEachOther = function() {
			$scope.consumersCanHearEachOther = false;
			canHearRef.$value = false;
			canHearRef.$save()

			$scope.musicVolume = oldSoundVolume;
			volumeRef.$value = $scope.musicVolume
			volumeRef.$save()
			setMusicVolume(musicVolume)
		}

		$scope.openSongPermalink = function(currentSong) {
			if (!userIsInstructor) $window.open(currentSong.permalink_url, '_blank');
		}

		$scope.setMusicVolume = function(musicVolume) {
			setMusicVolume(musicVolume)
			volumeRef.$value = musicVolume
			volumeRef.$save()

			if ($scope.consumersCanHearEachOther) {
				$scope.consumersCanHearEachOther = false;
				canHearRef.$value = false;
				canHearRef.$save()
			}
		}

		$scope.upMusicButton = function(musicVolume) {
			if ($scope.musicVolume < 100) {
				musicVolume += 25;
				setMusicVolume(musicVolume)
				$scope.musicVolume = musicVolume;
				if(!$scope.$$phase) $scope.$apply();
				volumeRef.$value = musicVolume
				volumeRef.$save()
			}

			if ($scope.consumersCanHearEachOther) {
				$scope.consumersCanHearEachOther = false;
				canHearRef.$value = false;
				canHearRef.$save()
			}
		}

		$scope.downMusicButton = function(musicVolume) {
			if ($scope.musicVolume > 0) {
				musicVolume -= 25;
				setMusicVolume(musicVolume)
				$scope.musicVolume = musicVolume;
				if(!$scope.$$phase) $scope.$apply();
				volumeRef.$value = musicVolume
				volumeRef.$save()
			}

			if ($scope.consumersCanHearEachOther) {
				$scope.consumersCanHearEachOther = false;
				canHearRef.$value = false;
				canHearRef.$save()
			}
		}

		function setMusicVolume(musicVolume) {
			console.log("Volume percentage changed to " + musicVolume)
			if (userIsInstructor) {
				audioPlayer.setVolume(0);
			} else {
				audioPlayer.setVolume(musicVolume / 250);
			}
		}

		// function loginSuccess() {
		// }

		function getIdOfBox(boxNum) {
			if (userIsInstructor) {
				return 'trainer' + boxNum;
			} else {
				return 'box' + boxNum;		
			}
		}

		var connect = function() {
			// OT.setLogLevel(OT.DEBUG); //Lots of additional debugging for dev purposes.
			var apiKey = 45425152;
			var sessionId = classToJoin.sessionId;
				
			// setStreamAcceptor();

			User.createTokBoxToken({ id: currentUser._id }, {
        sessionId: classToJoin.sessionId
      }, function(token) {
      	connectToSession(token.token)
      }, function(err) {
          console.log(err);
      }).$promise;
			var publisherInitialized = false;
			var connected = false;

			if (OT.checkSystemRequirements() == 1) {
				session = OT.initSession(apiKey, sessionId);
				$scope.$on("$destroy", function() { // destroys the session when navigate away
        	console.log("Disconnecting session because navigated away.")
          publisher.destroy();
          session.destroy();
		    });
			} else {
			  // The client does not support WebRTC.
			  console.log("Not using Chrome or Firefox")
			  alert('BODY is not available in your browser. Please switch to Chrome or Firefox.');
		  	return $location.path('/')
			}

			function connectToSession(token) {
				session.connect(token, function(error) {
				  if (error) {
				  	console.log(error);
				  	if (error.code === 1006) {
				  		alert('Failed to connect. Please check your connection and try connecting again.');
				  	} else {
				  		alert("Unknown error occured while connecting. Please try reloading or contact BODY Support at (216) 408-2902 to get this worked out.")
				  	}
				  } else {
					  connected = true;
				    publish();
				    if (session.capabilities.publish != 1) {
		  				alert("There was an issue. It might might be that you don't have a working webcam or microphone, so nobody else will see you. Please try reloading or contact BODY Support at (216) 408-2902 to get this worked out.")
		  				$location.path('/');
		  			}
				  }
				});	
			};

			setPublisher();

			session.on('streamCreated', function(event) {
				var instructorStream = false
				var instructorInfo;
				var vidWidth = "48%";
				var vidHeight;
				// var vidHeight = 70;

				var streamId = event.stream.connection.data.toString()
				var streamBoxNumber = 1

				if (streamId === classToJoin.trainer._id.toString()) {
					instructorStream = true
					vidWidth = "100%";
				} else {
					vidHeight = 70;
					if (!$scope.consumerObjects[streamId]) {
						$scope.consumerList.push(streamId);
						streamBoxNumber = $scope.consumerList.length;
						console.log(streamBoxNumber);
					} else {
						streamBoxNumber = $scope.consumerObjects[streamId].boxNumber;
					}
				}

				if (userIsInstructor) {
					vidWidth = "16.67%";
					vidHeight = "16.67%";
				}

				var subscriberBox = getIdOfBox(instructorStream ? 0 : streamBoxNumber)
				console.log(subscriberBox)

			  var subscriber = session.subscribe(event.stream, subscriberBox, {
			    insertMode: 'replace',
			    width: vidWidth,
				  height: vidHeight,
				  mirror: true,
			    style: {buttonDisplayMode: 'off'} // Mute button turned off.  Might want to consider turning on for trainer vid since other consumers already ahve audio turned off.
			  }, function(err) {
			  	if (err) {
			  		console.log(err)
			  	} else {
			  		subscriber.restrictFrameRate(false); // When the frame rate is restricted, the Subscriber video frame will update once or less per second and only works with router, not relayed. It reduces CPU usage. It reduces the network bandwidth consumed by the app. It lets you subscribe to more streams simultaneously.
				  	console.log("Received stream");

				  	SpeakerDetection(subscriber, function() {
						  console.log('started talking');
						  if (userIsInstructor) { document.getElementById(getIdOfBox(streamBoxNumber)).style.border = "thick solid #0000FF"; }
						  setMusicVolume($scope.musicVolume/2.5)
						}, function() {
							setMusicVolume($scope.musicVolume)
						  console.log('stopped talking');
						  if (userIsInstructor) { document.getElementById(getIdOfBox(streamBoxNumber)).style.border = "none"; }
						});

				  	if ((!userIsInstructor && !instructorStream) || userIsInstructor) { // Now turns all consumer sound off for instructor. Instructor turns on sound streams by putting mouse over consumer.
				  		subscriber.subscribeToAudio(false); // audio off only if user is a consumer and stream is a consumer
				  	} else {
				  		subscriber.subscribeToAudio(true); // Audio on in any other case
				  		subscriber.setAudioVolume(100);
				  	}

				  	console.log(subscriber.getStats())

				  	//Need to check if this user is already in the consumerList or not
						if (!instructorStream) {
							if (classToJoin.bookedUsers[streamId]) {
								if (!$scope.consumerObjects[streamId]) subscriberArray.push(subscriber);
								$scope.consumerObjects[streamId] = classToJoin.bookedUsers[streamId]
	            	$scope.consumerObjects[streamId].boxNumber = streamBoxNumber;
	            	if(!$scope.$$phase) $scope.$apply();
							} else {
						  	var streamUser = User.getUser({id: $scope.currentUser._id}, {userToGet: streamId}).$promise.then(function(data) {
						  		if (!$scope.consumerObjects[streamId]) subscriberArray.push(subscriber);
		            	$scope.consumerObjects[streamId] = data;
		            	$scope.consumerObjects[streamId].boxNumber = streamBoxNumber;
		            	if(!$scope.$$phase) $scope.$apply();
		            })
		          }
						} else {
							User.getUser({id: $scope.currentUser._id}, {userToGet: streamId}).$promise.then(function(data) {
	            	instructorInfo = data;
	            })
						}

						if (userIsInstructor) {
							subscriber.setStyle("nameDisplayMode", "on");
						} else {
							subscriber.setStyle("nameDisplayMode", "off");	
						}
				  	console.log($scope.consumerObjects);
				  	console.log(streamId);
				  	console.log($scope.consumerObjects[$scope.consumerList[0]].firstName)
				  	subscriber.setStyle('backgroundImageURI', $scope.consumerObjects[streamId] ? $scope.consumerObjects[streamId].picture : classToJoin.trainer.picture); //Sets image to be displayed when no video
				  	subscriber.setStyle('audioLevelDisplayMode', 'off');

				  	subscriber.on("videoDisabled", function(event) { // Router will disable video if quality is below a certain threshold
						  // Set picture overlay
						  // domElement = document.getElementById(subscriber.id);
						  // domElement.style["visibility"] = "hidden";
						});

						subscriber.on("videoEnabled", function(event) { // Router will re-enable video if quality comes above certain threshold
							// Remove picture overlay
						  // domElement = document.getElementById(subscriber.id);
						  // domElement.style["visibility"] = "visible";
						});
				  }
			  });
			});

			session.on("streamDestroyed", function (event) {
				event.preventDefault() // User picture now displayed when they disconnect.
				// if (event.reason === 'networkDisconnected') {
				// 	console.log(event);
		  //     event.preventDefault(); // prevents object from being destroyed and removed from the DOM.  Replace with the user's picture?
		  //     var subscribers = session.getSubscribersForStream(event.stream); // returns all of the Subscriber objects for a Stream
		  //     if (subscribers.length > 0) {
		  //     	console.log(subscribers);
		  //       var subscriber = document.getElementById(subscribers[0].id);
		  //       // Display error message inside the Subscriber
		  //       subscriber.innerHTML = 'Lost connection. This could be due to your internet connection '
		  //         + 'or because the other party lost their connection.';
		  //       event.preventDefault();   // Prevent the Subscriber from being removed
		  //     }
		  //   }
			});

			session.on({
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

  		var publish = function() {
			  if (connected && publisherInitialized) {
			    session.publish(publisher, function(err) {
					  if(err) {
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

			function setPublisher() {
				// if (userIsDan) { return }
				// OT.getDevices(function(error, devices) {
				// 	if (devices) {
				// 	  var audioInputDevices = devices.filter(function(element) {
				// 	    return element.kind == "audioInput";
				// 	  });
				// 	  var videoInputDevices = devices.filter(function(element) {
				// 	    return element.kind == "videoInput";
				// 	  });
				// 	  for (var i = 0; i < audioInputDevices.length; i++) {
				// 	    console.log("audio input device: ", audioInputDevices[i].deviceId);
				// 	  }
				// 	  for (i = 0; i < videoInputDevices.length; i++) {
				// 	    console.log("video input device: ", videoInputDevices[i].deviceId);
				// 	  }
				// 	} else {
				// 		console.log("No devices discovered " + err)
				// 	}
				// });

				var vidWidth;
				var vidHeight;
				var suggestedResolution;
				var suggestedFPS;

				if (userIsInstructor) {
					vidWidth = "16.67%";
					vidHeight = "16.67%";
					suggestedResolution = "1280x720";
					suggestedFPS = 30;
				} else {
					vidWidth = "100%"
					suggestedResolution = "320x240";
					suggestedFPS = 7;
				}

				var audioInputDevice = Video.getAudioInput().deviceId;
				var videoInputDevice = Video.getVideoInput().deviceId;

				publisher = OT.initPublisher(getIdOfBox(userIsInstructor?0:1), {
		      insertMode: 'replace',
		      audioSource: audioInputDevice, 
		      videoSource: videoInputDevice,
		      resolution: suggestedResolution,
		      frameRate: suggestedFPS,
		      publishAudio:true, 
		      publishVideo:true,
		      mirror: true,
		      width: vidWidth,
				  height: vidHeight,
		      name: currentUser.firstName + " " + currentUser.lastName.charAt(0),
		      style: {
		      	buttonDisplayMode: 'off', //Mute microphone button
		      	nameDisplayMode: 'off' //Can also be off or auto
		      }
		    }, function(err) {
		    	if (err) {
				    if (err.code === 1500 && err.message.indexOf('Publisher Access Denied:') >= 0) {
				      // Access denied can also be handled by the accessDenied event
				      alert('Please allow access to the Camera and Microphone and try publishing again.');
				    } else {
				      alert('Failed to get access to your camera or microphone. Please check that your webcam'
				        + ' is connected and not being used by another application and try again.');
				    }
				    publisher.destroy();
				    publisher = null;
		    	} else {
			    	publisherInitialized = true;
				    publish();
			    	console.log("successfully published")
			    }
		    });

		    publisher.on('streamCreated', function (event) {
				    console.log('The publisher started streaming.');
				});

			  publisher.on("streamDestroyed", function (event) {
			  	event.preventDefault();
				  console.log("The publisher stopped streaming. Reason: " + event.reason);
				  if (event.reason === 'networkDisconnected') {
			      alert('Your publisher lost its connection. Please check your internet connection and try publishing again.');
			    }
				});

				publisher.on({
				  accessAllowed: function (event) {
				    // The user has granted access to the camera and mic.
				  },
				  accessDenied: function accessDeniedHandler(event) {
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
		};

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
		        // detected audio activity for more than half second
		        // for the first time.
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

		function navigateAway() {
			publisher.destroy();
		}

		connect()

		$scope.hoveredOverConsumer = function(consumerBoxNumber) {
			$scope.hover0 = false;
			$scope.hover1 = false;
			$scope.hover2 = false;
			$scope.hover3 = false;
			$scope.hover4 = false;
			$scope.hover5 = false;
			$scope.hover6 = false;
			$scope.hover7 = false;
			$scope.hover8 = false;
			$scope.hover9 = false;
			$scope.hover10 = false;
			$scope.hover11 = false;
			$scope.hover12 = false;
			$scope.hover13 = false;
			$scope.hover14 = false;
			$scope.hover15 = false;
			
			consumerBoxNumber -=1;

			// console.log(subscriberArray)
			// console.log(lastConsumerTrainerCouldHear)
			// console.log(consumerBoxNumber)

			for (var i = 0; i < subscriberArray.length; i++) {
				subscriberArray[i].subscribeToAudio(false);
				if (i === consumerBoxNumber) {
					console.log("subscribing to audio from "+subscriberArray[i].streamId)
					subscriberArray[i].subscribeToAudio(true);	
				}
			}
			
			// if (subscriberArray[lastConsumerTrainerCouldHear] && lastConsumerTrainerCouldHear != consumerBoxNumber) {
			// 	subscriberArray[lastConsumerTrainerCouldHear].subscribeToAudio(false);
			// 	var oldStreamId = subscriberArray[lastConsumerTrainerCouldHear].streamId;
			// 	console.log("Killing audio from " + oldStreamId)
			// 	// console.log("Killing audio from " + $scope.consumerObjects[oldStreamId].firstName + " " + $scope.consumerObjects[oldStreamId].lastName)
			// }
			// // if (!consumerBoxNumber) return console.log("Can't hear yourself!")
			// if (subscriberArray.length < 1) return console.log("No consumers");
			// if (!subscriberArray[consumerBoxNumber]) return console.log("No consumer audio found in that box")
			// lastConsumerTrainerCouldHear = consumerBoxNumber;
			// subscriberArray[consumerBoxNumber].subscribeToAudio(true);
			// subscriberArray[consumerBoxNumber].setAudioVolume(100);
			// var userStreamId = subscriberArray[consumerBoxNumber].streamId;
			// console.log("Now listening to " + userStreamId)
			// console.log("Now listening to " + $scope.consumerObjects[userStreamId].firstName + " " + $scope.consumerObjects[userStreamId].lastName)
		}

		$scope.exitClass = function() {
			publisher.destroy();
      session.destroy();
			$location.path('/classfeedback');
		}

		//Stopwatch magic. Prevents issue where NaN was showing up for current time.
		// $scope.tabata.$loaded().then(function() {
		// 	tabataRef.child("lastButtonPress").on('value', function(command) {
		// 		var timeVar = "last"+command.val()+"Time"
		// 		var commandTime = tabataRef.child(timeVar).once('value', function(time) {
		// 			var currentTimeMod = new Date().getTime() - 1000*1;
		// 			if (time.val() > currentTimeMod) {
		// 				switch (command.val()) {
		// 					case "Start": 
		// 						document.getElementById('tabata').start();
		// 						break;
		// 					case "Stop": 
		// 						document.getElementById('tabata').stop();
		// 						break;
		// 					case "Reset": 
		// 						document.getElementById('tabata').reset();
		// 						break;
		// 					default: 
		// 						break;
		// 				}
		// 			}
		// 		})
		// 	})

			// tabataRef.child("lastButtonPress").on('value', function(state) {
			// 	if ($scope.tabata.rounds > 0) {
			// 		// var timeVar = "lastStateTime"
			// 		var commandTime = tabataRef.child(timeVar).once('value', function(time) {
			// 			var currentTimeMod = new Date().getTime() - 1000*1;
			// 			if (time.val() > currentTimeMod) {
			// 				tabataRef.child("currentStopwatchTime").once('value', function(time) {
			// 					$scope.tabata.currentStopwatchTime = time.val();
			// 					switch (state.val()) {
			// 					case true: 	
			// 						console.log("WORK for " + $scope.tabata.currentStopwatchTime + " seconds!")
			// 						console.log()
			// 						$timeout(function() {
			// 							document.getElementById('tabata').stop();
			// 							document.getElementById('tabata').reset();
			// 							document.getElementById('tabata').start();	
			// 						}, 500)
			// 						break;
			// 					case false: 
			// 						console.log("Rest for " + $scope.tabata.currentStopwatchTime + " seconds")
			// 						$timeout(function() {
			// 							document.getElementById('tabata').stop();
			// 							document.getElementById('tabata').reset();
			// 							document.getElementById('tabata').start();	
			// 						}, 500)
			// 						break;
			// 					default: 
			// 						break;
			// 					}
			// 				})		
			// 			}
			// 		})
			// 	}
			// })

			// tabataRef.child("currentStopwatchTime").on('value', function(time) {
			// 	$scope.tabata.currentStopwatchTime = time.val();
			// 	console.log("Stopwatch time set to " + time.val())
			// })
	  // });		
		
		$scope.startTabata = function() {
			$scope.tabata.lastStart = new Date().getTime();
			// document.getElementById('tabata').start()
			$timeout(function() {document.getElementById('tabata').start();}, 1000)
	    // $scope.tabata.lastStartTime = new Date().getTime();
	    // $scope.tabata.lastStateTime = new Date().getTime();
	    // $scope.tabata.lastButtonPress = "Start";
			// $scope.tabata.$save()
		};

		// $scope.stopStopwatch = function() {
	 //    $scope.tabata.lastStopTime = new Date().getTime();
	 //    $scope.tabata.lastButtonPress = "Stop";
		// 	$scope.tabata.$save()
		// }

		// $scope.resetStopwatch = function() {
		// 	$scope.tabata.isOn = true
		// 	$scope.tabata.currentStopwatchTime = $scope.tabata.timeOn * 60;
		// 	$scope.tabata.lastResetTime = new Date().getTime();
		// 	$scope.tabata.lastButtonPress = "Reset";
		// 	$scope.tabata.$save()
		// }

		$scope.setTabata = function() {
			$scope.tabata.isOn = true
			document.getElementById('tabata').stop();
			document.getElementById('tabata').reset();
			$scope.tabata.lastSet = new Date().getTime();
			$scope.tabata.currentTabataTime = $scope.tabata.timeOnMinutes*60 + $scope.tabata.timeOnSeconds*1;
			if(!$scope.$$phase) $scope.$apply();
			// $scope.tabata.lastResetTime = new Date().getTime();
			// $scope.tabata.lastButtonPress = "Set";
			// $scope.tabata.$save()
		}

		function setTabataOptions() {
			$scope.timeOnMinuteOptions = [];
			for (var i = 0; i < 11; i++) {
				$scope.timeOnMinuteOptions.push(i.toString())
			}

			$scope.timeOnSecondOptions = [];
			$scope.timeOffSecondOptions = [];
			for (var i = 0; i < 7; i++) {
				var seconds = i*10;
				$scope.timeOnSecondOptions.push(seconds.toString())
				$scope.timeOffSecondOptions.push(seconds.toString())
			}

			$scope.roundOptions = []
			for (var i = 1; i < 21; i++) {
				$scope.roundOptions.push(i.toString())
			}
		}

		$scope.startStopwatch = function() {
			stopwatchRef.$value = new Date().getTime();
			stopwatchRef.$save();

			// document.getElementById('stopwatch').start();
		}

		$scope.stopStopwatch = function() {
			stopwatchRef.$value = false;
			stopwatchRef.$save();
			// document.getElementById('stopwatch').stop();
			// document.getElementById('stopwatch').reset();
		}

		// function resetStopwatch() {
		// 	document.getElementById('stopwatch').reset();
		// }

		$scope.switchTimerType = function() {
			$scope.tabata.tabataActive = !$scope.tabata.tabataActive;
		}

		// $scope.setTimeOn = function(on) {
		// 	// tabataRef.update({"timeOn": on, "currentStopwatchTime": on})		
		// 	$scope.tabata.timeOn = on
		// 	$scope.tabata.currentStopwatchTime = on * 60;
		// 	$scope.tabata.$save()
		// }

		// $scope.setTimeOff = function(off) {
		// 	// tabataRef.update({"timeOff": off})
		// 	$scope.tabata.timeOff = off
		// 	$scope.tabata.$save()
		// }

		// $scope.setRounds = function(rounds) {
		// 	$scope.tabata.rounds = rounds
		// 	$scope.tabata.$save()
		// 	// tabataRef.update({"rounds": rounds})
		// }

		$scope.timerAtZero = function() {
			console.log("Timer at zero");
			// document.getElementById('tabata').stop();
			if (userIsInstructor) {
				if ($scope.tabata.isOn) {
					if ($scope.tabata.rounds > 0) {
						$scope.tabata.rounds -= 1;
						$scope.tabata.currentTabataTime = $scope.tabata.timeOffSeconds*1;
						$scope.tabata.isOn = false;
						console.log("Setting tabata to off");
						if(!$scope.$$phase) $scope.$apply();
												
						document.getElementById('tabata').stop();
						document.getElementById('tabata').reset();
						// document.getElementById('tabata').start();
						$timeout(function() {document.getElementById('tabata').start();}, 1000)
					}
					// document.getElementById('tabata').start();
				} else {
					if ($scope.tabata.rounds > 0) {
						$scope.tabata.currentTabataTime = $scope.tabata.timeOnMinutes*60 + $scope.tabata.timeOnSeconds*1
						$scope.tabata.isOn = true;
						console.log("Setting tabata to on");
						if(!$scope.$$phase) $scope.$apply();
						document.getElementById('tabata').stop();
						document.getElementById('tabata').reset();
						// document.getElementById('tabata').start();
						$timeout(function() {document.getElementById('tabata').start();}, 1000)
						// document.getElementById('tabata').start();
					}
				}
			}

				// if ($scope.tabata.isOn) {
				// 	if ($scope.tabata.rounds >= 1) {
				// 		$scope.tabata.rounds -= 1;
				// 	} 
				// }
				// $scope.tabata.$save()

				// $timeout(function() {
				// 	$scope.tabata.isOn = !$scope.tabata.isOn;
				// 	$scope.tabata.lastStateTime = new Date().getTime()
				// 	$scope.tabata.$save()
				// }, 1000)			
			// }
		}

		function classTaken() {
			if (currentUser._id !== classToJoin.trainer._id) {
				if (classToJoin.level === "Intro") {
					User.takeIntroClass({ id: currentUser._id }, {introClassTaken: classToJoin.date}, function(user) {
		        Auth.updateUser(user);
		      }, function(err) {
		          console.log("Error setting intro class taken property: " + err)                  
		      }).$promise;
				} else {
					User.pushTakenClass({ id: currentUser._id }, {classToPush: classToJoin.date}, function(user) {
		        Auth.updateUser(user);
		      }, function(err) {
		          console.log("Error setting class taken property: " + err)                  
		      }).$promise;
				}
			}
		}
	})

	// .directive('backImg', function(){
 //    return function(scope, element, attrs){
 //        var url = attrs.backImg;
 //        element.css({
 //            'background-image': 'url(' + url +')',
 //            'background-size' : 'cover'
 //        });
 //    };
	// })

	.directive('backImg', function(){
	  return function(scope, element, attrs){
	      attrs.$observe('backImg', function(value) {
	          element.css({
	              'background-image': 'url(' + value +')',
	              'background-size' : 'cover'
	          });
	      });
	  };
	});
