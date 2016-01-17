
'use strict';

angular.module('bodyAppApp')
  .controller('MembershipCtrl', function ($scope, $uibModalInstance) {
		$(".arrow").click(function() {
	    $('html,body').animate({
        scrollTop: $("#scroll-link").offset().top + -100},
        600);
		});

		$scope.joinClicked = function() {
			$uibModalInstance.dismiss('join');
		}	
	});