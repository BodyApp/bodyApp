angular.module('bodyAppApp')
  .factory('Studios', function() {
  	
  	var service = {};
  	service.currentStudio;
  	service.userHasClassNow = false;
  	service.classUserJustJoined;
  	service.totalRevenueByCustomer = {};

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

  	return service
  })