'use strict';

angular.module('bodyAppApp')
  .controller('VideoCtrl', function ($scope, $location, $interval, $window, $firebaseObject, Auth, User, Schedule) {

  	var classToJoin = Schedule.classUserJustJoined;
  	if (!classToJoin) {
			$location.path('/')
		}

				// check for WebRTC
		if (!navigator.webkitGetUserMedia && !navigator.mozGetUserMedia) {
		  alert('WebRTC is not available in your browser. Please switch to Chrome or Firefox.');
		  $location.path('/')
		}

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

		$scope.$on('$destroy', function() {
      console.log("hanging up easyrtc connection.")
      easyrtc.disconnect();
      easyrtc.webSocket.disconnect();
      easyrtc.hangupAll();
      $interval.cancel(endClassCheckInterval);
    });
  	
		var firstTimePlayingSong = true;
		easyrtc.dontAddCloseButtons(true);
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
		var conversationsClient;
		var activeConversation;
		var previewMedia;

		var userIsInstructor = currentUser._id.toString() === classToJoin.trainer._id.toString()
		if (!userIsInstructor) {
			$scope.consumerList.push(currentUser._id);
			$scope.consumerObjects[currentUser._id] = currentUser;
		}

		var audioPlayer;
		$scope.musicVolume = 50;

		var classDate = new Date(classToJoin.date)
    var sunDate = new Date()
    sunDate.setDate(classDate.getDate()-classDate.getDay())
    var ref = new Firebase("https://bodyapp.firebaseio.com/")
    var volumeRef = $firebaseObject(
      ref.child("weekof"+(sunDate.getMonth()+1)+sunDate.getDate()+sunDate.getFullYear())
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
			if (userIsInstructor) {
				audioPlayer.setVolume(musicVolume / 1000);
			} else {
				audioPlayer.setVolume(musicVolume / 500);
			}
		}

		// Video player
		getTwilioAccessToken()	

		function getTwilioAccessToken() {
			User.getTwilioAccessToken({ id: currentUser._id }, function(accessToken) {
				
        // use our AccessToken to create an AccessManager object
				var accessManager = new Twilio.AccessManager(accessToken.token);
				 
				// create a Conversations Client and connect to Twilio
				conversationsClient = new Twilio.Conversations.Client(accessManager);
				conversationsClient.listen().then(
				  clientConnected,
				  function (error) {
				    console.log('Could not connect to Twilio: ' + error.message);
				  }
				);
      }, function(err) {
          console.log("Error getting Twilio Access Token: " + err)
          alert("sorry, there was an issue connecting to the video player.  Please try reloading the site and coming back into the video player.  If that doesn't work, contact the BODY help team at (216) 408-2902 to get this squared away.")    
      }).$promise;
		}

		// successfully connected!
		function clientConnected() {
			showMyVideo()
		  // document.getElementById('invite-controls').style.display = 'block';
		  console.log("Connected to Twilio. Listening for incoming Invites as '" + conversationsClient.identity + "'");

		  conversationsClient.on('invite', function (invite) {
		    console.log('Incoming invite from: ' + invite.from);
		    invite.accept().then(conversationStarted);
		  });

	  	var keys = [];
	  	if (!userIsInstructor) {
		  	keys.push(classToJoin.trainer._id);
		  }

			for(var k in classToJoin.bookedUsers) {
				if (k != currentUser._id) {
					keys.push(k);
				}
			}

			if (keys.length > 0) {
		  	createConversation(keys)	
		  }
		};

		// conversation is live
		function conversationStarted(conversation) {
		  console.log('In an active Conversation');
		  console.log(conversation);
		  activeConversation = conversation;
		  // draw local video, if not already previewing
		  if (!previewMedia) {
		  	console.log("attaching local stream to box 1")
		    conversation.localMedia.attach('#box1');
		  }
		  // when a participant joins, draw their video on screen
		  conversation.on('participantConnected', function (participant) {
		    console.log("Participant '" + participant.identity + "' connected");
		    if (participant.identity === classToJoin.trainer._id) {
		    	console.log("Trainer connected, placing into box 0")
		    	participant.media.attach('#box0');	
		    } else{
					$scope.consumerList.push(participant.identity);
		    	console.log("User "+participant.identity + " connected, placing into box "+ $scope.consumerList.length)
		    	participant.media.attach('#box' + $scope.consumerList.length);
		    	$scope.consumerObjects[participant.identity] = participant;	
		    }
		  });
		  // when a participant disconnects, note in console.log
		  conversation.on('participantDisconnected', function (participant) {
		    console.log("Participant '" + participant.identity + "' disconnected");
		  });
		  // when the conversation ends, stop capturing local video
		  conversation.on('ended', function (conversation) {
		    console.log("Connected to Twilio. Listening for incoming Invites as '" + conversationsClient.identity + "'");
		    // conversation.localMedia.stop(); // This stops showing user's own stream.
		    conversation.disconnect();
		    activeConversation = null;
		  });
		};

		function createConversation(usersToInvite) {
				// var inviteTo = document.getElementById('invite-to').value;
		    if (activeConversation) {
		      // add a participant
		      activeConversation.invite(usersToInvite);
		    } else {
		      // create a conversation
		      var options = {};
		      if (previewMedia) {
		        options.localMedia = previewMedia;
		      }
		      conversationsClient.createConversation(usersToInvite, options).then(
		        conversationStarted,
		        function (error) {
		          console.log('Unable to create conversation');
		          console.error('Unable to create conversation', error);
		        }
		      );
		    }
		}

		function showMyVideo() {
			if (!previewMedia) {
		    previewMedia = new Twilio.Conversations.LocalMedia();
		    Twilio.Conversations.getUserMedia().then(
		      function (mediaStream) {
		        previewMedia.addStream(mediaStream);
		        if (userIsInstructor) {
		        	previewMedia.attach('#box0');	
		        } else {
			        previewMedia.attach('#box1');
			      }
		      },
		      function (error) {
		        console.error('Unable to access local media', error);
		        console.log('Unable to access Camera and Microphone');
		      }
		    );
		  };
		}

		// //  local video preview
		// document.getElementById('button-preview').onclick = function () {
		//   if (!previewMedia) {
		//     previewMedia = new Twilio.Conversations.LocalMedia();
		//     Twilio.Conversations.getUserMedia().then(
		//       function (mediaStream) {
		//         previewMedia.addStream(mediaStream);
		//         previewMedia.attach('#box1');
		//       },
		//       function (error) {
		//         console.error('Unable to access local media', error);
		//         console.log('Unable to access Camera and Microphone');
		//       }
		//     );
		//   };
		// };

		// var newAccessToken = updateTokenFromServer();
		// accessManager.updateToken(newAccessToken);
		// accessManager.on('tokenUpdated', function() {
		//     console.log("Token updated");
		// });


		// function loginSuccess() {
		// }

		// var _init = function() {
	 //    easyrtc.initMediaSource(
	 //        function(){       // success callback
	 //          var myBoxNumber;  
	 //            if (userIsInstructor) {
	 //            	easyrtc.setUsername("trainer");
	 //            	myBoxNumber = 0;	
	 //            } else {
		//             easyrtc.setUsername(currentUser._id.toString());
		//             myBoxNumber = 1;
		//           }
		//           var selfVideo = document.getElementById(getIdOfBox(myBoxNumber));
		//           selfVideo.style.visibility = 'visible'; //This is the box for this user
	 //            easyrtc.setVideoObjectSrc(selfVideo, easyrtc.getLocalStream());           
	 //            easyrtc.connect(""+classToJoin.date+"", loginSuccess);
	            
	 //        }, function() { //Failure callback
	 //        	alert("Body App can't access your video camera.  Please make sure your browser is allowing Body App to access your camera and microphone by clicking permissions in the address bar above.")
	 //        }
	 //    );

	 //    easyrtc.setRoomOccupantListener(callEverybodyElse);

	 //    // easyrtc.setPeerListener(messageListener);
	 //    easyrtc.setDisconnectListener( function() {
	 //        easyrtc.showError('LOST-CONNECTION', 'Lost connection to signaling server');
	 //    });
		// };

		// function getIdOfBox(boxNum) {
	 //    return 'box' + boxNum;
		// }

		// function callEverybodyElse(roomName, otherPeople) {
		// 	console.log("calling everybody else");
	 //    easyrtc.setRoomOccupantListener(null); // so we're only called once.

	 //    var list = [];
	 //    var connectCount = 0;
	 //    for(var easyrtcid in otherPeople ) {
	 //        list.push(easyrtcid);
	 //    }

	 //    function establishConnection(position) {
	 //        function callSuccess() {
	 //            connectCount++;
	 //            if( connectCount < maxCALLERS && position > 0) {
	 //                establishConnection(position-1);
	 //            }
	 //        }
	 //        function callFailure(errorCode, errorText) {
	 //            easyrtc.showError(errorCode, errorText);
	 //            if( connectCount < maxCALLERS && position > 0) {
	 //                establishConnection(position-1);
	 //            }
	 //        }
	 //        easyrtc.call(list[position], callSuccess, callFailure);

	 //    }
	 //    if( list.length > 0) {
	 //        establishConnection(list.length-1);
	 //    }
		// }

		// easyrtc.setStreamAcceptor( function(callerEasyrtcid, stream) {
		// 	console.log("new stream accepted")
		//     var callerUsername = easyrtc.idToName(callerEasyrtcid);
		//     if (!userIsInstructor && callerUsername === 'trainer') {
		//         var mainVideo = document.getElementById(getIdOfBox(0));
		//         easyrtc.setVideoObjectSrc(mainVideo, stream);
		//         mainVideo.style.visibility = 'visible';
		//         easyrtc.muteVideoObject(mainVideo, false);
		//         // getTrainerMicrophoneLevel(stream);

		//     } else {
		//     		if (userIsInstructor && callerUsername === 'trainer') { 
		//     			alert("You already have a connection in a different window"); 
		//     			return console.log("trainer tried to open new window"); 
		//     		}
		//     		else if (callerUsername === currentUser._id.toString()) { 
		//     			alert("You already have a connection in a different window"); 
		//     			return console.log("user tried to open new window"); //Prevents user from accidentally taking multiple windows.
		//     		} 
		//     		else if ($scope.consumerObjects[callerUsername]) {
		//             console.log('caller already has box');
		//             var video = document.getElementById(getIdOfBox($scope.consumerObjects[callerUsername].boxNumber));
		//             video.style.visibility = 'visible';
		//             easyrtc.setVideoObjectSrc(video, stream);
		//             if (userIsInstructor) {
		//             	easyrtc.muteVideoObject(video, false);
		//           	}	else {
		//           		easyrtc.muteVideoObject(video, true);
		//           	}
		//         } else {
		//             console.log('caller is new with easyrtcid of ' + callerUsername);
		//             $scope.consumerList.push(callerUsername);
		//             var consumerListLength = $scope.consumerList.length;
		            
		//             var videoNew = document.getElementById(getIdOfBox(consumerListLength));
		//             videoNew.style.visibility = 'visible';
		//             easyrtc.setVideoObjectSrc(videoNew, stream);
		//             if (userIsInstructor) {
		// 	            easyrtc.muteVideoObject(videoNew, false);
		// 	          } else {
		// 	          	easyrtc.muteVideoObject(videoNew, true);
		// 	          }

		//             var user = User.getUser({id: callerUsername}).$promise.then(function(data) {
		//             	$scope.consumerObjects[callerUsername] = data
		//             	$scope.consumerObjects[callerUsername].boxNumber = consumerListLength
		//             })
		//         }
		//     }
		// });

	 //  easyrtc.setOnStreamClosed( function (callerEasyrtcid) {
	 //    // easyrtc.setVideoObjectSrc(document.getElementById('box0'), ');
	 //    // document.getElementById(getIdOfBox(0)).style.visibility = 'hidden';

	 //    // if (easyrtc.idToName(callerEasyrtcid) === 'trainer') {
	 //    //     var mainVideo = document.getElementById('box0');
	 //    //     easyrtc.setVideoObjectSrc(mainVideo, '');
	 //        // document.getElementById(getIdOfBox(0)).style.visibility = 'hidden';
	 //    // } 
	 //    // else {
	 //        // document.getElementById(getIdOfBox(numConsumers)).style.visibility = 'hidden';
	 //        // var callerUsername = easyrtc.idToName(callerEasyrtcid);
	 //        // var video = document.getElementById(getIdOfBox($scope.consumerObjects[callerUsername]));
	 //    // }
		// });

		// easyrtc.setOnError(function(err) {
		// 	console.log("easyrtc error: ")
		// 	console.log(err)
		// })

		// var getTrainerMicrophoneLevel = function(stream) {
		// 	var max_level_L = 0;
		// 	var old_level_L = 0;

		// 	window.AudioContext = window.AudioContext || window.webkitAudioContext;
		// 	var audioContext = new AudioContext();
		// 	var microphone = audioContext.createMediaStreamSource(stream);
		// 	var javascriptNode = audioContext.createScriptProcessor(1024, 1, 1);
			
		// 	microphone.connect(javascriptNode);
		// 	javascriptNode.connect(audioContext.destination);
		// 	javascriptNode.onaudioprocess = function(event){
		// 		// console.log(event)

		// 		var inpt_L = event.inputBuffer.getChannelData(0);
		// 		// console.log(inpt_L)
		// 		var instant_L = 0.0;

		// 		var sum_L = 0.0;
		// 		for(var i = 0; i < inpt_L.length; ++i) {
		// 			sum_L += inpt_L[i] * inpt_L[i];
		// 			// console.log(sum_L)
		// 		}

		// 		instant_L = Math.sqrt(sum_L / inpt_L.length);
		// 		console.log(instant_L)
		// 		max_level_L = Math.max(max_level_L, instant_L);				
		// 		instant_L = Math.max( instant_L, old_level_L -0.008 );
		// 		old_level_L = instant_L;
		// 		console.log(instant_L)
				
		// 		// cnvs_cntxt.clearRect(0, 0, cnvs.width, cnvs.height);
		// 		// cnvs_cntxt.fillStyle = '#00ff00';
		// 		// cnvs_cntxt.fillRect(10,10,(cnvs.width-20)*(instant_L/max_level_L),(cnvs.height-20)); // x,y,w,h
				
		// 	}
		// }

		// _init();
	})