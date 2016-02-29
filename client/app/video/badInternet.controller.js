'use strict';

angular.module('bodyAppApp')
  .controller('BadInternetCtrl', function ($scope, $location, $window, $uibModalInstance, classToJoin, currentUser) {
    $scope.backToMain = function() {
      $uibModalInstance.dismiss()
      $location.path('/')
    }

    $scope.joinClass = function() {
    	$uibModalInstance.dismiss()
      if (currentUser && classToJoin && classToJoin.trainer && currentUser._id === classToJoin.trainer._id) {
        $location.path('/trainervideo')
      } else {
        $location.path('/consumervideo')
      }
    }

    $scope.closeModal = function() {
      $uibModalInstance.close()
    }
  })