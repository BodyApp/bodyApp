'use strict';

angular.module('bodyAppApp')
  .controller('AboutCtrl', function ($scope, $uibModal, $http, $window, $state, Auth) {
    $(window).scrollTop()
  	$scope.loginOauth = function(provider) {
      $window.location.href = '/auth/' + provider;
    };

    $scope.signUp = function() {
      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: 'app/account/signup/signup.html',
        controller: 'SignupCtrl',
        windowClass: "modal-tall"
      });

      modalInstance.result.then(function (selectedItem) {
        // $window.location.href = '/auth/' + 'facebook';
      }, function () {
      });
    }

    $scope.scrollDown = function() {
      document.getElementById('scroll-link').scrollIntoView()
    }

    // Auth.isLoggedInAsync(function(loggedIn) {
    //     if (loggedIn) {
    //       if (Auth.getCurrentUser().completedNewUserFlow) {
    //         // event.preventDefault();
    //         $state.go('schedule');
    //       } else {
    //         // event.preventDefault;
    //         $state.go('newuser');
    //       }
    //     }
    // });

    // // *****************SCROLL DOWN*****************
    // $(".arrow").click(function() {
    //     $('html,body').animate({
    //         scrollTop: $(".scroll-to").offset().top + -100},
    //         600);
    // });
  });