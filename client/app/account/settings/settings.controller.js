'use strict';

angular.module('bodyAppApp')
  .controller('SettingsCtrl', function ($scope, $http, User, Auth) {
    $scope.errors = {};
    $scope.editingCreditCardInfo = false;
    $scope.currentUser;

    User.get().$promise.then(function(data){
      $scope.currentUser = data
      $scope.subEndDate = new Date($scope.currentUser.stripe.endDate*1000)
      console.log($scope.currentUser);
    })

    $scope.cancelSubscription = function() {
      $http.post('/api/users/cancelSubscription', {
        user: currentUser
      })
      .success(function(data) {
          console.log("Successfully posted to /user/cancelsub");
          currentUser = data
          $scope.currentUser = currentUser
          Auth.currentUser = currentUser
          modalInstance.close()
      })
      .error(function(err) {
          console.log("Error posting to /user/cancelsub: " + err)
      }.bind(this));
    }

  //   $scope.changePassword = function(form) {
  //     $scope.submitted = true;
  //     if(form.$valid) {
  //       Auth.changePassword( $scope.user.oldPassword, $scope.user.newPassword )
  //       .then( function() {
  //         $scope.message = 'Password successfully changed.';
  //       })
  //       .catch( function() {
  //         form.password.$setValidity('mongoose', false);
  //         $scope.errors.other = 'Incorrect password';
  //         $scope.message = '';
  //       });
  //     }
		// };
  });
