'use strict';

angular.module('bodyAppApp')
  .controller('NewUserCtrl', function ($scope, $http, $state, User, Auth, DayOfWeekSetter, $firebaseArray, $uibModal, $firebaseObject) {
    $scope.newUserStep = 1;
    $scope.errorDiv = false
    $scope.currentUser = Auth.getCurrentUser();
    var currentUser;
    $scope.upcomingIntros;
    $scope.bookedIntroClass;
    var injuries = "";
    var goals = "";
    var emergencyContact = {};
    $scope.timezone;
    var tzName = jstz().timezone_name;

    setTimezone();
    function setTimezone() {
      $scope.timezone = moment().tz(tzName).format('z');
    }

    Auth.getCurrentUser().$promise.then(function(user) {
        currentUser = user
        //Firebase authentication check
          var ref = new Firebase("https://bodyapp.firebaseio.com/");
          ref.onAuth(function(authData) {
            if (authData) {
              console.log("User is authenticated with fb ");
            } else {
              console.log("User is logged out");
              ref.authWithCustomToken(currentUser.firebaseToken, function(error, authData) {
                if (error) {
                  console.log("Firebase user authentication failed", error);
                } else {
                  if (user.role === "admin") console.log("Firebase user authentication succeeded!", authData);
                }
              }); 
            }
          })
        if (!currentUser.welcomeEmailSent) {
            User.sendWelcomeEmail({ id: currentUser._id }, {
            }, function(user) {
            }, function(err) {
                console.log("Error: " + err)
            }).$promise;  
        }
        if (currentUser.timezone != tzName) {
            User.saveTimezone({ id: currentUser._id }, {timezone: tzName}, function(user) {
              console.log("Updated user timezone preference")
              currentUser = user;
              Auth.updateUser(currentUser);
              $scope.currentUser = currentUser;
            }, function(err) {
                console.log("Error saving Timezone: " + err)
            }).$promise;
        }
    })

    var ref = new Firebase("https://bodyapp.firebaseio.com")
    $scope.upcomingIntros = $firebaseArray(ref.child('upcomingIntros').orderByKey().limitToFirst(12))
    // var query = $scope.allIntros.orderByKey().limitToFirst(10);
    // $scope.upcomingIntros = $firebaseArray(ref.child('upcomingIntros'))

	$scope.bookIntroClass = function(classBooked) {
		$scope.newUserStep++;
		$scope.bookedIntroClass = classBooked

        var classDate = new Date(classBooked.$id*1)
        var todayDate = new Date(classDate);
        var sunDate = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate() - todayDate.getDay(), 11, 0, 0);

        // var sunDate = new Date();
        // sunDate.setDate(todayDate.getDate() - todayDate.getDay());
        var sunGetDate = sunDate.getDate();
        var sunGetMonth = sunDate.getMonth()+1;
        var sunGetYear = sunDate.getFullYear();
        var weekOf = "weekof"+ sunGetYear + (sunGetMonth<10?"0"+sunGetMonth:sunGetMonth) + (sunGetDate<10?"0"+sunGetDate:sunGetDate);
        var weekOfRef = new Firebase("https://bodyapp.firebaseio.com/classes/" + weekOf)

		var classToBook = $firebaseObject(
	      weekOfRef.child(DayOfWeekSetter.setDay(classDate.getDay()))
	      .child("slots")
	      .child(classDate.getTime())
    	)

        // var date = new Date(classBooked.$id*1)
        // $scope.calendarDateSetter = date.getFullYear()+""+((date.getMonth()+1 < 10)?"0"+(date.getMonth()+1):(date.getMonth()+1))+""+((date.getDate() < 10)?"0"+date.getDate():date.getDate())+"T"+((date.getHours() < 10)?"0"+date.getHours():date.getHours())+""+((date.getMinutes() < 10)?"0"+date.getMinutes():date.getMinutes())+"00"
        // $scope.calendarDateSetterEnd = date.getFullYear()+""+((date.getMonth()+1 < 10)?"0"+(date.getMonth()+1):(date.getMonth()+1))+""+((date.getDate() < 10)?"0"+date.getDate():date.getDate())+"T"+((date.getHours() < 10)?"0"+(date.getHours()+1):(date.getHours()+1))+""+((date.getMinutes() < 10)?"0"+date.getMinutes():date.getMinutes())+"00"
        // $scope.timeZone = jstz().timezone_name;

    	classToBook.$loaded(function() {
    		classToBook.bookedUsers = classToBook.bookedUsers || {};
			classToBook.bookedUsers[$scope.currentUser._id] = {firstName: $scope.currentUser.firstName, lastName: $scope.currentUser.lastName.charAt(0), timeBooked: new Date().getTime(), picture: $scope.currentUser.picture, facebookId: $scope.currentUser.facebookId};
            // classToBook.bookedFbUserIds = classToBook.bookedFbUserIds || {};    
            // classToBook.bookedFbUserIds[$scope.currentUser.facebook.id] = true
			classToBook.$save()
            $scope.classDetails = classToBook;
    	})
		
		User.addIntroClass({ id: $scope.currentUser._id }, {
            classToAdd: classDate.getTime()
        }, function(user) {
            Auth.updateUser(user)

            //Check that using Chrome or Firefox
            // if (OT.checkSystemRequirements() != 1 || typeof InstallTrigger !== 'undefined') {
            //   // The client does not support WebRTC.
            //   var modalInstance = $uibModal.open({
            //     animation: true,
            //     templateUrl: 'app/video/wrongBrowser.html',
            //     controller: 'WrongBrowserCtrl',
            //   });

            //   modalInstance.result.then(function (selectedItem) {
            //     $scope.selected = selectedItem;
            //   }, function () {
            //     $log.info('Modal dismissed at: ' + new Date());
            //   });
            // }


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

    $scope.saveInjuriesGoalsEmergency = function(injuryString, goals, emergencyFirst, emergencyLast, emergencyRelationship, emergencyPhone) {
    	injuries = injuryString || "";
        goals = goals || "";
        if (!(emergencyFirst && emergencyLast && emergencyPhone)) return $scope.emergencyContactNotEntered = true;
        emergencyContact = {firstName: emergencyFirst, lastName: emergencyLast, relationship: emergencyRelationship, phone: emergencyPhone};

    	// if (injuries.length < 2) {
    	// 	$scope.errorDiv = true
    	// 	console.log("Didn't enter any injury information!")
    	// } else {
		User.saveInjuriesGoalsEmergency({id: $scope.currentUser}, {injuryString: injuries, goals: goals, emergencyContact: emergencyContact})
        .$promise.then(function(user) {
			console.log("Successfully saved injury, goals and emergency contact info.");
			Auth.getUpdatedUser();
            $scope.newUserStep++;   
		})
    	// }
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
        var localDate = new Date(slot.$id*1);
        var date = new Date(localDate.getTime() - jstz().utc_offset*60*1000);
        return date.getFullYear()+""+((date.getMonth()+1 < 10)?"0"+(date.getMonth()+1):(date.getMonth()+1))+""+((date.getDate() < 10)?"0"+date.getDate():date.getDate())+"T"+((date.getHours() < 10)?"0"+date.getHours():date.getHours())+""+((date.getMinutes() < 10)?"0"+date.getMinutes():date.getMinutes())+"00"         
      } 
      $scope.calendarDateSetterEnd = function(slot) {
        var localDate = new Date(slot.$id*1);
        var date = new Date(localDate.getTime() - jstz().utc_offset*60*1000);
        return date.getFullYear()+""+((date.getMonth()+1 < 10)?"0"+(date.getMonth()+1):(date.getMonth()+1))+""+((date.getDate() < 10)?"0"+date.getDate():date.getDate())+"T"+((date.getHours() < 10)?"0"+(date.getHours()+1):(date.getHours()+1))+""+((date.getMinutes() < 10)?"0"+date.getMinutes():date.getMinutes())+"00"
      } 
  });
