'use strict';

angular.module('bodyAppApp')
  .controller('ConsumerVideoCtrl', function ($scope, $location, Auth, Schedule) {

  	var classToJoin = Schedule.classUserJustJoined;
  	if (!classToJoin) {
			$location.path('/')
		}

  	var maxCALLERS = 10;
		var numConsumers = 1;
		var callerEasyrtcidsIdsList = {};

		easyrtc.dontAddCloseButtons(true);

		var currentUser = Auth.getCurrentUser();
		$scope.currentUser = currentUser;

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
		        easyrtc.muteVideoObject(mainVideo, true);
		    } else {
		        if (callerEasyrtcidsIdsList[callerUsername]) {
		            console.log('caller already has box');
		            // document.getElementById(callerUsername).style.visibility = 'visible';
		            var video = document.getElementById(getIdOfBox(callerEasyrtcidsIdsList[callerUsername]));
		            easyrtc.setVideoObjectSrc(video, stream);
		            easyrtc.muteVideoObject(video, true);
		        } else {
		            console.log('caller is new with easyrtcid of ' + callerUsername);
		            numConsumers++;
		            document.getElementById(getIdOfBox(numConsumers)).style.visibility = 'visible';
		            var videoNew = document.getElementById(getIdOfBox(numConsumers));
		            easyrtc.setVideoObjectSrc(videoNew, stream);
		            callerEasyrtcidsIdsList[callerUsername] = numConsumers;
		            easyrtc.muteVideoObject(videoNew, true);
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
	        // var video = document.getElementById(getIdOfBox(callerEasyrtcidsIdsList[callerUsername]));
	    }
		});

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