'use strict';

angular.module('bodyAppApp')
  .controller('MainCtrl', function ($scope, $uibModal, $location, $http, $window, $state, Auth, User) {

    $scope.videoSee = false;
    // $window.scrollTo(0,0);

    //Intercom integration for when users are not yet logged in.
    window.intercomSettings = {
      app_id: "daof2xrs"
    };

    $scope.loginOauth = function(provider) {
      $window.location.href = '/auth/' + provider;
    };

    $scope.scrollDown = function() {
      document.getElementById('scroll-link').scrollIntoView()
    }

    $scope.signUp = function() {
      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: 'app/account/signup/signup.html',
        controller: 'SignupCtrl',
        windowClass: "modal-tall"
      });

      modalInstance.result.then(function (selectedItem) {
        // $window.location.href = '/auth/' + 'facebook';
        $window.location.reload()
      }, function () {
        $window.location.reload()
      });
    }

    Auth.isLoggedInAsync(function(loggedIn) {
      if (loggedIn) {
        if (Auth.getCurrentUser().completedNewUserFlow || Auth.getCurrentUser().injuries || Auth.getCurrentUser().goals) {
          // event.preventDefault();
          $state.go('schedule');
        } else {
          // event.preventDefault;
          $state.go('newuser');
        }
      }
    });

    // // *****************SCROLL DOWN*****************
    // $(".arrow").click(function() {
    //     $('html,body').animate({
    //         scrollTop: $(".scroll-to").offset().top + -100},
    //         600);
    // });

  });
