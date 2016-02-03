'use strict';

angular.module('bodyAppApp')
  .controller('MainCtrl', function ($scope, $uibModal, $http, $window, $state, Auth) {
    $scope.loginOauth = function(provider) {
      $window.location.href = '/auth/' + provider;
    };

    $scope.signUp = function() {
      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: 'app/account/login/login.html',
        controller: 'LoginCtrl',
        windowClass: "modal-tall"
      });

      modalInstance.result.then(function (selectedItem) {
        $window.location.href = '/auth/' + 'facebook';
      }, function () {
      });
    }

    Auth.isLoggedInAsync(function(loggedIn) {
        if (loggedIn) {
          if (Auth.getCurrentUser().completedNewUserFlow) {
            // event.preventDefault();
            $state.go('schedule');
          } else {
            // event.preventDefault;
            $state.go('newuser');
          }
        }
    });

    // *****************SCROLL DOWN*****************
    $(".arrow").click(function() {
        $('html,body').animate({
            scrollTop: $(".scroll-to").offset().top + -100},
            600);
    });

  });
