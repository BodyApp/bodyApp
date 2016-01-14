
'use strict';

angular.module('bodyAppApp')
  .controller('MembershipCtrl', function () {
		$(".arrow").click(function() {
		    $('html,body').animate({
		        scrollTop: $("#scroll-link").offset().top + -100},
		        600);
		});	
	});