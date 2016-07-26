'use strict';

angular.module('bodyAppApp')
  .controller('MainCtrl', function ($scope, $uibModal, $location, $http, $window, $state, $sce, $cookies, $interval, $timeout, Auth, User) {

    $scope.currentUser = Auth.getCurrentUser()
    $scope.videoSee = false;
    var ref = firebase.database().ref();
    var storageRef = firebase.storage().ref()

    // $window.scrollTo(0,0);

    getStudios()
    $scope.backgroundImages = {};
    $scope.logos = {};
    getAssets()

    $scope.selectedPowerWord = "Body"
    var powerWords = ['Confidence', 'Sexy', "Body", "Intensity", "Fitness", "Wellness", "Motivation", "Drive", "Success", "Strength", "Flexibility", "Community", "Bikini Body", "Lifestyle", "Good Habits", "Friends", "Figure", "Attitude", "Naked", "Self", "Passion", "Inspiration", "Hotness", "Proof", "Glory", "Warrior", "Namaste"];
    pickPowerWord()

    var ctx;

    function pickPowerWord() {
      var selectedWord = powerWords[Math.floor(Math.random()*powerWords.length)];
      // $scope.selectedPowerWord = powerWords[Math.floor(Math.random()*powerWords.length)];
      
      $scope.selectedPowerWord = ""
      if(!$scope.$$phase) $scope.$apply();

            var i = 0;
      $interval(function(){
        if(i<selectedWord.length)
          $scope.selectedPowerWord += selectedWord[i];
         i++; 
       if(!$scope.$$phase) $scope.$apply();
      }, 200);

    //     // ctx = $("canvas").html("<canvas class = 'h1cursive' width=640 height=100></canvas>").getContext("2d")
    //     // ctx = document.querySelector("canvas").getContext("2d")
    //     ctx = document.querySelector("canvas").getContext("2d")
    //     ctx.clearRect(0, 0, 640, 150);
    //     // dash-length for off-range
    //     var dashLen = 220,
    //     // we'll update this, initialize
    //     dashOffset = dashLen,
    //     // some arbitrary speed
    //     speed = 10,
    //     // the text we will draw
    //     txt = selectedWord,

    //     // start position for x and iterator
    //     x = 30, i = 0;

    //     // ctx.clear()

    //         // Comic Sans?? Let's make it useful for something ;) w/ fallbacks
    // ctx.font = "120px Comic Sans MS, cursive, TSCu_Comic, sans-serif"; 

    // // thickness of the line
    // ctx.lineWidth = 5; 

    // // to avoid spikes we can join each line with a round joint
    // ctx.lineJoin = "round";

    // // increase realism letting background (f.ex. paper) show through
    // ctx.globalAlpha = 2/3;

    // // some color, lets use a black pencil
    // ctx.strokeStyle = ctx.fillStyle = "#db0afa";

    // (function loop() {
    //   // clear canvas for each frame
    //   ctx.clearRect(x, 0, 1000, 150);

    //   // calculate and set current line-dash for this char
    //   ctx.setLineDash([dashLen - dashOffset, dashOffset - speed]);

    //   // reduce length of off-dash
    //   dashOffset -= speed;

    //   // draw char to canvas with current dash-length
    //   ctx.strokeText(txt[i], x, 90);
    //   ctx.fillText(txt[i], x, 90);

    //   // char done? no, the loop
    //   if (dashOffset > 0) requestAnimationFrame(loop);
    //   else {

    //     // ok, outline done, lets fill its interior before next
    //     // ctx.fillText(txt[i], x, 90);

    //     // reset line-dash length
    //     dashOffset = dashLen;

    //     // get x position to next char by measuring what we have drawn
    //     // notice we offset it a little by random to increase realism
    //     x += ctx.measureText(txt[i++]).width + ctx.lineWidth * Math.random();

    //     // lets use an absolute transform to randomize y-position a little
    //     ctx.setTransform(1, 0, 0, 1, 0, 3 * Math.random());

    //     // and just cause we can, rotate it a little too to make it even
    //     // more realistic
    //     ctx.rotate(Math.random() * 0.005);

    //     // if we still have chars left, loop animation again for this char
    //     if (i < txt.length) requestAnimationFrame(loop);
    //   }
    // })();  // just to self-invoke the loop



      $timeout(function(){
        $scope.selectedPowerWord = ""
        if(!$scope.$$phase) $scope.$apply();
        // $("canvas").html("<canvas class = 'h1cursive' width=640 height=100></canvas>")
        // ctx.clearRect(0, 0, 640, 150);
        pickPowerWord()
      }, 6000)
    }

    //Intercom integration for when users are not yet logged in.
    window.intercomSettings = {
      app_id: "daof2xrs"
    };

    $scope.joinNowClicked = function() {
      if (Auth.getCurrentUser()._id) {
        $state.go('discover')
      } else {
        analytics.track('wentToSignupFromMain')
        $cookies.put('loggedInPath', '/discover')
        $state.go('signup', {step: 0, mode: 'signup'})
      }
    }

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
            // console.log($scope.studios)
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
      Intercom('trackEvent', 'wentToLoginFromMain');
      analytics.track('wentToLoginFromMain')
      $state.go('signup', {step: 0, mode: 'login'})
      // $window.location.href = '/auth/' + provider;
    };

    $scope.scrollDown = function() {
      document.getElementById('scroll-link').scrollIntoView()
    }

    $scope.signUp = function() {
      Intercom('trackEvent', 'wentToSignupFromMain');
      analytics.track('wentToSignupFromMain')
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