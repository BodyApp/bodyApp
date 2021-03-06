'use strict';

angular.module('bodyAppApp')
  .controller('ClassFeedbackCtrl', function ($scope, $state, $location, Schedule, Auth, User, DayOfWeekSetter, studioId) {
  	$scope.classCompleted = Schedule.classUserJustJoined;
    $scope.trainerInfo = Schedule.trainerOfStudioJustJoined;

  	if (!$scope.classCompleted) {
  		$state.go('schedule')
  		// $location.path('/')
  	}

  	var classDate = new Date($scope.classCompleted.dateTime);        
  	var classKey = ""+classDate.getFullYear()+""+((classDate.getMonth()+1 < 10)?"0"+(classDate.getMonth()+1):classDate.getMonth()+1)+""+((classDate.getDate() < 10)?"0"+classDate.getDate():classDate.getDate())
    // var sunDate = new Date(classDate.getFullYear(), classDate.getMonth(), classDate.getDate() - classDate.getDay(), 11, 0, 0);
    // var sunDate = new Date();
    // sunDate.setDate(classDate.getDate() - classDate.getDay());
    // var sunGetDate = sunDate.getDate();
    // var sunGetMonth = sunDate.getMonth()+1;
    // var sunGetYear = sunDate.getFullYear();
    // var weekOf = "weekof"+ sunGetYear + (sunGetMonth<10?"0"+sunGetMonth:sunGetMonth) + (sunGetDate<10?"0"+sunGetDate:sunGetDate);
    
    if (!studioId) studioId = 'ralabala'
    var ref = firebase.database().ref().child('studios').child(studioId);
    var auth = firebase.auth();
    auth.onAuthStateChanged(function(user) {
      if (user) {
      } else {
        if (currentUser.firebaseToken) {
          auth.signInWithCustomToken(currentUser.firebaseToken).then(function(user) {
            if (currentUser.role === "admin") console.log("Firebase user authentication succeeded!", user);
          }); 
        } else {
          console.log("User doesn't have a firebase token saved, should retrieve one.")
        }
      }
    })

    // var weekOfRef = ref.child("classes").child(weekOf)
    // var dayRef = weekOfRef.child(DayOfWeekSetter.setDay(classDate.getDay()))

    var currentUser = Auth.getCurrentUser()

    // var wodRef = new Firebase("https://bodyapp.firebaseio.com/WODs/" + classKey)
    // $scope.classWod;
    // wodRef.once('value', function(snapshot) {
    // 	$scope.classWod = snapshot.val();
    // 	if(!$scope.$$phase) $scope.$apply();
    // })

  	$scope.submitRatingAndResults = function(rating, feedback, score, comment, postToPublic, minutes, seconds) {
	  	if (!rating) rating = 5.0
  		// if (!score) score = ""
  		// if (!comment) comment = ""
  		if (!feedback) feedback = ""

  		// var priority;
  		// if ($scope.classWod.scoreType.id === 0) {
  		// 	score = seconds + minutes*60
  		// 	score = score * 1
  		// 	priority = score
  		// } else {
  		// 	score = score * 1
  		// 	priority = -score
  		// }

  		//Add result to user object
  		// User.saveResult({ id: Auth.getCurrentUser()._id }, {
    //     score: score,
    //     typeOfScore: $scope.classWod.classType, 
    //     comment: comment,
    //     feedback: feedback,
    //     wod: "WodData", //This needs to be changed once the day's wod data has been implemented
    //     dateTime: classDate.getTime(),
    //     // weekOf: weekOf,
    //     date: classKey
    //   }, function(data) {
    //     Auth.updateUser(data.user);
    //     ref.child("resultsByUser").child(currentUser._id).child(classKey).update({
    //       score: score*1,
    //       comment: comment,
    //       classDateTime: $scope.classCompleted.dateTime,
    //       classDayKey: classKey,
    //       timePosted: (new Date()).getTime()        
    //     }, function(err) {if (!err) console.log("results saved to user's profile")})
    //   }, function(err) {
    //     console.log(err)
    //   }).$promise.then(function() {
      	//Add rating to trainer object
      	User.addRating({ id: currentUser._id }, {
          trainer: $scope.classCompleted.instructor, 
          rating: rating
        }, function(data) {
          console.log("rating saved.  New trainer rating: " + data.trainerRating + " on " + data.trainerNumRatings + " ratings.")
          // $uibModalInstance.close();
          if (feedback.length > 2) {
            ref.child('feedback').push({
              userId: currentUser._id,
              userFirstName: currentUser.firstName,
              timePosted: (new Date()).getTime(),
              classTaken: classDate.getTime(),
              instructor: $scope.classCompleted.instructor,
              rating: rating,
              feedback: feedback
            }, function() {
              $location.path('/')
            })
          }
          // if (!currentUser.stripe && ($scope.classCompleted.level === "Test" || $scope.classCompleted.level === "Intro" || $scope.classCompleted.level === "Open")) {
            // openAddMembershipQuestionModal()
          // }
        }, function(err) {
            console.log(err)
        }).$promise;  
      // });

      //Post result to public list
  		// if (postToPublic) {
  		// 	var classList;
  		// 	var dayList = ref.child("resultsByDay").child(classKey).push({
  		// 		score: score*1,
  		// 		comment: comment,
  		// 		userId: currentUser._id,
  		// 		userFirstName: currentUser.firstName,
  		// 		userLastName: currentUser.lastName,
  		// 		userPicture: currentUser.picture,
  		// 		classDateTime: $scope.classCompleted.dateTime,
  		// 		timePosted: (new Date()).getTime()				
  		// 	}, function(error) {
  		// 		if (error) return console.log(error);
  		// 		console.log("Result successfully published to public list.")

  		// 		// if ($scope.classWod.scoreType.id === 0) {
  		// 		// 	dayList.setPriority(score);
  		// 		// } else {
  		// 		// 	dayList.setPriority(-score);
  		// 		// }

	  	// 		classList = ref.child("resultsByClass").child($scope.classCompleted.dateTime).push({
	  	// 			score: score,
	  	// 			comment: comment,
	  	// 			userId: currentUser._id,
	  	// 			userFirstName: currentUser.firstName,
	  	// 			userLastName: currentUser.lastName,
	  	// 			userPicture: currentUser.picture,
	  	// 			timePosted: (new Date()).getTime()				
	  	// 		}, function(error) {
	  	// 			if (error) return console.log(error);
	  	// 			if (feedback.length > 2) {
	  	// 				ref.child('feedback').push({
	  	// 					userId: currentUser._id,
	  	// 					userFirstName: currentUser.firstName,
	  	// 					timePosted: (new Date()).getTime(),
	  	// 					classTaken: classDate.getTime(),
	  	// 					instructor: $scope.classCompleted.instructor._id,
	  	// 					rating: rating,
	  	// 					feedback: feedback
	  	// 				})
	  	// 			}
	  	// 			console.log("Result successfully published to class list.")
	   // 			// 	if ($scope.classWod.scoreType.id === 0) {
	  	// 			// 	classList.setPriority(score);
	  	// 			// } else {
	  	// 			// 	classList.setPriority(-score);
	  	// 			// }
	  	// 		}).setPriority(priority)
  		// 	}).setPriority(priority)
  		// }
  	}
  });