'use strict';

angular.module('bodyAppApp')
  .controller('ConsumerVideoCtrl', function ($scope, Auth) {
  	$scope.$on('$locationChangeStart', function( event ) {
	    easyrtc.disconnect()
		});

  	var maxCALLERS = 10;
		// var numVideoOBJS = maxCALLERS+1;
		// var boxUsed = [false, false, false, false, false, false, false, false, false];
		var numConsumers = 1;
		var callerEasyrtcidsIdsList = {};
		// var layout;

		easyrtc.dontAddCloseButtons(true);

		var currentUser = Auth.getCurrentUser();

		var _init = function() {
	  	// console.log('got here')
	    // var usernameInput = prompt('Welcome to the Alpha version of Body App!  Please enter a username.  Make sure it's the same one you used before if you're logging back in.')
	    // usernameInput = usernameInput.replace(/\s+/g, ''); //Gets rid of white space

	    easyrtc.setRoomOccupantListener(callEverybodyElse);
	    easyrtc.initMediaSource(
	        function(){       // success callback
	            var selfVideo = document.getElementById('box1');
	            easyrtc.setVideoObjectSrc(selfVideo, easyrtc.getLocalStream());
	            easyrtc.setUsername(currentUser._id.toString());
	            console.log(currentUser._id.toString())
	            easyrtc.connect('easyrtc.multiparty', loginSuccess);
	            document.getElementById(getIdOfBox(1)).style.visibility = 'visible'; //This is the box for this user
	        }, function() { //Failure callback
	        	alert("Body App can't access your video camera.  Please make sure your browser is allowing Body App to access your camera and microphone by clicking permissions in the address bar above.")
	        }
	    );

	    // easyrtc.setPeerListener(messageListener);
	    easyrtc.setDisconnectListener( function() {
	        easyrtc.showError('LOST-CONNECTION', 'Lost connection to signaling server');
	    });
		};

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
	    //
	    // Connect in reverse order. Latter arriving people are more likely to have
	    // empty slots.
	    //
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
		    // expandThumb(0);  // expand the mirror image initially.
		}

		function messageListener(easyrtcid, msgType, content) {
		    for(var i = 0; i < maxCALLERS; i++) {
		        if( easyrtc.getIthCaller(i) === easyrtcid) {
		            var startArea = document.getElementById(getIdOfBox(i+1));
		            var startX = parseInt(startArea.offsetLeft) + parseInt(startArea.offsetWidth)/2;
		            var startY = parseInt(startArea.offsetTop) + parseInt(startArea.offsetHeight)/2;
		            showMessage(startX, startY, content);
		        }
		    }
		}

		easyrtc.setStreamAcceptor( function(callerEasyrtcid, stream) {
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

	.controller('TrainerVideoCtrl', function ($scope) {
	  var maxCALLERS = 10;
		// var numVideoOBJS = maxCALLERS+1;
		// var layout;

		easyrtc.dontAddCloseButtons(true);

		$scope.$on('$locationChangeStart', function( event ) {
	    easyrtc.disconnect()
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
	    //
	    // Connect in reverse order. Latter arriving people are more likely to have
	    // empty slots.
	    //
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
	    // var username = 'trainer'
	    // easyrtc.emit('setUsername', username);
	    // expandThumb(0);  // expand the mirror image initially.
	}

	function messageListener(easyrtcid, msgType, content) {
	    for(var i = 0; i < maxCALLERS; i++) {
	        if( easyrtc.getIthCaller(i) === easyrtcid) {
	            var startArea = document.getElementById(getIdOfBox(i+1));
	            var startX = parseInt(startArea.offsetLeft) + parseInt(startArea.offsetWidth)/2;
	            var startY = parseInt(startArea.offsetTop) + parseInt(startArea.offsetHeight)/2;
	            showMessage(startX, startY, content);
	        }
	    }
	}

	function _init() {

	    var passwordEntered = prompt('Enter password to prove you are the trainer');
	    if (passwordEntered !== 'delts') { return alert('That was the wrong password.  Refresh to try again.'); }

	    // Prep for the top-down layout manager
	    // setReshaper('fullpage', reshapeFull);
	    // for(var i = 0; i < numVideoOBJS; i++) {
	        // prepVideoBox(i);
	    // }
	    // setReshaper('killButton', killButtonReshaper);
	    // setReshaper('muteButton', muteButtonReshaper);
	    // setReshaper('textentryBox', reshapeTextEntryBox);
	    // setReshaper('textentryField', reshapeTextEntryField);
	    // setReshaper('textEntryButton', reshapeTextEntryButton);

	    // updateMuteImage(false);
	    // window.onresize = handleWindowResize;
	    // handleWindowResize(); //initial call of the top-down layout manager

	    easyrtc.setRoomOccupantListener(callEverybodyElse);
	    easyrtc.setUsername('trainer');
	    easyrtc.easyApp('easyrtc.multiparty', 'box0', ['box1', 'box2', 'box3', 'box4', 'box5', 'box6', 'box7', 'box8'], loginSuccess);
	    easyrtc.setPeerListener(messageListener);
	    easyrtc.setDisconnectListener( function() {
	        easyrtc.showError('LOST-CONNECTION', 'Lost connection to signaling server');
	    });
	    easyrtc.setOnCall( function(easyrtcid, slot) {
	        console.log('getConnection count='  + easyrtc.getConnectionCount() );
	        console.log('easyrtcid: ' + easyrtcid);
	        console.log('slot: ' + slot);

	        // boxUsed[slot+1] = true;
	        // if(activeBox == 0 ) { // first connection
	            // collapseToThumb();
	            // document.getElementById('textEntryButton').style.display = 'block';
	        // }
	        document.getElementById(getIdOfBox(slot+1)).style.visibility = 'visible';
	        // handleWindowResize();
	    });


	    easyrtc.setOnHangup(function(easyrtcid, slot) {
	        // boxUsed[slot+1] = false;
	        // if(activeBox > 0 && slot+1 == activeBox) {
	            // collapseToThumb();
	        // }
	        setTimeout(function() {
	            document.getElementById(getIdOfBox(slot+1)).style.visibility = 'hidden';

	            if( easyrtc.getConnectionCount() === 0 ) { // no more connections
	                // expandThumb(0);
	                document.getElementById('textEntryButton').style.display = 'none';
	                // document.getElementById('textentryBox').style.display = 'none';
	            }
	            // handleWindowResize();
	        },20);
	    });
		}
		_init();
	});