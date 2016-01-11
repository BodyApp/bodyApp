'use strict';

angular.module('bodyAppApp')
  .controller('ClassFeedbackCtrl', function ($scope, $location, Schedule, Auth, User) {
  	$scope.classCompleted = Schedule.classUserJustJoined;
  	console.log($scope.classCompleted)

  	if (!$scope.classCompleted) {
  		$location.path('/')
  	}

  	var classDate = new Date($scope.classCompleted.date);        
    var sunDate = new Date();
    sunDate.setDate(classDate.getDate() - classDate.getDay());
    var sunGetDate = sunDate.getDate();
    var sunGetMonth = sunDate.getMonth()+1;
    var sunGetYear = sunDate.getFullYear();
    var weekOf = "weekof"+ (sunGetMonth<10?"0"+sunGetMonth:sunGetMonth) + (sunGetDate<10?"0"+sunGetDate:sunGetDate) + sunGetYear;
    var weekOfRef = new Firebase("https://bodyapp.firebaseio.com/" + weekOf)
    var dayRef = weekOfRef.child(classDate.getDay())

    var currentUser = Auth.getCurrentUser()

  	$scope.submitRatingAndResults = function(rating, score, comment, postToPublic) {
  		
	  	if (!rating) rating = 5.0
  		if (!score) score = ""
  		if (!comment) comment = ""

  		score = score * 1

  		//Add result to user object
  		User.saveResult({ id: Auth.getCurrentUser()._id }, {
        score: score, 
        comment: comment,
        wod: "WodData", //This needs to be changed once the day's wod data has been implemented
        dateTime: classDate.getTime(),
        weekOf: weekOf,
        date: ""+classDate.getFullYear()+""+((classDate.getMonth()+1 < 10)?"0"+(classDate.getMonth()+1):classDate.getMonth()+1)+""+((classDate.getDate() < 10)?"0"+classDate.getDate():classDate.getDate())
      }, function(data) {
        console.log(data.user);
        Auth.updateUser(data.user);
      }, function(err) {
          console.log(err)
      }).$promise.then(function() {
      	//Add rating to trainer object
      	User.addRating({ id: currentUser._id }, {
	        trainer: $scope.classCompleted.trainer._id, 
	        rating: rating
	      }, function(data) {
	        console.log("rating saved.  New trainer rating: " + data.trainerRating + " on " + data.trainerNumRatings + " ratings.")
	        $location.path('/results')
	      }, function(err) {
	          console.log(err)
	      }).$promise;	
      });

      //Post result to public list
  		if (postToPublic) {
  			var dayList;
  			var classList;
  			dayList = dayRef.child("resultList").push({
  				score: score*1,
  				comment: comment,
  				userId: currentUser._id,
  				userFirstName: currentUser.firstName,
  				userLastName: currentUser.lastName,
  				userPicture: currentUser.picture,
  				timePosted: (new Date()).getTime()				
  			}, function(error) {
  				if (error) return console.log(error);
  				console.log("Result successfully published to public list.")

  				dayList.setPriority(-score);

	  			classList = dayRef.child('slots').child($scope.classCompleted.date).child("classResultsList").push({
	  				score: score,
	  				comment: comment,
	  				userId: currentUser._id,
	  				userFirstName: currentUser.firstName,
	  				userLastName: currentUser.lastName,
	  				userPicture: currentUser.picture,
	  				timePosted: (new Date()).getTime()				
	  			}, function(error) {
	  				if (error) return console.log(error);
	  				console.log("Result successfully published to class list.")
	  				classList.setPriority(-score);
	  			})
  			})
  		}
  	}
  });