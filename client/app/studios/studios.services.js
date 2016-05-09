angular.module('bodyAppApp')
  .factory('Studios', function() {
  	
  	var service = {};
  	service.currentStudio;
  	service.userHasClassNow = false;
  	service.classUserJustJoined;

    var ref = new Firebase("https://bodyapp.firebaseio.com/studios"); 
    // var fbObject;

    service.setCurrentStudio = function(studio) {
      service.currentStudio = studio
    }    

    service.getCurrentStudio = function() {
      return service.currentStudio;
    }    
    
  	return service
  })