angular.module('bodyAppApp')
  .controller('CancellationCtrl', function ($scope, $uibModalInstance, $timeout) {

  	$scope.closeModal = function() {
  		$uibModalInstance.close()
  	}

  	$timeout(function(){
  		$uibModalInstance.close()
  	}, 10000)
  });