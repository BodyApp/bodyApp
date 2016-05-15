angular.module('bodyAppApp')
  .factory('Studios', function() {
  	
  	var service = {};
  	service.currentStudio;
  	service.userHasClassNow = false;
  	service.classUserJustJoined;
  	service.totalRevenueByCustomer = {};

    service.classTypes;
    service.playlists;
    service.workouts;
    service.instructors;

    var ref = new Firebase("https://bodyapp.firebaseio.com/studios"); 
    // var fbObject;

    service.setCurrentStudio = function(studio) {
      service.currentStudio = studio
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