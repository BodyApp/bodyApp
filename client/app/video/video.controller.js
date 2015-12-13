'use strict';

angular.module('bodyAppApp')
  .controller('VideoCtrl', function ($scope, $location, $interval, $window, $firebaseObject, Auth, User, Schedule) {

  	var classToJoin = Schedule.classUserJustJoined;
  	if (!classToJoin) {
			return $location.path('/')
		}

		// check for WebRTC - moved to vidInit
		// if (!navigator.webkitGetUserMedia && !navigator.mozGetUserMedia) {
		//   alert('BODY is not available in your browser. Please switch to Chrome, Firefox or Opera.');
		//   $location.path('/')
		// }

		$scope.classTime = classToJoin.date;
		var classClosesTime = (classToJoin.date + 1000*60*90)
		var endClassCheckInterval = $interval(function() {
			var currentTime = (new Date()).getTime()
			if (classClosesTime < currentTime) {
				console.log("class is over, booting people out");
				$location.path('/');
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

		$scope.consumerList = [];
		$scope.consumerObjects = {};
		var maxCALLERS = 10;
		var connectionCount = 0;
		var session;
		var publisher;

		var userIsInstructor = currentUser._id.toString() === classToJoin.trainer._id.toString()
		if (!userIsInstructor) {
			$scope.consumerList.push(currentUser._id);
			$scope.consumerObjects[currentUser._id] = currentUser;
		}

		var audioPlayer;
		$scope.musicVolume = 50;

		var classDate = new Date(classToJoin.date)
    var sunDate = new Date();
    sunDate.setDate(classDate.getDate() - classDate.getDay());
    var sunGetDate = sunDate.getDate();
    var sunGetMonth = sunDate.getMonth()+1;
    var sunGetYear = sunDate.getFullYear();
    var weekOf = "weekof"+ (sunGetMonth<10?"0"+sunGetMonth:sunGetMonth) + (sunGetDate<10?"0"+sunGetDate:sunGetDate) + sunGetYear;
    var ref = new Firebase("https://bodyapp.firebaseio.com/")
    var volumeRef = $firebaseObject(
      ref.child(weekOf)
      .child(classDate.getDay())
      .child("slots")
      .child(classDate.getTime())
      .child("musicVolume")
    )

		volumeRef.$loaded().then(function() {
			$scope.musicVolume = volumeRef.$value
			setMusicVolume($scope.musicVolume);
	  });

		volumeRef.$watch(function() {
			$scope.musicVolume = volumeRef.$value
			setMusicVolume($scope.musicVolume);
	  });

		if (typeof SC !== 'undefined') {
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
					$scope.$apply()
				}
				if (firstTimePlayingSong) {
					elapsedTime = new Date().getTime() - classToJoin.date
					var seekingTo = elapsedTime - soundsLength
					audioPlayer.seekTo(seekingTo);
					console.log("seeking to position " + seekingTo);
					$scope.currentSong = songArray[currentSongIndex];
					$scope.$apply()
					firstTimePlayingSong = false;
				} 
			});
		} else {
			alert("Your ad blocker is preventing music from playing.  Please disable it and reload this page.")
		}

		$scope.openSongPermalink = function(currentSong) {
			$window.open(currentSong.permalink_url);
		}

		$scope.setMusicVolume = function(musicVolume) {
			setMusicVolume(musicVolume)
			volumeRef.$value = musicVolume
			volumeRef.$save()
		}

		function setMusicVolume(musicVolume) {
			// if (userIsInstructor) {
				audioPlayer.setVolume(musicVolume / 100);
			// } else {
			// 	audioPlayer.setVolume(musicVolume / 500);
			// }
		}

		// function loginSuccess() {
		// }

		function getIdOfBox(boxNum) {
	    return 'box' + boxNum;
		}

		var connect = function() {
			// OT.setLogLevel(OT.DEBUG); //Lots of additional debugging for dev purposes.
			var apiKey = 45425152;
			var sessionId = classToJoin.sessionId;
			var session;
			
			// setStreamAcceptor();

			User.createTokBoxToken({ id: currentUser._id }, {
        sessionId: classToJoin.sessionId
      }, function(token) {
      	connectToSession(token.token)
      }, function(err) {
          console.log(err);
      }).$promise;
			// var token = 'T1==cGFydG5lcl9pZD00NTQyNTE1MiZzaWc9ODk3MTI5MzkyNDM3ZjA2ZDliZTk2YmNlMjNmOWI0MzUyNmQ2Y2JhMzpyb2xlPXB1Ymxpc2hlciZzZXNzaW9uX2lkPTFfTVg0ME5UUXlOVEUxTW41LU1UUTBPVEE0T0RnNE5EYzFNbjVQUTJwaGVrVTVPRk15UkVWbk4wUk5la1pSTUdwMlFuSi1VSDQmY3JlYXRlX3RpbWU9MTQ0OTE3OTc3MCZub25jZT0wLjMxODA1NjA1ODQxNDAwNTUmZXhwaXJlX3RpbWU9MTQ0OTI2NjE3MA==';
			var publisherInitialized = false;
			var connected = false;

			if (OT.checkSystemRequirements() == 1) {
				session = OT.initSession(apiKey, sessionId);

				$scope.$on("$destroy", function() { // destroys the session when navigate away
	        // if (session) {
	        	console.log("Disconnecting session because navigated away.")
	          // session.unpublish(publisher);
	          // publisher.disconnect();
	          publisher.destroy();

	          // session.disconnect();
	          session.destroy();
	          // session.destroy(publisher);
	        // }

	        // if (publisher) {

	        // }
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
				  	// if (!userIsInstructor) {
						  connected = true;
					    publish();
					  // }
				  }
				});	
			};

			// if (session.capabilities.publish == 1) {
			//     // The client can publish. See the next section.
			// } else {
			//     // The client cannot publish.
			//     alert("There was an issue. It might might be that you don't have a working webcam or microphone, so nobody else will see you. Please try reloading or contact BODY Support at (216) 408-2902 to get this worked out.")
			// }

			setPublisher();

			session.on('streamCreated', function(event) {
				var instructorStream = false
				var instructorInfo;
				var vidWidth = "48%";
				var vidHeight = 60;

				var streamId = event.stream.connection.data.toString()
				var streamBoxNumber = 1

				if (streamId === classToJoin.trainer._id.toString()) {
					instructorStream = true
					vidWidth = "100%";
					vidHeight = 600;
				} else {
					if (!$scope.consumerObjects[streamId]) {
						$scope.consumerList.push(streamId);
						streamBoxNumber = $scope.consumerList.length;
						console.log(streamBoxNumber);
					} else {
						streamBoxNumber = $scope.consumerObjects[streamId].boxNumber;
					}
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

				  	if (!userIsInstructor && !instructorStream) {
				  		subscriber.subscribeToAudio(false); // audio off only if user is a consumer and stream is a consumer
				  	} else {
				  		subscriber.subscribeToAudio(true); // Audio on in any other case
				  		subscriber.setAudioVolume(100);
				  	}

				  	//Need to check if this user is already in the consumerList or not
						if (!instructorStream) {
					  	var streamUser = User.getUser({id: streamId}).$promise.then(function(data) {
	            	$scope.consumerObjects[streamId] = data
	            	$scope.consumerObjects[streamId].boxNumber = streamBoxNumber;
	            })
						} else {
							User.getUser({id: streamId}).$promise.then(function(data) {
	            	instructorInfo = data
	            })
						}

				  	subscriber.setStyle("nameDisplayMode", "on")
				  	subscriber.setStyle('backgroundImageURI', $scope.consumerObjects[streamId] ? $scope.consumerObjects[streamId].picture : "http://www.london24.com/polopoly_fs/1.3602534.1400170400!/image/2302025834.jpg_gen/derivatives/landscape_630/2302025834.jpg"); //Sets image to be displayed when no video
				  	subscriber.setStyle('audioLevelDisplayMode', 'off');

						SpeakerDetection(subscriber, function() {
						  console.log('started talking');
						  if (userIsInstructor) { document.getElementById(getIdOfBox(streamBoxNumber)).style.border = "thick solid #0000FF"; }
						  setMusicVolume($scope.musicVolume/2)
						}, function() {
							setMusicVolume($scope.musicVolume)
						  console.log('stopped talking');
						  if (userIsInstructor) { document.getElementById(getIdOfBox(streamBoxNumber)).style.border = "none"; }
						});

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
				OT.getDevices(function(error, devices) {
					if (devices) {
					  var audioInputDevices = devices.filter(function(element) {
					    return element.kind == "audioInput";
					  });
					  var videoInputDevices = devices.filter(function(element) {
					    return element.kind == "videoInput";
					  });
					  for (var i = 0; i < audioInputDevices.length; i++) {
					    console.log("audio input device: ", audioInputDevices[i].deviceId);
					  }
					  for (i = 0; i < videoInputDevices.length; i++) {
					    console.log("video input device: ", videoInputDevices[i].deviceId);
					  }
					} else {
						console.log("No devices discovered " + err)
					}
				});

				var vidWidth;
				var vidHeight;

				if (userIsInstructor) {
					vidWidth = "16.67%"
					vidHeight = "16.67%"
				} else {
					vidWidth = "100%"
					vidHeight = 125
				}

				publisher = OT.initPublisher(getIdOfBox(userIsInstructor?0:1), {
		      insertMode: 'replace',
		      publishAudio:true, 
		      publishVideo:true,
		      mirror: true,
		      width: vidWidth,
				  height: vidHeight,
		      name: currentUser.firstName + " " + currentUser.lastName.charAt(0),
		      style: {
		      	buttonDisplayMode: 'off', //Mute microphone button
		      	nameDisplayMode: 'on' //Can also be off or auto
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
		      } else if (now- activity.timestamp > 1000) {
		        // detected audio activity for more than 1s
		        // for the first time.
		        activity.talking = true;
		        if (typeof(startTalking) === 'function') {
		          startTalking();
		        }
		      }
		    } else if (activity && now - activity.timestamp > 3000) {
		      // detected low audio activity for more than 3s
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

		$scope.setAllFalse = function() {
			$scope.hover0 = false
			$scope.hover1 = false
			$scope.hover2 = false
			$scope.hover3 = false
			$scope.hover4 = false
			$scope.hover5 = false
			$scope.hover6 = false
			$scope.hover7 = false
			$scope.hover8 = false
			$scope.hover9 = false
			$scope.hover10 = false
			$scope.hover11 = false
			$scope.hover12 = false
			$scope.hover13 = false
			$scope.hover14 = false
			$scope.hover15 = false
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
