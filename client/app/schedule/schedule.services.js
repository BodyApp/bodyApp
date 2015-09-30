angular.module('bodyAppApp')
  .factory('Schedule', ["$firebaseObject", 
  	function($firebaseObject) {
  		return function(week) {
  			// connect to firebase 
		    var ref = new Firebase("https://bodyapp.firebaseio.com/");  
		    var weekRef = ref.child(week);
		    var currentWeek;

		    weekRef.on("value", function(snapshot) {
		    	currentWeek = snapshot.val();
		    	checkDates(currentWeek)
		    })

		    var todayDate = new Date();
		    var todayDayOfWeek = todayDate.getDay();
		    
		    //Makes slots in the past unavailable
		    function checkDates(currentWeek) {
			    for (var day in currentWeek) {
			      if (currentWeek[day].dayOfWeek < todayDayOfWeek) {
			        for (var slot in currentWeek[day].slots) {
			        	weekRef.child(day).child("slots").child(slot).update({unavailable: true})
			          // currentWeek[day].slots[slot].unavailable = true;
			        }
			      }
			      //Makes slots earlier today unavailable
			      if (currentWeek[day].dayOfWeek == todayDayOfWeek) {
			        for (var slot in currentWeek[day].slots) {
			          if (slot <= todayDate.getHours()*100) {
			            // currentWeek[day].slots[slot].unavailable = true;
			            weekRef.child(day).child("slots").child(slot).update({unavailable: true})
			          }
			        } 
			      }
			    }
			  }
  			return $firebaseObject(weekRef)
  		}
  	}
  ])