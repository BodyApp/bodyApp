'use strict';

angular.module('bodyAppApp')
  .controller('NewUserCtrl', function ($scope, $http, $state, User, Auth, $firebaseArray, $firebaseObject) {
    $scope.newUserStep = 1;
    $scope.errorDiv = false
    $scope.currentUser = Auth.getCurrentUser();
    $scope.upcomingIntros;
    $scope.bookedIntroClass;

    var ref = new Firebase("https://bodyapp.firebaseio.com")
    $scope.upcomingIntros = $firebaseArray(ref.child('upcomingIntros'))

		var todayDate = new Date();        
    var sunDate = new Date();
    sunDate.setDate(todayDate.getDate() - todayDate.getDay());
    var sunGetDate = sunDate.getDate();
    var sunGetMonth = sunDate.getMonth()+1;
    var sunGetYear = sunDate.getFullYear();
    var weekOf = "weekof"+ (sunGetMonth<10?"0"+sunGetMonth:sunGetMonth) + (sunGetDate<10?"0"+sunGetDate:sunGetDate) + sunGetYear;
    var weekOfRef = new Firebase("https://bodyapp.firebaseio.com/" + weekOf)

		$scope.bookIntroClass = function(classBooked) {
			$scope.newUserStep++;
			$scope.bookedIntroClass = classBooked

			console.log(classBooked);

			var classDate = new Date(classBooked.$value)
			console.log(classDate.getDay())
			console.log(classDate.getTime())

			var classToBook = $firebaseObject(
	      weekOfRef.child(classDate.getDay())
	      .child("slots")
	      .child(classDate.getTime())
    	)

    	console.log(classToBook)

    	classToBook.$loaded(function() {
    		classToBook.bookedUsers = classToBook.bookedUsers || {}
				classToBook.bookedUsers[$scope.currentUser._id] = true;
				classToBook.$save()	
    	})
			
			User.addIntroClass({ id: $scope.currentUser._id }, {
        classToAdd: classDate
      }, function(user) {
        Auth.getUpdatedUser();
      }, function(err) {
          console.log("Error adding class: " + err)
          classToBook.bookedUsers[currentUser._id] = false
          classToBook.$save()
          alert("sorry, there was an issue booking your class.  Please try reloading the site and booking again.  If that doesn't work, contact the BODY help team at (216) 408-2902 to get this squared away.")    
      }).$promise;
		}

    $scope.incrementStep = function() {
    	$scope.newUserStep++;
    }

    $scope.goToDashboard = function() {
    	$state.go('schedule');
    }

    $scope.saveInjuries = function(injuryString) {
    	injuryString = injuryString || ""
    	if (injuryString.length < 2) {
    		$scope.errorDiv = true
    		console.log("Didn't enter any information!")
    	} else {
    		User.saveInjuries({id: $scope.currentUser}, {injuryString: injuryString}).$promise.then(function(user) {
				  console.log("Successfully saved injury info.");
				  Auth.getUpdatedUser();
			  })
			  $scope.newUserStep++;	
    	}
    }

    $scope.getDate = function(classSent) {
    	if (classSent) {
	     	var dateToReturn = new Date(classSent.$value)
		    return getDayOfWeek(dateToReturn.getDay()) + ", " + getMonth(dateToReturn.getMonth()) + " " + dateToReturn.getDate()
		  }
    }

    $scope.getTime = function(classSent) {
    	if (classSent) {
	    	var dateToReturn = new Date(classSent.$value)
		    return (dateToReturn.getHours() < 12) ? dateToReturn.getHours() + "am" : dateToReturn.getHours() - 12 + "pm" 
		  }
    }

    function getDayOfWeek(day) {
      switch (day) {
        case 0: return "Sunday"; break;
        case 1: return "Monday"; break;
        case 2: return "Tuesday"; break;
        case 3: return "Wednesday"; break;
        case 4: return "Thursday"; break;
        case 5: return "Friday"; break;
        case 6: return "Saturday"; break;
        default: break;
      }
    }

    function getMonth(day) {
      switch (day) {
        case 0: return "Jan"; break;
        case 1: return "Feb"; break;
        case 2: return "Mar"; break;
        case 3: return "Apr"; break;
        case 4: return "May"; break;
        case 5: return "Jun"; break;
        case 6: return "Jul"; break;
        case 7: return "Aug"; break;
        case 8: return "Sep"; break;
        case 9: return "Oct"; break;
        case 10: return "Nov"; break;
        case 11: return "Dec"; break;
        default: break;
      }
    }
  });
