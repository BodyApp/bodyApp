'use strict';

angular.module('bodyAppApp')
  .controller('AddMembershipModalCtrl', function ($scope, $location, $window, $uibModalInstance, $uibModal) {
    $scope.closeModal = function() {
      $uibModalInstance.dismiss()
    }

    $scope.addMembership = function() {
      $uibModalInstance.close()
      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: 'app/membership/membership.html',
        controller: 'MembershipCtrl',
        windowClass: "modal-wide",
        resolve: {
          slot: function() {
            return undefined
          }
        }
      });

      modalInstance.result.then(function () {
      }, function () {
      });
    }
  })