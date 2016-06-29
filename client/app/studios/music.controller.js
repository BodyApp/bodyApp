'use strict';

angular.module('bodyAppApp')
  .controller('MusicCtrl', function ($scope, $stateParams, $window, $state, $rootScope, Studios, Auth, SoundCloudLogin, SoundCloudAPI) {
  	var currentUser = Auth.getCurrentUser()
    var studioId = $stateParams.studioId;
    
    $rootScope.adminOf = $rootScope.adminOf || {};
    if (currentUser.$promise) {
      currentUser.$promise.then(function(data) {
        if (!$rootScope.adminOf[studioId] && data.role != 'admin') return $state.go('storefront', { "studioId": studioId });
      })
    } else if (currentUser.role) {
      if (!$rootScope.adminOf[studioId] && currentUser.role != 'admin') return $state.go('storefront', { "studioId": studioId });
    }

    // if (!studioId) studioId = 'body'
    Intercom('trackEvent', 'navigatedToMusic', { studio: studioId });
    Studios.setCurrentStudio(studioId);
    var ref = firebase.database().ref().child('studios').child(studioId);
    var auth = firebase.auth();
    auth.onAuthStateChanged(function(user) {
      if (user) {
        getPlaylists();
      } else {
        if (currentUser.firebaseToken) {
          auth.signInWithCustomToken(currentUser.firebaseToken).then(function(user) {
            if (currentUser.role === "admin") console.log("Firebase user authentication succeeded!", user);
            getPlaylists();
          }); 
        } else {
          console.log("User doesn't have a firebase token saved, should retrieve one.")
        }
      }
    })

    // ref.onAuth(function(authData) {
    //   if (authData) {
    //     // console.log("User is authenticated with fb ");
    //     getPlaylists()
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
    //           getPlaylists()
    //         }
    //       }); 
    //     } else {
    //       Auth.logout();
    //       $window.location.reload()
    //     }
    //   }
    // })

    function getPlaylists() {
	    ref.child('playlists').orderByChild("lastModified").on('value', function(snapshot) {
        $scope.loaded = true;
        if (!snapshot.exists()) {
          $scope.playlists = false;
          if(!$scope.$$phase) $scope.$apply();
        }
	    	$scope.playlists = [];
	      snapshot.forEach(function(playlist) {
	        $scope.playlists.unshift(playlist.val())
          if(!$scope.$$phase) $scope.$apply();
	        // $scope.workoutToCreate.playlistUrl = $scope.playlists[0];
	      })
	    })
    }

    $scope.soundcloudAuth = function() {
    	console.log("Soundcloud auth clicked")
      SoundCloudLogin.connect().then(function(token) {
        SoundCloudAPI.me().then(function(myInfo) {
          SoundCloudAPI.myPlaylists().then(function(playlists) {
            for (var i = 0; i < playlists.length; i++) {
              console.log(playlists[i])
              ref.child("playlists").child(playlists[i].id).update({
              	savedBy: currentUser._id,
              	savedByPicture: currentUser.picture,
                soundcloudUrl: playlists[i].uri,
                duration: playlists[i].duration,
                id: playlists[i].id,
                lastModified: new Date(playlists[i].last_modified),
                title: playlists[i].title,
                trackCount: playlists[i].track_count,
                tracks: playlists[i].tracks,
                // secretUri: playlists[i].secret_uri,
                sharing: playlists[i].sharing,
                user_id: playlists[i].user_id
              }, function(err){
                if (err) return console.log(err)
                console.log("Playlists updated")
                ref.child('toSetup').child('playlists').remove(function(err) {
                  if (err) console.log(err)
                })
              })
            }
            // $scope.playlists = playlists;
            // $scope.playlists.push(defaultPlaylist);
            // $scope.workoutToCreate.playlistUrl = $scope.playlists[0];
          })
        })
      })
    }  

    $scope.roundToMinute = function(num) {
    	return Math.round(num);
    }

  });