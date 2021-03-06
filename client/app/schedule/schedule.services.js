angular.module('bodyAppApp')
  .factory('Schedule', function($firebaseObject, DayOfWeekSetter) {
  	
  	var service = {};
  	var currentUser;
    var currentStudio;
  	service.classInNext30Mins;
  	service.userHasClassNow = false;
  	service.classUserJustJoined;

    // var ref = new Firebase("https://bodyapp.firebaseio.com/studios"); 
    // var fbObject;

    service.setCurrentStudio = function(studio) {
      currentStudio = studio
    }    

    service.getCurrentStudio = function() {
      return currentStudio;
    }    

  	service.setCurrentUser = function(user) {
  		currentUser = user
  	}

  	service.returnClassInNext30Mins = function(){
  		return service.classInNext30Mins;
  	}

  	service.returnUserHasClassNow = function() {
  		return service.userHasClassNow;	
  	}

    service.auditClass = function() {
      service.auditingClass = true;
      return service.auditingClass;
    }

    service.cancelAuditClass = function()  {
      service.auditingClass = false;
      return service.auditingClass;
    }

  	service.setClassUserJustJoined = function(studioId, classJoined) {
      // var q = new Promise()
      service.classUserJustJoined = classJoined;

      // var workoutDate = new Date(classJoined.date);
      // var sunDate = new Date(workoutDate.getFullYear(), workoutDate.getMonth(), workoutDate.getDate() - workoutDate.getDay(), 11, 0, 0);
      // var sunGetDate = sunDate.getDate();
      // var sunGetMonth = sunDate.getMonth()+1;
      // var sunGetYear = sunDate.getFullYear();
      // var weekOf = "weekof"+ sunGetYear + (sunGetMonth<10?"0"+sunGetMonth:sunGetMonth) + (sunGetDate<10?"0"+sunGetDate:sunGetDate);
      // var weekOfRef = ref.child(studioId).child("classes").child(weekOf);
      // var dayOfWeek = DayOfWeekSetter.setDay(workoutDate.getDay())
      // var classRef = weekOfRef.child(dayOfWeek).child("slots").child(classJoined.date) 

      // var classRef = ref.child(studioId).child('classes').child(classJoined);

      // classRef.on('value', function(snapshot) {
        // service.classUserJustJoined = snapshot.val()
        // ref.child(studioId).child('trainers').child(service.classUserJustJoined.trainer).once('value', function(snapshot) {
        //   service.trainerOfStudioJustJoined = snapshot.val()
        // })
      // })
  	}

  	service.setFirebaseObject = function(weekRef) {
	    var weekRef = ref.child("classes").child(weekRef);
      return $firebaseObject(weekRef);
			// return fbObject;
  	}

    // service.clearFirebaseObject = function() {
    //   fbObject = null;
    //   fbObject = $firebaseObject()
    //   return fbObject;
    // }

  	return service
  })