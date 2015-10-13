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

	    weekRef.on("value", function(snapshot) {
	    	checkDates(snapshot.val(), weekRef);
	    })

			return $firebaseObject(weekRef);
  	}

  	function checkDates(currentWeek, weekRef) {
  		var todayDate = new Date();
	    var todayDayOfWeek = todayDate.getDay();

	    for (var day in currentWeek) {
	    	for (var slot in currentWeek[day].slots) {
		      if (currentWeek[day].dayOfWeek < todayDayOfWeek) {
	        	weekRef.child(day).child("slots").child(slot).update({past: true})
		      }
		      if (currentWeek[day].dayOfWeek == todayDayOfWeek) {
		      	//Adds 15 minutes of leeway for signing up for class
	          if (slot <= (todayDate.getTime() - 15*60*1000)) {
	            weekRef.child(day).child("slots").child(slot).update({past: true})
	            //Is it time for one of your classes?!  Can join 15 minutes before or up to 15 minutes into class
	          } else if ((slot - (todayDate.getTime() - 15*60*1000) <= 15 || slot - todayDate.getTime() >= -15*60*1000) && currentWeek[day].slots[slot].bookedUsers && currentWeek[day].slots[slot].bookedUsers[currentUser._id]) {
	          	service.classInNext30Mins = currentWeek[day].slots[slot]
	          	service.userHasClassNow = true;
			      } else {
			      	service.classInNext30Mins = null
			      	service.userHasClassNow = false
			      }
		      }
		      if (currentWeek[day].slots[slot].bookedUsers && Object.keys(currentWeek[day].slots[slot].bookedUsers).length >= 8) {
            weekRef.child(day).child("slots").child(slot).update({classFull: true})
		      }
		    }
	    }
	  }

  	return service
  })