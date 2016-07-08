angular.module('bodyAppApp')
.controller('RecordVideoCtrl', function ($scope, $location, $http, $mdDialog, Video, User, Auth, studioId) {
	$scope.studioId = studioId
	var ziggeoEmbedding;
	getVideoLibrary()

	var ref = firebase.database().ref().child('studios').child(studioId);
	getVideoStatus()

	$scope.recordVideo = function(){
		ziggeoEmbedding = ZiggeoApi.Embed.popup({
			tags: [studioId], 
			disable_first_screen: true,
			popup_height: window.innerHeight*.8,
			popup_width: window.innerWidth*.8,
			hide_rerecord_on_snapshots: true,

			// responsive: true
			// video: "d7d249cb2d74359a9eaaed113f738a4b"
		});
	}

	ZiggeoApi.Events.on("submitted", function (data) {
		getVideoLibrary()
		ref.child('videoLibrary').child('videos').child(data.video.token).update({'subscribersOnly':false}, function(err) {
			if (err) return console.log(err)
			console.log("Added video to library.")
		})
	});

	function getVideoLibrary() {
    $http.post('/api/videolibrary/getstudiovideos', {
      studioId: studioId,
    })
    .success(function(data) {
      console.log("Successfully retrieved videos.");
      console.log(data)
      $scope.videoLibrary = data;
      if(!$scope.$$phase) $scope.$apply();
    })
    .error(function(err) {
      console.log(err)
      console.log("Error retrieving videos")
    }.bind(this));
  }

  function getVideoStatus() {
  	ref.child('videoLibrary').child('videos').once('value', function(snapshot) {
  		$scope.subscribersOnly = snapshot.val()
  		console.log($scope.subscribersOnly)
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
  	return duration.toString().toHHMMSS();
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
    	$http.post('/api/videolibrary/deletestudiovideo', {
	      studioId: studioId,
	      videoToken: videoToDelete.token
	    })
	    .success(function(data) {
	    	ref.child('videoLibrary').child('videos').child(videoToDelete.token).remove()
	      console.log("Successfully deleted video.");
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