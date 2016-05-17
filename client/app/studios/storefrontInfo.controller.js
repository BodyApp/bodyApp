'use strict';

angular.module('bodyAppApp')
  .controller('StorefrontInfoCtrl', function ($scope, $stateParams, $window, $state, Studios, $http, Auth) {
    var currentUser = Auth.getCurrentUser()
    if (currentUser.$promise) {
      currentUser.$promise.then(function(data) {
        if (!Studios.isAdmin() && data.role != 'admin') $state.go('storefront');  
      })
    } else if (currentUser.role) {
      if (!Studios.isAdmin() && currentUser.role != 'admin') $state.go('storefront');  
    }
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

    $scope.$watch('files.length',function(newVal,oldVal){
      var formData = new FormData();
      angular.forEach($scope.files,function(obj){
          formData.append('files[]', obj.lfFile);
      });
      console.log(formData)
      // $http.post('./upload', formData, {
      //     transformRequest: angular.identity,
      //     headers: {'Content-Type': undefined}
      // }).then(function(result){
          // do sometingh                   
      // },function(err){
          // do sometingh
      // });
    });

    function getStorefrontInfo() {
      ref.child('storefrontInfo').on('value', function(snapshot) {
      	if (!snapshot.exists()) return;
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