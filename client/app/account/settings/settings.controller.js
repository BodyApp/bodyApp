'use strict';

angular.module('bodyAppApp')
  .controller('SettingsCtrl', function ($scope, User, Auth) {
    $scope.errors = {};
    $scope.editingCreditCardInfo = false;

    $scope.currentUser = User.get()
    console.log($scope.currentUser);

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
