"http://vip.getbodyapp.com"

'use strict';

angular.module('bodyAppApp')
  .controller('NavbarCtrl', function ($scope, $location, $state, $uibModal, $window, Auth) {
    $scope.getCurrentUser = Auth.getCurrentUser;

  });