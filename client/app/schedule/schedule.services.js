angular.module('bodyAppApp')
  .factory('Schedule', function($firebaseObject) {
  	
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

  	service.setClassUserJustJoined = function(classJoined) {
  		service.classUserJustJoined = classJoined
  	}

  	service.setFirebaseObject = function(weekRef) {
	    var weekRef = ref.child(weekRef);
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