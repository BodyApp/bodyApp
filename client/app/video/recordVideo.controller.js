angular.module('bodyAppApp')
.controller('RecordVideoCtrl', function ($scope, $location, Video, User, Auth, studioId) {
	$scope.studioId = studioId
	var embedding = ZiggeoApi.Embed.embed("#ziggeoVideo", {
		tags: [studioId], 
		disable_first_screen: true,
		height: window.innerHeight*.8,
		width: window.innerWidth*.8
		// responsive: true
		// video: "d7d249cb2d74359a9eaaed113f738a4b"
	});
})