angular.module('bodyAppApp')
  .factory('Schedule', function($firebaseObject, DayOfWeekSetter) {
  	
  	var service = {};
  	var currentUser;
  	service.classInNext30Mins;
  	service.userHasClassNow = false;
  	service.classUserJustJoined;

    var ref = new Firebase("https://bodyapp.firebaseio.com/"); 
    var fbObject;

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

  	service.setClassUserJustJoined = function(classJoined) {
      // var q = new Promise()

      var workoutDate = new Date(classJoined.date);
      var sunDate = new Date(workoutDate.getFullYear(), workoutDate.getMonth(), workoutDate.getDate() - workoutDate.getDay(), 11, 0, 0);
      var sunGetDate = sunDate.getDate();
      var sunGetMonth = sunDate.getMonth()+1;
      var sunGetYear = sunDate.getFullYear();
      var weekOf = "weekof"+ sunGetYear + (sunGetMonth<10?"0"+sunGetMonth:sunGetMonth) + (sunGetDate<10?"0"+sunGetDate:sunGetDate);
      var weekOfRef = new Firebase("https://bodyapp.firebaseio.com/classes/" + weekOf);
      var dayOfWeek = DayOfWeekSetter.setDay(workoutDate.getDay())
      var classRef = weekOfRef.child(dayOfWeek).child("slots").child(classJoined.date) 

      classRef.on('value', function(snapshot) {
        console.log(snapshot.val())
        service.classUserJustJoined = snapshot.val()  
      })
  	}

  	service.setFirebaseObject = function(weekRef) {
	    var weekRef = ref.child("classes").child(weekRef);
      fbObject = $firebaseObject(weekRef);
			return fbObject;
  	}

    // service.clearFirebaseObject = function() {
    //   fbObject = null;
    //   fbObject = $firebaseObject()
    //   return fbObject;
    // }

  	return service
  })