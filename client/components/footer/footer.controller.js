"http://vip.getbodyapp.com"

'use strict';

angular.module('bodyAppApp')
  .controller('FooterCtrl', function ($scope, $location, $state, $uibModal, $window, Auth) {
    $scope.getCurrentUser = Auth.getCurrentUser;

    $scope.openIntercomMessage = function() {
    	Intercom('showNewMessage');
    }

  });