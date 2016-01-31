
'use strict';

angular.module('bodyAppApp')
  .controller('MembershipCtrl', function ($scope, $uibModalInstance) {
	    $(".arrow").click(function() {
	        $('html,body').animate({
	            scrollTop: $(".scroll-to").offset().top},
	            600);
	    });

		$scope.joinClicked = function() {
			$uibModalInstance.dismiss('join');
		}	
	});