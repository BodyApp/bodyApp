'use strict';

angular.module('bodyAppApp')
  .controller('StorefrontInfoCtrl', function ($scope, $stateParams, $window, $state, $mdToast, $timeout, Studios, $http, Auth) {
    var currentUser = Auth.getCurrentUser()
    
    var ref;
    var studioId = $stateParams.studioId;
    
    if (currentUser.$promise) {
      currentUser.$promise.then(function(data) {
        if (!Studios.isAdmin() && data.role != 'admin') $state.go('storefront', { "studioId": studioId });  
      })
    } else if (currentUser.role) {
      if (!Studios.isAdmin() && currentUser.role != 'admin') $state.go('storefront', { "studioId": studioId });  
    }

    if (!studioId) studioId = 'body'
    Studios.setCurrentStudio(studioId);
    var ref = firebase.database().ref().child('studios').child(studioId);
    var storageRef = firebase.storage().ref().child('studios').child(studioId);
    var auth = firebase.auth();
    auth.onAuthStateChanged(function(user) {
      if (user) {
        getStorefrontInfo();
        getImages();
        getToSetup();
      } else {
        if (currentUser.firebaseToken) {
          auth.signInWithCustomToken(currentUser.firebaseToken).then(function(user) {
            if (currentUser.role === "admin") console.log("Firebase user authentication succeeded!", user);
            getStorefrontInfo();
            getToSetup();
          }); 
        } else {
          console.log("User doesn't have a firebase token saved, should retrieve one.")
        }
      }
    })

    // ref.onAuth(function(authData) {
    //   if (authData) {
    //     // console.log("User is authenticated with fb ");
    //     getStorefrontInfo();
    //   } else {
    //     console.log("User is logged out");
    //     if (currentUser.firebaseToken) {
    //       ref.authWithCustomToken(currentUser.firebaseToken, function(error, authData) {
    //         if (error) {
    //           Auth.logout();
    //           $window.location.reload()
    //           console.log("Firebase currentUser authentication failed", error);
    //         } else {
    //           if (currentUser.role === "admin") console.log("Firebase currentUser authentication succeeded!", authData);
    //           getStorefrontInfo();
    //         }
    //       }); 
    //     } else {
    //       Auth.logout();
    //       $window.location.reload()
    //     }
    //   }
    // })

    function getImages() {
      storageRef.child('images/icon.jpg').getDownloadURL().then(function(url) {
        $scope.iconUrl = url;
        if(!$scope.$$phase) $scope.$apply();

        // Get the download URL for 'images/stars.jpg'
        // This can be inserted into an <img> tag
        // This can also be downloaded directly
      }).catch(function(error) {
        console.log(error)
        // Handle any errors
      });

      storageRef.child('images/header.jpg').getDownloadURL().then(function(url) {
        $scope.headerUrl = url;
        if(!$scope.$$phase) $scope.$apply();

        // Get the download URL for 'images/stars.jpg'
        // This can be inserted into an <img> tag
        // This can also be downloaded directly
      }).catch(function(error) {
        console.log(error)
        // Handle any errors
      });
    }

    
    $scope.$watch('headerImage.length',function(newVal,oldVal){

      angular.forEach($scope.headerImage,function(obj){
        // console.log(obj.lfFile)
        var uploadTask = storageRef.child('images/header.jpg').put(obj.lfFile);

        uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, // or 'state_changed'
          function(snapshot) {
            // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
            var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('Upload is ' + progress + '% done');
            switch (snapshot.state) {
              case firebase.storage.TaskState.PAUSED: // or 'paused'
                console.log('Upload is paused');
                break;
              case firebase.storage.TaskState.RUNNING: // or 'running'
                console.log('Upload is running');
                break;
            }
          }, function(error) {
          switch (error.code) {
            case 'storage/unauthorized':
            console.log("User doesn't have permission to access the object");
              // User doesn't have permission to access the object
              break;

            case 'storage/canceled':
            console.log("User canceled the upload");
              // User canceled the upload
              break;

            case 'storage/unknown':
            console.log("Unkown error occured");
            console.log(error.serverResponse);
              // Unknown error occurred, inspect error.serverResponse
              break;
          }
        }, function() {
          // Upload completed successfully, now we can get the download URL
          $scope.headerUrl = uploadTask.snapshot.downloadURL;
          if(!$scope.$$phase) $scope.$apply();

        });
        // formData.append('files[]', obj.lfFile);
          // console.log(formData)
      });
      // console.log(formData)
      // $http.post('./upload', formData, {
      //     transformRequest: angular.identity,
      //     headers: {'Content-Type': undefined}
      // }).then(function(result){
          // do sometingh                   
      // },function(err){
          // do sometingh
      // });
    });

    $scope.$watch('iconImage.length',function(newVal,oldVal){

      angular.forEach($scope.iconImage,function(obj){
        // console.log(obj.lfFile)
        var uploadTask = storageRef.child('images/icon.jpg').put(obj.lfFile);

        uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, // or 'state_changed'
          function(snapshot) {
            // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
            var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('Upload is ' + progress + '% done');
            switch (snapshot.state) {
              case firebase.storage.TaskState.PAUSED: // or 'paused'
                console.log('Upload is paused');
                break;
              case firebase.storage.TaskState.RUNNING: // or 'running'
                console.log('Upload is running');
                break;
            }
          }, function(error) {
          switch (error.code) {
            case 'storage/unauthorized':
            console.log("User doesn't have permission to access the object");
              // User doesn't have permission to access the object
              break;

            case 'storage/canceled':
            console.log("User canceled the upload");
              // User canceled the upload
              break;

            case 'storage/unknown':
            console.log("Unkown error occured");
            console.log(error.serverResponse);
              // Unknown error occurred, inspect error.serverResponse
              break;
          }
        }, function() {
          // Upload completed successfully, now we can get the download URL
          $scope.iconUrl = uploadTask.snapshot.downloadURL;
          if(!$scope.$$phase) $scope.$apply();

        });
        // formData.append('files[]', obj.lfFile);
          // console.log(formData)
      });
      // console.log(formData)
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
        console.log($scope.storefrontInfo)
        if(!$scope.$$phase) $scope.$apply();
      })  
    }

    function getToSetup() {
      ref.child('toSetup').once('value', function(snapshot) {
        if (!snapshot.exists()) return
        $scope.toSetup = snapshot.val();
        if(!$scope.$$phase) $scope.$apply();
        if ($scope.toSetup.storefrontAlert) {
          ref.child('toSetup').child('storefrontAlert').remove(function(err) {
            if (err) return console.log(err)
            delete $scope.toSetup.storefrontAlert
          })  
        }
      })
    }

    $scope.saveStorefrontInfo = function(storefrontInfo) {
    	ref.child('storefrontInfo').update(storefrontInfo, function(err) {
    		if (err) return console.log(err)
          if (!$scope.showingToast) {
            $scope.showingToast = true;
            $timeout(function() {
              $timeout(function(){$scope.showingToast = false}, 10000)  
              $mdToast.show(
                $mdToast.simple()
                  .textContent('Storefront information saved!')
                  .position('right')
                  .hideDelay(3000)
                  .parent('#toastContainer')
              );
            }, 1000)
          }
          
    		console.log("Saved storefront info.")
    	})
    }

   $scope.updateCategoryCount = function(category) {
      if ($scope.storefrontInfo.categories[category] === false) delete $scope.storefrontInfo.categories[category]
      $scope.categoriesSelected = Object.keys($scope.storefrontInfo.categories).length
      if(!$scope.$$phase) $scope.$apply();
      ref.child('storefrontInfo').update($scope.storefrontInfo, function(err) {
        if (err) return console.log(err)
        console.log("Saved storefront info.")
      })
    }

    $scope.scrollTop = function() {
      window.scrollTo(0, 0);
    }

  });