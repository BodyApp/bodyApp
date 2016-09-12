angular.module('bodyAppApp')
.controller('RecordVideoCtrl', function ($scope, $location, $http, $mdDialog, $state, $sce, Video, User, Auth, studioId, Studios) {
	$scope.studioId = studioId
	var ziggeoEmbedding;
	var ref = firebase.database().ref().child('studios').child(studioId);
	var currentUser = Auth.getCurrentUser()

  filepicker.setKey("Awj7gCJS4eeAD1UG5fOFgz")

	Studios.setCurrentStudio(studioId)
  .then(function(){
    console.log("Succeeded")
    delayedStartup()
  }, function(){
    console.log("Failed")
    // if (!currentUser.role === 'admin') return $state.go('storefront', { "studioId": studioId });  
    if (currentUser.$promise) {
      currentUser.$promise.then(function(data) {
        if (data.role != 'admin') return $state.go('storefront', { "studioId": studioId });
        if (data.role === 'admin') return delayedStartup()
      })
    } else if (currentUser.role) {
      if (currentUser.role != 'admin') return $state.go('storefront', { "studioId": studioId });
      if (currentUser.role === 'admin') return delayedStartup()
    }
  })

	function delayedStartup() {
		Intercom('trackEvent', 'navigatedToRecordVideo', { studio: studioId });
    analytics.track('navigatedToRecordVideo', { studio: studioId });
    $scope.loaded = true;
		getVideoLibrary();	
		getVideoStatus();
	}	

  $scope.pickFile = function() {
    var fileTooBigWarning = false;
    filepicker.pickAndStore(
      {
        mimetype: 'video/*',
        services: ['COMPUTER', 'VIDEO', 'GOOGLE_DRIVE']
      },
      {
        location:"S3",
        path: studioId + "/",
        access: 'public'
      },
      function(Blob){
        var savedVideo = Blob[0];
        console.log(savedVideo);
        Intercom('trackEvent', 'recordedVideo', { studioId: studioId, key: savedVideo.key, filestackUrl: savedVideo.url });
        analytics.track('recordedVideo', { studioId: studioId, key: savedVideo.key, filestackUrl: savedVideo.url });
        firebase.database().ref().child('videoLibraries').child(studioId).child('videos').push({dateSaved: new Date().getTime(), s3Key: savedVideo.key, filestackUrl: savedVideo.url, 'subscribersOnly':false}, function(err) {
          if (err) return console.log(err)
          console.log("Added video to library.")
        })
        // console.log(replaceHtmlChars(JSON.stringify(Blob)));
      },
      function(error){
        console.log(error);
      },
      function(status){
        if (status.size > 50*1024*1024 && !fileTooBigWarning) {
          var fileSizeToDisplay = status.size/(1024*1024) < 1000 ? Math.round(status.size/(1024*1024)) + "MB" : (status.size/(1024*1024 * 1000)).toFixed(1) + "GB"
          alert(status.filename + " is " + fileSizeToDisplay + " and could take up to an hour to upload.") 
          fileTooBigWarning = true;
        }
        console.log(status.filename + " is " + status.progress + " complete.")
      }
    )
  }

	// $scope.recordVideo = function(){
	// 	ziggeoEmbedding = ZiggeoApi.Embed.popup({
	// 		tags: [studioId], 
 //      perms: ['allowupload', 'forbidrecord'],
	// 		// disable_first_screen: true,
	// 		popup_height: window.innerHeight*.8,
	// 		popup_width: window.innerWidth*.8,
	// 		hide_rerecord_on_snapshots: true,

	// 		// responsive: true
	// 		// video: "d7d249cb2d74359a9eaaed113f738a4b"
	// 	});
	// }

	// ZiggeoApi.Events.on("submitted", function (data) {
	// 	getVideoLibrary()
 //    Intercom('trackEvent', 'recordedVideo', { studioId: studioId, token: data.video.token });
 //    analytics.track('recordedVideo', { studioId: studioId, token: data.video.token });
	// 	ref.child('videoLibrary').child('videos').child(data.video.token).update({'subscribersOnly':false}, function(err) {
	// 		if (err) return console.log(err)
	// 		console.log("Added video to library.")
	// 	})
	// });

	function getVideoLibrary() {
    firebase.database().ref().child('videoLibraries').child(studioId).child('videos').on('value', function(snapshot) {
      $scope.videoLibrary = snapshot.val();
      if(!$scope.$$phase) $scope.$apply();
      console.log($scope.videoLibrary)
    })

    // $http.post('/api/videolibrary/getstudiovideos', {
    //   studioId: studioId,
    // })
    // .success(function(data) {
    //   console.log("Successfully retrieved videos.");
    //   console.log(data)
    //   $scope.videoLibrary = data;
    //   if(!$scope.$$phase) $scope.$apply();
    // })
    // .error(function(err) {
    //   console.log(err)
    //   console.log("Error retrieving videos")
    // }.bind(this));
  }

  $scope.getVideoUrl = function(s3Url) {
    return $sce.trustAsResourceUrl('https://s3.amazonaws.com/videolibraries/'+s3Url)
  }

  function getVideoStatus() {
  	ref.child('videoLibrary').child('videos').once('value', function(snapshot) {
  		$scope.subscribersOnly = snapshot.val()
      if(!$scope.$$phase) $scope.$apply();
  	})
  }

  $scope.playVideo = function(videoToPlay) {
    ZiggeoApi.Embed.popup({
      video: videoToPlay.token,
      autoplay: true,
      popup_width: window.innerWidth*.7,
      popup_height: window.innerHeight*.7
    });
  }

  $scope.publicPrivateChanged = function(videoToken, publicVsPrivate) {
  	ref.child('videoLibrary').child('videos').child(videoToken).update(publicVsPrivate, function(err) {
  		if (err) return console.log(err)
  		console.log("Updated video settings.");
  	})
  }

  $scope.formatDuration = function(duration) {
  	// return duration.toString().toHHMMSS();
  }

  String.prototype.toHHMMSS = function () {
    var sec_num = parseInt(this, 10); // don't forget the second param
    var hours   = 0;
    // var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    // if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return minutes+':'+seconds;
	}

  $scope.deleteVideo = function(videoToDelete, ev) {
  	var confirm = $mdDialog.confirm({
      title: "Delete Video",
      textContent: "Are you sure you want to delete this video?",
      targetEvent: ev,
      clickOutsideToClose: true,
      ok: 'Yes',
      cancel: 'No'
    });

    return $mdDialog
    .show( confirm ).then(function() {
    	$http.post('/api/videolibrary/'+currentUser._id+'/deletestudiovideo', {
	      studioId: studioId,
	      videoToken: videoToDelete.token
	    })
	    .success(function(data) {
	    	ref.child('videoLibrary').child('videos').child(videoToDelete.token).remove()
	      console.log("Successfully deleted video.");
        Intercom('trackEvent', 'deletedVideo', { studioId: studioId, token: videoToDelete.token });
        analytics.track('deletedVideo', { studioId: studioId, token: videoToDelete.token });
	      delete $scope.videoLibrary[videoToDelete.token]
	      if(!$scope.$$phase) $scope.$apply();
	      return getVideoLibrary()
	    })
	    .error(function(err) {
	      console.log(err)
	      console.log("Error deleting video")
	    }.bind(this));	
    })
  	

  	// ZiggeoApi.Videos.destroy(videoToDelete.token, function(data) {
  	// 	console.log("Video deleted");
  	// 	return getVideoLibrary();
  	// }, function(err) {
  	// 	console.log(err)
  	// 	console.log("Error deleting video")
  	// })
  }

})