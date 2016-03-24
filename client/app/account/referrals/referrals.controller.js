angular.module('bodyAppApp')
  .controller('ReferralCtrl', function ($scope, $stateParams) {

  	

  	$scope.closeModal = function() {
  		$uibModalInstance.close()
  	}

  });