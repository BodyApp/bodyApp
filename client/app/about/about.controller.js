'use strict';

angular.module('bodyAppApp')
  .controller('AboutCtrl', function ($scope, $uibModal, $http, $window, $state, Auth) {
    var ref = new Firebase("https://bodyapp.firebaseio.com");
    $scope.challenges;
    $(window).scrollTop()
    getWods()
    // window.scrollTo(0, 0);
  	$scope.loginOauth = function(provider) {
      $window.location.href = '/auth/' + provider;
    };

    function getWods() {
      var rightNow = new Date().getTime()
      ref.child('WODs').orderByChild('dateTime').limitToLast(60).endAt(rightNow).once('value', function(snapshot) {
        $scope.challenges = []
        for (var i in snapshot.val()) {
          $scope.challenges.unshift(snapshot.val()[i])
        }
        if(!$scope.$$phase) $scope.$apply();
      })
    }

    $scope.formatDateTime = function(dateTime) {
      moment.locale('en')
      return moment(new Date(dateTime)).format('ll');
      // return moment(dateTime).format('z')
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
  })
// .filter('reverse', function(items) {
//   return function(items) {
//     return items.slice().reverse();
//   };
// });