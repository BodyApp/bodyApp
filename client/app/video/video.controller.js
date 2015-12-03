'use strict';

angular.module('bodyAppApp')
  .controller('VideoCtrl', function ($scope, $location, $interval, $window, $firebaseObject, Auth, User, Schedule) {

  	var classToJoin = Schedule.classUserJustJoined;
  	if (!classToJoin) {
			$location.path('/')
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
		var connectionCount = 0;
		var session;

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

		// function loginSuccess() {
		// }

		function getIdOfBox(boxNum) {
	    return 'box' + boxNum;
		}

		var connect = function() {
			var apiKey = 45425152;
			var sessionId = '1_MX40NTQyNTE1Mn5-MTQ0OTA4ODg4NDc1Mn5PQ2phekU5OFMyREVnN0RNekZRMGp2QnJ-UH4';

			if (OT.checkSystemRequirements() == 1) {
				var session = OT.initSession(apiKey, sessionId);
			} else {
			  // The client does not support WebRTC.
			  alert('BODY is not available in your browser. Please switch to Chrome or Firefox.');
		  	return $location.path('/')
			}

			var token = 'T1==cGFydG5lcl9pZD00NTQyNTE1MiZzaWc9YjVmMTQxYjM3MzdiYTJjODlhYTg4NTFhNTAzYzU3ZjRkZTYwYWNiZDpyb2xlPXB1Ymxpc2hlciZzZXNzaW9uX2lkPTFfTVg0ME5UUXlOVEUxTW41LU1UUTBPVEE0T0RnNE5EYzFNbjVQUTJwaGVrVTVPRk15UkVWbk4wUk5la1pSTUdwMlFuSi1VSDQmY3JlYXRlX3RpbWU9MTQ0OTA5MTkwMCZub25jZT0wLjc3MTgwMTAyMzAzMzA2ODEmZXhwaXJlX3RpbWU9MTQ0OTE3ODMwMA==';

			session.connect(token, function(error) {
			  if (error) {
			  	if (error.code === 1006) {
			  		alert('Failed to connect. Please check your connection and try connecting again.')
			  	} else {
			  		alert("Unknown error occured while connecting. Please try reloading or contact BODY Support at (216) 408-2902 to get this worked out.")
			  	}
			  } else {
			  	if (!userIsInstructor) {
			  		var publisher = OT.initPublisher(getIdOfBox(userIsInstructor?0:1), {
				      insertMode: 'append',
				    }, function(error) {
				    	if (error) {
				    		alert("Something went wrong and we can't connect your video to the BODY platform.  Please contact BODY Support at (216) 408-2902 to get this worked out.")
				    	}
				    	console.log("successfully published")
				    });
					  session.publish(publisher)
				  }
			  }
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
		      document.getElementById('disconnectBtn').style.display = 'none';
		      if (event.reason == 'networkDisconnected') {
		        alert('You lost your internet connection. Please check your connection and try connecting again.')
		      }
		    }
			});

  		session.on('streamCreated', function(event) {
				$scope.consumerList.push(" ")
			  session.subscribe(event.stream, getIdOfBox($scope.consumerList.length), {
			    insertMode: 'append',
			  }, function() {console.log("Received stream")});
			});

		};

		connect()

		// var _init = function() {
	    // easyrtc.initMediaSource(
	    //     function(){       // success callback
	    //       var myBoxNumber;  
	    //         if (userIsInstructor) {
	    //         	easyrtc.setUsername("trainer");
	    //         	myBoxNumber = 0;	
	    //         } else {
		   //          easyrtc.setUsername(currentUser._id.toString());
		   //          myBoxNumber = 1;
		   //        }
		   //        var selfVideo = document.getElementById(getIdOfBox(myBoxNumber));
		   //        selfVideo.style.visibility = 'visible'; //This is the box for this user
	    //         easyrtc.setVideoObjectSrc(selfVideo, easyrtc.getLocalStream());           
	    //         easyrtc.connect(""+classToJoin.date+"", loginSuccess);
	            
	    //     }, function() { //Failure callback
	    //     	alert("Body App can't access your video camera.  Please make sure your browser is allowing Body App to access your camera and microphone by clicking permissions in the address bar above.")
	    //     }
	    // );

	    // easyrtc.setRoomOccupantListener(callEverybodyElse);

	    // easyrtc.setPeerListener(messageListener);
	    // easyrtc.setDisconnectListener( function() {
	    //     easyrtc.showError('LOST-CONNECTION', 'Lost connection to signaling server');
	    // });
		// };

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

	  // easyrtc.setOnStreamClosed( function (callerEasyrtcid) {
	    // easyrtc.setVideoObjectSrc(document.getElementById('box0'), ');
	    // document.getElementById(getIdOfBox(0)).style.visibility = 'hidden';

	    // if (easyrtc.idToName(callerEasyrtcid) === 'trainer') {
	    //     var mainVideo = document.getElementById('box0');
	    //     easyrtc.setVideoObjectSrc(mainVideo, '');
	        // document.getElementById(getIdOfBox(0)).style.visibility = 'hidden';
	    // } 
	    // else {
	        // document.getElementById(getIdOfBox(numConsumers)).style.visibility = 'hidden';
	        // var callerUsername = easyrtc.idToName(callerEasyrtcid);
	        // var video = document.getElementById(getIdOfBox($scope.consumerObjects[callerUsername]));
	    // }
		// });

		// easyrtc.setOnError(function(err) {
		// 	console.log("easyrtc error: ")
		// 	console.log(err)
		// })

		// _init();
	})