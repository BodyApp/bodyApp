'use strict';

angular.module('bodyAppApp')
  .controller('NewUserCtrl', function ($scope, $http, $state, User, Auth, $firebaseArray, $firebaseObject) {
    $scope.newUserStep = 1;
    $scope.errorDiv = false
    $scope.currentUser = Auth.getCurrentUser();
    $scope.upcomingIntros;
    $scope.bookedIntroClass;
    var injuries = "";
    $scope.timezone;
    setTimezone();
    function setTimezone() {
      var tzName = jstz().timezone_name;
      $scope.timezone = moment().tz(tzName).format('z');
    }

    var ref = new Firebase("https://bodyapp.firebaseio.com")
    $scope.upcomingIntros = $firebaseArray(ref.child('upcomingIntros').orderByKey().limitToFirst(12))
    // var query = $scope.allIntros.orderByKey().limitToFirst(10);
    // $scope.upcomingIntros = $firebaseArray(ref.child('upcomingIntros'))

	$scope.bookIntroClass = function(classBooked) {
		$scope.newUserStep++;
		$scope.bookedIntroClass = classBooked

        var classDate = new Date(classBooked.$id*1)
        console.log(classDate.getDay())
        console.log(classDate.getTime())

        var todayDate = new Date(classDate);        
        var sunDate = new Date();
        sunDate.setDate(todayDate.getDate() - todayDate.getDay());
        var sunGetDate = sunDate.getDate();
        var sunGetMonth = sunDate.getMonth()+1;
        var sunGetYear = sunDate.getFullYear();
        var weekOf = "weekof"+ (sunGetMonth<10?"0"+sunGetMonth:sunGetMonth) + (sunGetDate<10?"0"+sunGetDate:sunGetDate) + sunGetYear;
        var weekOfRef = new Firebase("https://bodyapp.firebaseio.com/" + weekOf)

		var classToBook = $firebaseObject(
	      weekOfRef.child(classDate.getDay())
	      .child("slots")
	      .child(classDate.getTime())
    	)

    	console.log(classToBook)

        // var date = new Date(classBooked.$id*1)
        // $scope.calendarDateSetter = date.getFullYear()+""+((date.getMonth()+1 < 10)?"0"+(date.getMonth()+1):(date.getMonth()+1))+""+((date.getDate() < 10)?"0"+date.getDate():date.getDate())+"T"+((date.getHours() < 10)?"0"+date.getHours():date.getHours())+""+((date.getMinutes() < 10)?"0"+date.getMinutes():date.getMinutes())+"00"
        // $scope.calendarDateSetterEnd = date.getFullYear()+""+((date.getMonth()+1 < 10)?"0"+(date.getMonth()+1):(date.getMonth()+1))+""+((date.getDate() < 10)?"0"+date.getDate():date.getDate())+"T"+((date.getHours() < 10)?"0"+(date.getHours()+1):(date.getHours()+1))+""+((date.getMinutes() < 10)?"0"+date.getMinutes():date.getMinutes())+"00"
        // $scope.timeZone = jstz().timezone_name;

    	classToBook.$loaded(function() {
    		classToBook.bookedUsers = classToBook.bookedUsers || {};
			classToBook.bookedUsers[$scope.currentUser._id] = {firstName: $scope.currentUser.firstName, lastName: $scope.currentUser.lastName, timeBooked: new Date().getTime(), injuries: injuries, picture: $scope.currentUser.picture, facebookId: $scope.currentUser.facebookId};
            // classToBook.bookedFbUserIds = classToBook.bookedFbUserIds || {};    
            // classToBook.bookedFbUserIds[$scope.currentUser.facebook.id] = true
			classToBook.$save()
            $scope.classDetails = classToBook;
    	})
		
		User.addIntroClass({ id: $scope.currentUser._id }, {
            classToAdd: classDate.getTime()
        }, function(user) {
            Auth.updateUser(user)
        }, function(err) {
            console.log("Error adding class: " + err)
            classToBook.bookedUsers = classToBook.bookedUsers || {};
            delete classToBook.bookedUsers[$scope.currentUser._id]
            // classToBook.bookedFbUserIds = classToBook.bookedFbUserIds || {};    
            // delete classToBook.bookedFbUserIds[$scope.currentUser.facebook.id]

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
    	injuries = injuryString || ""
    	if (injuries.length < 2) {
    		$scope.errorDiv = true
    		console.log("Didn't enter any information!")
    	} else {
    		User.saveInjuries({id: $scope.currentUser}, {injuryString: injuries}).$promise.then(function(user) {
				  console.log("Successfully saved injury info.");
				  Auth.getUpdatedUser();
			  })
			  $scope.newUserStep++;	
    	}
    }

    $scope.getDate = function(classSent) {
    	if (classSent) {
	     	var dateToReturn = new Date(classSent.$id*1)
		    return getDayOfWeek(dateToReturn.getDay()) + ", " + getMonth(dateToReturn.getMonth()) + " " + dateToReturn.getDate()
		  }
    }

    $scope.getTime = function(classSent) {
    	if (classSent) {
	    	var dateToReturn = new Date(classSent.$id*1);
	    	var minutes = dateToReturn.getMinutes() < 10 ? "0" + dateToReturn.getMinutes() : dateToReturn.getMinutes();
            if (dateToReturn.getHours() === 12) return "12:" + minutes + "pm";
		    return (dateToReturn.getHours() < 12) ? dateToReturn.getHours() + ":" + minutes + "am" : (dateToReturn.getHours() - 12) + ":" + minutes + "pm"; 
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

    $scope.calendarDateSetter = function(slot) {
        console.log(slot)
        var localDate = new Date(slot.$id*1);
        var date = new Date(localDate.getTime() - jstz().utc_offset*60*1000);
        var dateToSet = date.getFullYear()+""+((date.getMonth()+1 < 10)?"0"+(date.getMonth()+1):(date.getMonth()+1))+""+((date.getDate() < 10)?"0"+date.getDate():date.getDate())+"T"+((date.getHours() < 10)?"0"+date.getHours():date.getHours())+""+((date.getMinutes() < 10)?"0"+date.getMinutes():date.getMinutes())+"00"
         console.log(dateToSet);
         return dateToSet
      } 
      $scope.calendarDateSetterEnd = function(slot) {
        var localDate = new Date(slot.$id*1);
        var date = new Date(localDate.getTime() - jstz().utc_offset*60*1000);
        return date.getFullYear()+""+((date.getMonth()+1 < 10)?"0"+(date.getMonth()+1):(date.getMonth()+1))+""+((date.getDate() < 10)?"0"+date.getDate():date.getDate())+"T"+((date.getHours() < 10)?"0"+(date.getHours()+1):(date.getHours()+1))+""+((date.getMinutes() < 10)?"0"+date.getMinutes():date.getMinutes())+"00"
      } 
  });
