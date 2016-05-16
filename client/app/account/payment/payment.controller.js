
angular.module('bodyAppApp')
  .controller('PaymentCtrl', function ($scope, Auth, $uibModalInstance, $interval, $timeout) {

  	$scope.currentUser = Auth.getCurrentUser();

    var checkPayment = $interval(function(){
      if (checkPaymentStatus()) {
        $scope.paymentComplete = true;
        $interval.cancel(checkPayment)
      }
    }, 1000, 15)

    $timeout(function(){
      if (!$scope.paymentComplete && !$scope.letIn) {
        $scope.errorPocessingPayment = true
      }
    }, 16)

  	$scope.closeModal = function() {
  		$uibModalInstance.close()
  	}

    $scope.letMeIn = function() {
      $scope.letIn = true
    }

  	function checkPaymentStatus() {
      // if (Auth.getCurrentUser() && Auth.getCurrentUser().stripe && Auth.
      // return Auth.getCurrentUser().stripe ? Auth.getCurrentUser().stripe.subscription.status === "active" : false
  	}

  	// $timeout(function(){
  	// 	if (checkPaymentStatus()) {
  	// 		$scope.paymentComplete = true;
  	// 	}
  	// }, 3000)



  	// $timeout(function(){
  	// 	if (checkPaymentStatus()) {
  	// 		$scope.paymentComplete = true;
  	// 	}
  	// }, 6000)

  	// $timeout(function(){
  	// 	if (checkPaymentStatus()) {
  	// 		$scope.paymentComplete = true;
  	// 	}
  	// }, 8000)

  	// $timeout(function(){
  	// 	if (checkPaymentStatus()) {
  	// 		$scope.paymentComplete = true;
  	// 	} else {
  	// 		$scope.errorProcessingPayment = true;
  	// 	}
  	// }, 10000)

  	// $timeout(function(){
  	// 	if (checkPaymentStatus()) {
  	// 		$uibModalInstance.close()
  	// 	} else {
  	// 		$scope.errorProcessingPayment = true;
  	// 	}
  	// }, 20000)
  	// console.log($scope.currentUser);

		// $scope.saveCreditCardToken = function(code, result) {
  //     console.log(code)
  //     console.log(result)
  //   }
  });