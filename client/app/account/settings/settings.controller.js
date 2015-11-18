'use strict';

angular.module('bodyAppApp')
  .controller('SettingsCtrl', function ($scope, $http, $modal, User, Auth) {
    $scope.errors = {};
    $scope.editingCreditCardInfo = false;
    $scope.currentUser = Auth.getCurrentUser();
    console.log($scope.currentUser)
    $scope.subEndDate;
    if ($scope.currentUser.stripe && $scope.currentUser.stripe.subscription) {
      $scope.subEndDate = new Date($scope.currentUser.stripe.subscription.endDate*1000)
    }

    $scope.cancelSubscription = function() {
      if (confirm("Are you sure you want to cancel your subscription?")) {
        var modalInstance = openCancellationConfirmedModal()
        $http.post('/api/users/cancelsub', {
          user: Auth.getCurrentUser()
        })
        .success(function(data) {
            console.log("Successfully posted to /user/cancelsub");
            console.log(data)
            $scope.currentUser = data
            Auth.updateUser(data)
            modalInstance.close()
        })
        .error(function(err) {
            console.log("Error posting to /user/cancelsub: " + err)
        }.bind(this));
      }
    }

    $scope.changeCard = function() {

    }

    function openCancellationConfirmedModal() {
        var modalInstance = $modal.open({
          animation: true,
          templateUrl: 'app/account/settings/cancellation.html',
          controller: 'SettingsCtrl',
          backdrop: "static",
          keyboard: false
          // size: size,
          // resolve: {
          //   currentUser: function () {
          //     return currentUser;
          //   }
          // }
        });

        modalInstance.result.then(function (selectedItem) {
          $scope.selected = selectedItem;
        }, function () {
          $log.info('Modal dismissed at: ' + new Date());
        });

        return modalInstance;
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
