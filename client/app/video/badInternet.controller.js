'use strict';

angular.module('bodyAppApp')
  .controller('BadInternetCtrl', function ($scope, $location, $window, $uibModalInstance) {
    $scope.backToMain = function() {
      $uibModalInstance.dismiss()
      $location.path('/')
    }
  })