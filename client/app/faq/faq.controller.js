'use strict';

angular.module('bodyAppApp')
  .controller('FAQCtrl', function ($scope) {
  	$scope.instructorSee = false;
  	$scope.otherSee = false;
  	$scope.startingOut = false;
  	$scope.variousLevels = false;
  	$scope.cantMakeClass = false;
  	$scope.runningLate = false
  	$scope.refundPolicy = false;
  	$scope.releasePolicy = false;
  });