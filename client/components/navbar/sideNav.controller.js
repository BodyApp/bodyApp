'use strict';

angular.module('bodyAppApp')
  .controller('SideNavbarCtrl', function ($scope, $location, Studios) {
  	$scope.studioId = Studios.getCurrentStudio()
  	// console.log($location.path())
  	$scope.selectedTab = $location.path().substr($location.path().lastIndexOf('/') + 1);
  	console.log($scope.selectedTab)
  });