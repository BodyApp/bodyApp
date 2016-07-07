angular.module('bodyAppApp')
.controller('RecordVideoCtrl', function ($scope, $location, $http, $mdDialog, Video, User, Auth, studioId) {
	$scope.studioId = studioId
	var ziggeoEmbedding;
	getVideoLibrary()

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

  $scope.playVideo = function(videoToPlay) {
    ZiggeoApi.Embed.popup({
      video: videoToPlay.token,
      autoplay: true,
      popup_width: window.innerWidth*.7,
      popup_height: window.innerHeight*.7
    });
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