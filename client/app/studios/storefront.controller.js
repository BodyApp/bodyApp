'use strict';

angular.module('bodyAppApp')
  .controller('StorefrontCtrl', function ($scope, $stateParams, $sce, Studios, Auth) {
  	var currentUser = Auth.getCurrentUser()
    var ref;
    var studioId = $stateParams.studioId;
    $scope.classToCreate = {};
    Studios.setCurrentStudio(studioId);
    if (studioId) {
      ref = new Firebase("https://bodyapp.firebaseio.com/studios").child(studioId);
    } else {
      // $location.path('/ralabala/admin')
      ref = new Firebase("https://bodyapp.firebaseio.com/studios").child("ralabala");
    }   

    ref.onAuth(function(authData) {
      if (authData) {
        console.log("User is authenticated with fb ");
        getClasses(0, 7);
        getStorefrontInfo();
        getInstructors();
      } else {
        console.log("User is logged out");
        if (currentUser.firebaseToken) {
          ref.authWithCustomToken(currentUser.firebaseToken, function(error, authData) {
            if (error) {
              Auth.logout();
              $window.location.reload()
              console.log("Firebase currentUser authentication failed", error);
            } else {
              if (currentUser.role === "admin") console.log("Firebase currentUser authentication succeeded!", authData);
              getClasses(0);
              getStorefrontInfo();
              getInstructors();
            }
          }); 
        } else {
          Auth.logout();
          $window.location.reload()
        }
      }
    })

    function getStorefrontInfo() {
      ref.child('storefrontInfo').once('value', function(snapshot) {
        $scope.storefrontInfo = snapshot.val();
        $scope.youtubeLink = $sce.trustAsResourceUrl('https://www.youtube.com/embed/'+$scope.storefrontInfo.youtubeId+'?rel=0&amp;showinfo=0');
        if(!$scope.$$phase) $scope.$apply();
      })
    }

    function getInstructors() {
      ref.child('instructors').once('value', function(snapshot) {
        $scope.instructors = snapshot.val();
        $scope.numOfInstructors = Object.keys(snapshot.val()).length
        if(!$scope.$$phase) $scope.$apply();
      })
    }

    function getClasses(daysInFuture, numDaysToShow) {
      var startAt = new Date().getTime() - 1*60*60*1000 //Can see classes that started an hour ago
      startAt = (startAt*1 + daysInFuture*24*60*60*1000).toString()
      var numberOfDaysToDisplay = numDaysToShow;
      var toAdd = numberOfDaysToDisplay * 24 * 60 * 60 * 1000
      var endAt = (startAt*1 + toAdd + 1*60*60*1000).toString()

      ref.child('classes').orderByKey().startAt(startAt).endAt(endAt).on('value', function(snapshot) {
        $scope.classSchedule = snapshot.val();
        console.log("Pulled " + Object.keys($scope.classSchedule).length + " classes for schedule.")
        if(!$scope.$$phase) $scope.$apply();
      })
    }

  });