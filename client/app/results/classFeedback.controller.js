'use strict';

angular.module('bodyAppApp')
  .controller('ClassFeedbackCtrl', function ($scope, $state, $location, Schedule, Auth, User) {
  	$scope.classCompleted = Schedule.classUserJustJoined;
  	console.log($scope.classCompleted)

  	if (!$scope.classCompleted) {
  		$state.go('schedule')
  		// $location.path('/')
  	}

  	var classDate = new Date($scope.classCompleted.date);        
  	var classKey = ""+classDate.getFullYear()+""+((classDate.getMonth()+1 < 10)?"0"+(classDate.getMonth()+1):classDate.getMonth()+1)+""+((classDate.getDate() < 10)?"0"+classDate.getDate():classDate.getDate())
    var sunDate = new Date();
    sunDate.setDate(classDate.getDate() - classDate.getDay());
    var sunGetDate = sunDate.getDate();
    var sunGetMonth = sunDate.getMonth()+1;
    var sunGetYear = sunDate.getFullYear();
    var weekOf = "weekof"+ (sunGetMonth<10?"0"+sunGetMonth:sunGetMonth) + (sunGetDate<10?"0"+sunGetDate:sunGetDate) + sunGetYear;
    var ref = new Firebase("https://bodyapp.firebaseio.com/")
    var weekOfRef = ref.child(weekOf)
    var dayRef = weekOfRef.child(classDate.getDay())

    var currentUser = Auth.getCurrentUser()

    var wodRef = new Firebase("https://bodyapp.firebaseio.com/WODs/" + classKey)
    $scope.classWod;
    wodRef.once('value', function(snapshot) {
    	$scope.classWod = snapshot.val();
    	if(!$scope.$$phase) $scope.$apply();
    })

  	$scope.submitRatingAndResults = function(rating, score, comment, feedback, postToPublic, minutes, seconds) {
  		console.log(score);
  		console.log(minutes);
	  	if (!rating) rating = 5.0
  		if (!score) score = ""
  		if (!comment) comment = ""
  		if (!feedback) feedback = ""

  		var priority;
  		if ($scope.classWod.scoreType.id === 0) {
  			score = seconds + minutes*60
  			score = score * 1
  			priority = score
  		} else {
  			score = score * 1
  			priority = -score
  		}

  		//Add result to user object
  		User.saveResult({ id: Auth.getCurrentUser()._id }, {
        score: score,
        typeOfScore: $scope.classWod.classType, 
        comment: comment,
        feedback: feedback,
        wod: "WodData", //This needs to be changed once the day's wod data has been implemented
        dateTime: classDate.getTime(),
        weekOf: weekOf,
        date: classKey
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
  				classDateTime: $scope.classCompleted.date,
  				timePosted: (new Date()).getTime()				
  			}, function(error) {
  				if (error) return console.log(error);
  				console.log("Result successfully published to public list.")

  				// if ($scope.classWod.scoreType.id === 0) {
  				// 	dayList.setPriority(score);
  				// } else {
  				// 	dayList.setPriority(-score);
  				// }

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
	  				if (feedback.length > 2) {
	  					ref.child('feedback').push({
	  						userId: currentUser._id,
	  						userFirstName: currentUser.firstName,
	  						timePosted: (new Date()).getTime(),
	  						classTaken: classDate.getTime(),
	  						instructor: $scope.classCompleted.trainer._id,
	  						rating: rating,
	  						feedback: feedback
	  					})
	  				}
	  				console.log("Result successfully published to class list.")
	   			// 	if ($scope.classWod.scoreType.id === 0) {
	  				// 	classList.setPriority(score);
	  				// } else {
	  				// 	classList.setPriority(-score);
	  				// }
	  			}).setPriority(priority)
  			}).setPriority(priority)
  		}
  	}
  });