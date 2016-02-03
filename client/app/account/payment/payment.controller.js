
angular.module('bodyAppApp')
  .controller('PaymentCtrl', function ($scope, Auth, $uibModalInstance, $timeout) {

  	$scope.currentUser = Auth.getCurrentUser();

  	$scope.closeModal = function() {
  		$uibModalInstance.close()
  	}

  	function checkPaymentStatus() {
  		if ($scope.paymentComplete) return
  		return Auth.getCurrentUser().stripe.subscription.status === "active"
  	}

  	// $timeout(function(){
  	// 	if (checkPaymentStatus()) {
  	// 		$scope.paymentComplete = true;
  	// 	}
  	// }, 3000)

  	$timeout(function(){
  		if (checkPaymentStatus()) {
  			$scope.paymentComplete = true;
  		}
  	}, 5000)

  	$timeout(function(){
  		if (checkPaymentStatus()) {
  			$scope.paymentComplete = true;
  		}
  	}, 6000)

  	$timeout(function(){
  		if (checkPaymentStatus()) {
  			$scope.paymentComplete = true;
  		}
  	}, 8000)

  	$timeout(function(){
  		if (checkPaymentStatus()) {
  			$scope.paymentComplete = true;
  		} else {
  			$scope.errorProcessingPayment = true;
  		}
  	}, 10000)

  	$timeout(function(){
  		if (checkPaymentStatus()) {
  			$uibModalInstance.close()
  		} else {
  			$scope.errorProcessingPayment = true;
  		}
  	}, 20000)
  	// console.log($scope.currentUser);

		// $scope.saveCreditCardToken = function(code, result) {
  //     console.log(code)
  //     console.log(result)
  //   }
  });