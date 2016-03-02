'use strict';

angular.module('bodyAppApp')
  .controller('SpreadWordCtrl', function ($scope, $uibModalInstance) {
    $scope.closeModal = function() {
      $uibModalInstance.dismiss()
    }
  });