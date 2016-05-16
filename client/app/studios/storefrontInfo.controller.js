'use strict';

angular.module('bodyAppApp')
  .controller('StorefrontInfoCtrl', function ($scope, $stateParams, Studios, $http, Auth) {
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
        getStorefrontInfo();
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
              getStorefrontInfo();
            }
          }); 
        } else {
          Auth.logout();
          $window.location.reload()
        }
      }
    })

    function getStorefrontInfo() {
      ref.child('storefrontInfo').on('value', function(snapshot) {
        $scope.storefrontInfo = snapshot.val();
        if(!$scope.$$phase) $scope.$apply();
      })  
    }

    $scope.saveStorefrontInfo = function(storefrontInfo) {
    	ref.child('storefrontInfo').update(storefrontInfo, function(err) {
    		if (err) return console.log(err)
    		console.log("Saved storefront info.")
    	})
    }

    $scope.scrollTop = function() {
      window.scrollTo(0, 0);
    }

  });