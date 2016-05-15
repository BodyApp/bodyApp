angular.module('bodyAppApp')
  .factory('Studios', function(Auth) {
  	
  	var service = {};
  	service.currentStudio;
  	service.userHasClassNow = false;
  	service.classUserJustJoined;
  	service.totalRevenueByCustomer = {};

    service.classTypes;
    service.playlists;
    service.workouts;
    service.instructors;
    service.admin;

    var ref = new Firebase("https://bodyapp.firebaseio.com/studios"); 
    // var fbObject;

    service.isAdmin = function() {
      // return service.admin;
      // if (!service.admin && service.currentStudio) {
      //   console.log("yeah")
      //   ref.child(service.currentStudio).child('admins').child(Auth.getCurrentUser()._id).once('value', function(snapshot) {
      //     if (snapshot.exists()) {
      //       service.admin = true
      //       return true;
      //     } else {
      //       service.admin = false
      //       return false;
      //     }
      //   })
      // } else {
      //   console.log("here")
        return service.admin;
      // }
    }

    service.setCurrentStudio = function(studio) {
      service.currentStudio = studio
      if (!service.admin) {
        ref.child(studio).child('admins').child(Auth.getCurrentUser()._id).on('value', function(snapshot) {
          if (snapshot.exists()) {
            service.admin = true
          } else {
            service.admin = false
          }
        })
      }
    }    

    service.getCurrentStudio = function() {
      return service.currentStudio;
    }    

    service.saveCustomerRevenue = function(customer, revenue) {
    	service.totalRevenueByCustomer[customer.id] = revenue;
    }

    service.getCustomerRevenue = function(customer) {
    	return service.totalRevenueByCustomer[customer.id];
    }

    service.saveClassTypes = function(classTypes) {
      service.classTypes = classTypes;
    }

    service.getClassTypes = function() {
      return service.classTypes;
    }

    service.savePlaylistObjects = function(playlists) {
      service.playlists = playlists;
    }

    service.getPlaylistObjects = function() {
      return service.playlists;
    }

    service.saveInstructors = function(instructors) {
      service.instructors = instructors;
    }

    service.getInstructors = function() {
      return service.instructors;
    }

    service.saveWorkouts = function(workouts) {
      service.workouts = workouts;
    }

    service.getWorkouts = function() {
      return service.workouts;
    }

  	return service
  })