'use strict';

angular.module('bodyAppApp')
  .controller('SideNavbarCtrl', function ($scope, $location, Studios) {
  	$scope.studioId = Studios.getCurrentStudio()
  	$scope.selectedTab = $location.path().substr($location.path().lastIndexOf('/') + 1);
  });