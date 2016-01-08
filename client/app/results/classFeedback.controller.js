'use strict';

angular.module('bodyAppApp')
  .controller('ClassFeedbackCtrl', function ($scope, Schedule, Auth, User) {
  	$scope.classCompleted = Schedule.classUserJustJoined;
  	console.log($scope.classCompleted)

  	$scope.submitRatingAndResults = function(rating, score, comment, postToPublic) {
  		
  		console.log("score: " + score)
  		console.log("comment: " + comment)
  		console.log("post to public?: " + postToPublic)

	  	// 	if (!rating) rating = 5.0
			// console.log("rating: " + rating)

			// User.addRating({id: Auth.getCurrentUser()._id}, {trainer: $scope.classCompleted.trainer._id, rating: rating}, function(data) {
			// 	console.log("rating saved.  New trainer rating: " + data.rating + " on " + data.numRatings + " ratings.")
			// })

			User.addRating({ id: Auth.getCurrentUser()._id }, {
        trainer: $scope.classCompleted.trainer._id, 
        rating: rating
      }, function(data) {
        console.log("rating saved.  New trainer rating: " + data.trainerRating + " on " + data.trainerNumRatings + " ratings.")
      }, function(err) {
          console.log(err)
      }).$promise;

  		if (postToPublic) {

  		}
  	}
  });