'use strict';

angular.module('bodyAppApp')
  .controller('ClassFeedbackCtrl', function ($scope, Schedule) {
  	$scope.classCompleted = Schedule.classUserJustJoined;
  	console.log($scope.classCompleted)

  	$scope.submitRatingAndResults = function(rating, score, comment, postToPublic) {
  		
  		console.log("score: " + score)
  		console.log("comment: " + comment)
  		console.log("post to public?: " + postToPublic)

	  	// 	if (!rating) rating = 5.0
			// console.log("rating: " + rating)

			User.addRating{}

  		if (postToPublic) {

  		}
  	}
  });