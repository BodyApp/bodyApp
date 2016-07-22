angular.module('bodyAppApp')
  .controller('UserScheduleCtrl', function ($scope, $location, Auth) {
  	var ref = firebase.database().ref();
    var auth = firebase.auth();
    var timezone = jstz().timezone_name;

    Intercom('trackEvent', 'navigatedToUserSchedule');

    var startAt = (new Date().getTime() - 60*60*1000) //Can see classes that started an hour in the past.

    auth.onAuthStateChanged(function(user) {
        if (user) {
          delayStart()
        } else {
          // console.log("User is logged out");
          if (currentUser.firebaseToken) {
            auth.signInWithCustomToken(currentUser.firebaseToken).then(function(user) {
              if (currentUser.role === "admin") console.log("Firebase user authentication succeeded!", user);
            }); 
          } else {
            console.log("User doesn't have a firebase token saved, should retrieve one.")
          }
        }
    })

    function delayStart() {
        ref.child('userBookings').child(Auth.getCurrentUser()._id).orderByKey().startAt(startAt.toString()).once('value', function(snapshot) {
            $scope.userBookings = snapshot.val();
            console.log(snapshot.val())
            Intercom('trackEvent', 'pulledUpcomingClasses', { numUpcomingClasses: snapshot.numChildren });
        })
    }
    

    $scope.formatDate = function(dateTime) {
    	console.log(dateTime)
    	return moment(dateTime).format('ddd MMM Do')
    }

    $scope.formatTime = function(dateTime) {
    	return moment(dateTime).tz(timezone).format('h:mm a z')
    }

    $scope.goToClassInfo = function(classToGoTo) {
    	$location.path('/studios/'+classToGoTo.studioId+"/classinfo/"+classToGoTo.classId)
    }
  })