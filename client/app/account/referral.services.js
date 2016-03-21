angular.module('bodyAppApp')
  .factory('Referral', function() {
  	
  	var service = {};

    service.getReferralCode = function() {
      return service.referralCode;
    }

    service.setReferralCode = function(code) {
    	service.referralCode = code
    	console.log("referral code set to " + service.referralCode)
    }

  	return service
  })