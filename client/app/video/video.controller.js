'use strict';

angular.module('bodyAppApp')
  .controller('ConsumerVideoCtrl', function ($scope, $location, Auth, User, Schedule) {

  	var classToJoin = Schedule.classUserJustJoined;
  	if (!classToJoin) {
			$location.path('/')
		}

  	var maxCALLERS = 10;
		$scope.consumerList = [];
		$scope.consumerObjects = {};

		var elapsedTime = Math.round((new Date().getTime() - classToJoin.date), 0)
		var soundsLength = 0

		// document.getElementById('audioPlayer').volume = 0.5

		var firstTimePlayingSong = true;

		easyrtc.dontAddCloseButtons(true);

		var currentUser = Auth.getCurrentUser();
		$scope.currentUser = currentUser;

		$scope.consumerList.push(currentUser._id);
		$scope.consumerObjects[currentUser._id] = currentUser;

		// function setMusicPlayer() {

		// if (!SC) {
		// 	alert('nope')
		// } else {
		if (typeof SC !== 'undefined') {
			var audioPlayer = SC.Widget(document.getElementById('audioPlayer'));

			audioPlayer.bind(SC.Widget.Events.PLAY, function(){
				if (firstTimePlayingSong) {
					setTimeout(function(){ firstTimePlayingSong = false }, 2000);
					audioPlayer.setVolume(0.10);
					console.log("playing audio with elapsed time of " + elapsedTime);		
					audioPlayer.getSounds(function(soundArray) {					
						for (var i = 0; i < soundArray.length; i++) {
							if (elapsedTime > soundsLength + soundArray[i].duration) {
								soundsLength += soundArray[i].duration;
								audioPlayer.next()						
							} else {
								var seekingTo = Math.round(elapsedTime - soundsLength, 0)
								console.log("seeking to " + seekingTo);						
								return audioPlayer.seekTo(seekingTo)
							}
						}	
					})
				}
			});

			audioPlayer.bind(SC.Widget.Events.PLAY_PROGRESS, function(){
				audioPlayer.getCurrentSoundIndex(function(index) {
					audioPlayer.getPosition(function(position) {
						console.log("playing song " + index + " at " + position + " ms")
					})
				})
			});
		} else {
			alert("Your ad blocker is preventing music from playing.  Please disable it and reload this page.")
		}
		// }

		function loginSuccess() {
		}

		var _init = function() {
	    easyrtc.initMediaSource(
	        function(){       // success callback
	            var selfVideo = document.getElementById('box1');
	            easyrtc.setVideoObjectSrc(selfVideo, easyrtc.getLocalStream());
	            easyrtc.setUsername(currentUser._id.toString());
	            console.log("set username to " + currentUser._id.toString())
	            easyrtc.connect(""+classToJoin.date+"", loginSuccess);
	            document.getElementById(getIdOfBox(1)).style.visibility = 'visible'; //This is the box for this user
	        }, function() { //Failure callback
	        	alert("Body App can't access your video camera.  Please make sure your browser is allowing Body App to access your camera and microphone by clicking permissions in the address bar above.")
	        }
	    );

	    easyrtc.setRoomOccupantListener(callEverybodyElse);

	    // easyrtc.setPeerListener(messageListener);
	    easyrtc.setDisconnectListener( function() {
	        easyrtc.showError('LOST-CONNECTION', 'Lost connection to signaling server');
	    });
		};

		function getIdOfBox(boxNum) {
	    return 'box' + boxNum;
		}

		function callEverybodyElse(roomName, otherPeople) {
			console.log("calling everybody else");
	    easyrtc.setRoomOccupantListener(null); // so we're only called once.

	    var list = [];
	    var connectCount = 0;
	    for(var easyrtcid in otherPeople ) {
	        list.push(easyrtcid);
	    }

	    function establishConnection(position) {
	        function callSuccess() {
	            connectCount++;
	            if( connectCount < maxCALLERS && position > 0) {
	                establishConnection(position-1);
	            }
	        }
	        function callFailure(errorCode, errorText) {
	            easyrtc.showError(errorCode, errorText);
	            if( connectCount < maxCALLERS && position > 0) {
	                establishConnection(position-1);
	            }
	        }
	        easyrtc.call(list[position], callSuccess, callFailure);

	    }
	    if( list.length > 0) {
	        establishConnection(list.length-1);
	    }
		}

		easyrtc.setStreamAcceptor( function(callerEasyrtcid, stream) {
			console.log("new stream accepted")
		    var callerUsername = easyrtc.idToName(callerEasyrtcid);
		    if (callerUsername === 'trainer') {
		        var mainVideo = document.getElementById('box0');
		        easyrtc.setVideoObjectSrc(mainVideo, stream);
		        document.getElementById(getIdOfBox(0)).style.visibility = 'visible';
		        easyrtc.muteVideoObject(mainVideo, false);
		        // getTrainerMicrophoneLevel(stream);

		    } else {
		    		if (callerUsername === currentUser._id.toString()) { return console.log("user tried to open new window") //Prevents user from accidentally taking multiple windows.
		    		} else if ($scope.consumerObjects[callerUsername]) {
		            console.log('caller already has box');
		            var video = document.getElementById(getIdOfBox($scope.consumerObjects[callerUsername].boxNumber));
		            document.getElementById(getIdOfBox($scope.consumerObjects[callerUsername].boxNumber)).style.visibility = 'visible';
		            easyrtc.setVideoObjectSrc(video, stream);
		            easyrtc.muteVideoObject(video, true);
		            
		        } else {
		            console.log('caller is new with easyrtcid of ' + callerUsername);
		            $scope.consumerList.push(callerUsername);
		            console.log(callerUsername);
		            var consumerListLength = $scope.consumerList.length;
		            
		            document.getElementById(getIdOfBox(consumerListLength)).style.visibility = 'visible';
		            var videoNew = document.getElementById(getIdOfBox(consumerListLength));
		            easyrtc.setVideoObjectSrc(videoNew, stream);
		            // $scope.consumerObjects[callerUsername] = consumerListLength;
		            easyrtc.muteVideoObject(videoNew, true);

		            var user = User.getUser({id: callerUsername}).$promise.then(function(data) {
		            	
		            	$scope.consumerObjects[callerUsername] = data
		            	$scope.consumerObjects[callerUsername].boxNumber = consumerListLength
		            })
		        }
		    }
		});

	  easyrtc.setOnStreamClosed( function (callerEasyrtcid) {
	    // easyrtc.setVideoObjectSrc(document.getElementById('box0'), ');
	    // document.getElementById(getIdOfBox(0)).style.visibility = 'hidden';

	    if (easyrtc.idToName(callerEasyrtcid) === 'trainer') {
	        var mainVideo = document.getElementById('box0');
	        easyrtc.setVideoObjectSrc(mainVideo, '');
	        // document.getElementById(getIdOfBox(0)).style.visibility = 'hidden';
	    } 
	    else {
	        // document.getElementById(getIdOfBox(numConsumers)).style.visibility = 'hidden';
	        // var callerUsername = easyrtc.idToName(callerEasyrtcid);
	        // var video = document.getElementById(getIdOfBox($scope.consumerObjects[callerUsername]));
	    }
		});

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

		_init();
	})

	.controller('TrainerVideoCtrl', function ($scope, $location, Auth, Schedule) {
		//Should only be accessible to trainers.
	  var maxCALLERS = 10;
		easyrtc.dontAddCloseButtons(true);

		var classToJoin = Schedule.classUserJustJoined;
		if (!classToJoin) {
			$location.path('/')
		}

		var elapsedTime = Math.round((new Date().getTime() - classToJoin.date), 0)
		var soundsLength = 0

		// document.getElementById('audioPlayer').volume = 0.5

		var firstTimePlayingSong = true;

		var audioPlayer = SC.Widget(document.getElementById('audioPlayer'));
		audioPlayer.bind(SC.Widget.Events.READY, function() {
			// audioPlayer.load("https%3A//api.soundcloud.com/playlists/27058368")
    	audioPlayer.setVolume(0.10)
    	audioPlayer.play()
   });

		audioPlayer.bind(SC.Widget.Events.PLAY, function(){
			if (firstTimePlayingSong) {
				setTimeout(function(){ firstTimePlayingSong = false }, 2000);
				audioPlayer.setVolume(0.10);
				console.log("playing audio with elapsed time of " + elapsedTime);		
				audioPlayer.getSounds(function(soundArray) {					
					for (var i = 0; i < soundArray.length; i++) {
						if (elapsedTime > soundsLength + soundArray[i].duration) {
							soundsLength += soundArray[i].duration;
							audioPlayer.next()						
						} else {
							var seekingTo = Math.round(elapsedTime - soundsLength, 0)
							console.log("seeking to " + seekingTo);						
							return audioPlayer.seekTo(seekingTo)
						}
					}	
				})
			}
		});

		audioPlayer.bind(SC.Widget.Events.PLAY_PROGRESS, function(){
			audioPlayer.getCurrentSoundIndex(function(index) {
				audioPlayer.getPosition(function(position) {
					console.log("playing song " + index + " at " + position + " ms")
				})
			})
		});

		function getIdOfBox(boxNum) {
		    return 'box' + boxNum;
		}

		function callEverybodyElse(roomName, otherPeople) {
	    easyrtc.setRoomOccupantListener(null); // so we're only called once.

	    var list = [];
	    var connectCount = 0;
	    for(var easyrtcid in otherPeople ) {
	        list.push(easyrtcid);
	    }

	    function establishConnection(position) {
	        function callSuccess() {
	            connectCount++;
	            if( connectCount < maxCALLERS && position > 0) {
	                establishConnection(position-1);
	            }
	        }
	        function callFailure(errorCode, errorText) {
	            easyrtc.showError(errorCode, errorText);
	            if( connectCount < maxCALLERS && position > 0) {
	                establishConnection(position-1);
	            }
	        }
	        easyrtc.call(list[position], callSuccess, callFailure);

	    }
	    if( list.length > 0) {
	        establishConnection(list.length-1);
	    }
	}

	function loginSuccess() {
	}

	function _init() {
		console.log("You are logged in as a " + Auth.getCurrentUser().role)
		if (Auth.getCurrentUser().role === 'user') {
			$location.path('/')
			return alert('You are not an instructor. Please try again.')
		}

	    // var passwordEntered = prompt('Enter password to prove you are the trainer');
	    // if (passwordEntered !== 'delts') { return alert('That was the wrong password.  Refresh to try again.'); }

	    easyrtc.setRoomOccupantListener(callEverybodyElse);
	    easyrtc.setUsername('trainer');
	    easyrtc.easyApp(""+classToJoin.date+"", 'box0', ['box1', 'box2', 'box3', 'box4', 'box5', 'box6', 'box7', 'box8'], loginSuccess);
	    // easyrtc.setPeerListener(messageListener);
	    easyrtc.setDisconnectListener( function() {
	        easyrtc.showError('LOST-CONNECTION', 'Lost connection to signaling server');
	    });
	    easyrtc.setOnCall( function(easyrtcid, slot) {
	        console.log('getConnection count='  + easyrtc.getConnectionCount() );
	        console.log('easyrtcid: ' + easyrtcid);
	        console.log('slot: ' + slot);
	        document.getElementById(getIdOfBox(slot+1)).style.visibility = 'visible';
	    });


	    easyrtc.setOnHangup(function(easyrtcid, slot) {
	        setTimeout(function() {
	            document.getElementById(getIdOfBox(slot+1)).style.visibility = 'hidden';

	        },20);
	    });
		}
		_init();
	});