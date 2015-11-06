angular.module('bodyAppApp')
  .factory('Schedule', function($firebaseObject) {
  	
  	var service = {};
  	var currentUser;
  	service.classInNext30Mins;
  	service.userHasClassNow = false;
  	service.classUserJustJoined;

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
	    var ref = new Firebase("https://bodyapp.firebaseio.com/");  
	    var weekRef = ref.child(weekRef);

			return $firebaseObject(weekRef);
  	}

  	return service
  })