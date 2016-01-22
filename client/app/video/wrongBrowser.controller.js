'use strict';

angular.module('bodyAppApp')
  .controller('WrongBrowserCtrl', function ($scope, $location, $window, $uibModalInstance) {
    $scope.backToMain = function() {
      $uibModalInstance.dismiss()
      $location.path('/')
    }

    $scope.gotoChrome = function() {
      $window.open("https://www.google.com/chrome/index.html");
      $uibModalInstance.close()
      $location.path('/')
    }
  })