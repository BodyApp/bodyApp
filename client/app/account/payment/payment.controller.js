
angular.module('bodyAppApp')
  .controller('PaymentCtrl', function ($scope, Auth, $modalInstance) {

  	$scope.currentUser = Auth.getCurrentUser();
  	console.log($scope.currentUser);

		// $scope.saveCreditCardToken = function(code, result) {
  //     console.log(code)
  //     console.log(result)
  //   }
  });