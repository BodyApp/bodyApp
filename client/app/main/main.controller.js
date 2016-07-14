'use strict';

angular.module('bodyAppApp')
  .controller('MainCtrl', function ($scope, $uibModal, $location, $http, $window, $state, $sce, Auth, User) {

    $scope.videoSee = false;
    var ref = firebase.database().ref();
    var storageRef = firebase.storage().ref()

    // $window.scrollTo(0,0);

    getStudios()
    $scope.backgroundImages = {};
    $scope.logos = {};
    getAssets()

    //Intercom integration for when users are not yet logged in.
    window.intercomSettings = {
      app_id: "daof2xrs"
    };

    $scope.goToDiscover = function(tag) {
       // $location.path('/discover/' + tag) 
       $state.go('discover', {tag: tag})
    }

    function getStudios() {
      ref.child('studioIds').orderByValue().limitToFirst(3).on('value', function(snapshot) {
        $scope.studios = [];
        snapshot.forEach(function(studio) {
          // if (!studio.exists()) delete $scope.studios[studio.key]
          ref.child('studios').child(studio.key).child('storefrontInfo').once('value', function(storefrontInfo) {
            $scope.studios.push(storefrontInfo.val())
            getBackgroundImage(studio.key);
            getLogo(studio.key);
            console.log($scope.studios)
            if(!$scope.$$phase) $scope.$apply();
            // console.log($scope.studios)
          })
        })
      })
    }

    function getBackgroundImage(studioId) {
      storageRef.child('studios').child(studioId).child('images/header.jpg').getDownloadURL().then(function(url) {
          // $scope.headerUrl = url;
          $scope.backgroundImages[studioId] = url
          if(!$scope.$$phase) $scope.$apply();
        }).catch(function(error) {
          console.log(error)
        });
    }

    function getLogo(studioId) {
      var storageRef = firebase.storage().ref().child('studios').child(studioId);
      storageRef.child('images/icon.jpg').getDownloadURL().then(function(url) {
          // $scope.headerUrl = url;
          $scope.logos[studioId] = url
          if(!$scope.$$phase) $scope.$apply();
        }).catch(function(error) {
          console.log(error)
        });
    }

    $scope.login = function() {
      $state.go('signup', {step: 0, mode: 'login'})
      // $window.location.href = '/auth/' + provider;
    };

    $scope.scrollDown = function() {
      document.getElementById('scroll-link').scrollIntoView()
    }

    $scope.signUp = function() {
      $state.go('signup', {step: 0, mode: 'signup'})
      // var modalInstance = $uibModal.open({
      //   animation: true,
      //   templateUrl: 'app/account/signup/signup.html',
      //   controller: 'SignupCtrl',
      //   windowClass: "modal-tall"
      // });

      // modalInstance.result.then(function (selectedItem) {
      //   // $window.location.href = '/auth/' + 'facebook';
      //   $window.location.reload()
      // }, function () {
      //   $window.location.reload()
      // });
    }

    // Auth.isLoggedInAsync(function(loggedIn) {
    //   if (loggedIn) {
    //     if (Auth.getCurrentUser().completedNewUserFlow || Auth.getCurrentUser().injuries || Auth.getCurrentUser().goals) {
    //       // event.preventDefault();
    //       $state.go('storefront');
    //     } else {
    //       // event.preventDefault;
    //       $state.go('newuser');
    //     }
    //   }
    // });

    $scope.playYoutubeVideo = function() {
      // $("#youtubeVideo")[0].src += "&autoplay=1";
      $('#youtubeVideo').attr('src', $sce.trustAsResourceUrl('https://www.youtube.com/embed/0MvO3-8CLNc?rel=0&amp;showinfo=0&autoplay=1'));
      $scope.showVideoPlayer = true;
      $scope.hidePlayer = false;
      if(!$scope.$$phase) $scope.$apply();
    }

    $scope.stopPlayingVideo = function() {
      $('#youtubeVideo').attr('src', $sce.trustAsResourceUrl('https://www.youtube.com/embed/0MvO3-8CLNc?rel=0&amp;showinfo=0&autoplay'));
      $scope.showVideoPlayer = false;
      if(!$scope.$$phase) $scope.$apply();
    }

    function getAssets() {
      
      storageRef.child('studios').child('body').child('images/header.jpg').getDownloadURL().then(function(url) {
        // $scope.headerUrl = url;
        $scope.headerImageUrl = url
        if(!$scope.$$phase) $scope.$apply();
      }).catch(function(error) {
        console.log(error)
      });
      
      storageRef.child('assets').child('images').child('mainPageImage.JPG').getDownloadURL().then(function(url) {
        // $scope.headerUrl = url;
        $scope.mainPageImageUrl = url
        console.log($scope.mainPageImageUrl)
        if(!$scope.$$phase) $scope.$apply();
      }).catch(function(error) {
        console.log(error)
      });
    }

    // // *****************SCROLL DOWN*****************
    // $(".arrow").click(function() {
    //     $('html,body').animate({
    //         scrollTop: $(".scroll-to").offset().top + -100},
    //         600);
    // });

  });