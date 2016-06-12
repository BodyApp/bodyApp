'use strict';

angular.module('bodyAppApp')
  .controller('CreateStudioCtrl', function ($scope, $location, $timeout, $rootScope, $window, $sce, $uibModal, Auth, Studios, User) {
  	var currentUser = Auth.getCurrentUser();
    var ref = firebase.database().ref();
    var storageRef = firebase.storage().ref();

    $scope.step = 0;
    getAssets();


  	$scope.sanitizeUrl = function(currentUrl) {
  		return currentUrl.replace(/[^a-zA-Z0-9_-]/g,'').toLowerCase()
  	}

  	$scope.keyPressed = function(key, idToCheck) {
      if (key.keyCode === 13) $scope.checkId(idToCheck);
    }

    $scope.checkId = function(idToCheck) {
      ref.child('studios').child(idToCheck).child('storefrontInfo').once('value', function(snapshot) {
        if (snapshot.exists()) {
          $scope.takenId = true;
          console.log('ID taken')
        } else {
          $scope.idSaved = true;
        }
        if(!$scope.$$phase) $scope.$apply();
      })
    }

    $scope.beginStudioCreation = function() {
      if (currentUser._id) {
        $scope.creationStarted = true
      } else {
        var modalInstance = $uibModal.open({
          animation: true,
          templateUrl: 'app/account/signup/signup.html',
          controller: 'SignupCtrl',
          windowClass: "modal-tall"
        });
      }
    }

    function loginOauth(provider) {
      $window.location.href = '/auth/' + provider + '/createstudio';
    };

  	$scope.createStudio = function(studioToCreate) {
  		if (currentUser.$$state) delete currentUser.$$state;
  		if (currentUser.$promise) delete currentUser.$promise;
  		if (currentUser.$resolved) delete currentUser.$resolved;
  		
  		var studioId = studioToCreate.studioId;
  		studioId = studioId.replace(/[^a-zA-Z0-9_-]/g,'').toLowerCase() //Gets rid of all special characters and spaces, but allows dash and underscore

  		if (!studioToCreate) return;
  		if (studioId.length < 4) return $scope.invalidId = true;
  		ref.child('studios').child(studioId).child('storefrontInfo').once('value', function(snapshot) {
				var ownerName = currentUser.firstName + " " + currentUser.lastName;
				ref.child('studios').child(studioId).child('storefrontInfo').set({
					'studioId':studioId, 
					'ownerName': ownerName,
          'studioName': studioToCreate.studioName,
          'dateCreated': new Date().getTime()
				}, function(err) {
					if (err) return console.log(err);
					console.log("Successfully created studio with ID " + studioId + " and set owner as " + ownerName)
          var storageRef = firebase.storage().ref().child('studios').child(studioId);
          angular.forEach($scope.iconImage,function(obj){
            var uploadTask = storageRef.child('images/icon.jpg').put(obj.lfFile);
          })
          angular.forEach($scope.headerImage,function(obj){
            var uploadTask = storageRef.child('images/header.jpg').put(obj.lfFile);
          })
          $scope.basicsComplete = true;
          $scope.step++;
          if(!$scope.$$phase) $scope.$apply();
					Studios.setCurrentStudio(studioId);

          ref.child('studios').child(studioId).child("toSetup").update({
            "classTypes": true, 
            "instructors": true, 
            "playlists": true, 
            "pricing": true, 
            "storefrontAlert": true, 
            "workouts": true
          }, function(err) {if (err) console.log(err)})
					
          ref.child('studios').child(studioId).child('admins').child(currentUser._id).update({'isInstructor': true}, function(err) {
						if (err) return console.log(err);
						console.log("Set current user "+ currentUser._id + " as admin of " + studioId)
						User.getInstructorByEmail({
			        id: currentUser._id
			      }, {
			        email: currentUser.email
			      }).$promise.then(function(instructor) {
			        if (instructor._id) {
                if (instructor.$promise) delete instructor.$promise;
                if (instructor.$resolved) delete instructor.$resolved;
			          ref.child('studios').child(studioId).child('instructors').child(instructor._id).update(instructor, function(err) {
		  						if (err) return console.log(err);
		  						console.log("Saved current user "+ currentUser._id + " as instructor of " + studioId)
		  						// $rootScope.$apply(function() {
		  						// 	return $location.path('/studios/' + studioId + '/storefrontinfo');	
						    //   });
		  					})
			        } else {
			          console.log("Couldn't pull instructor profile.")
			        }
			      })
  					
					})
				})
  		})
  	}

    $scope.goToStep = function(step) {
      if ($scope.basicsComplete) $scope.step = step;
    }

    //Add billing controller
    $scope.beginStripeConnect = function() {
      $window.location.href = '/auth/stripe?studioid=' + $scope.studioToCreate.studioId;
      // var retrievedInfo = $http.get('https://connect.stripe.com/oauth/authorize?response_type=code&client_id=ca_8NvwFunaEsSeZJ56Ez9yb1XhXaDR00bE&scope=read_write')
      // $location.path('https://connect.stripe.com/oauth/authorize?response_type=code&client_id=ca_8NvwFunaEsSeZJ56Ez9yb1XhXaDR00bE&scope=read_write')
    }

    $scope.setDescription = function(studioToCreate) {
      ref.child('studios').child(studioToCreate.studioId).child('storefrontInfo').update({
        'shortDescription': studioToCreate.shortDescription,
        'longDescription': studioToCreate.longDescription,
        'categories': studioToCreate.categories
      }, function(err) {
        if (err) return console.log(err)
        $scope.step++;
        $scope.descriptionComplete = true;
      })
    }

    function getAssets() {
      ref.child('studios').child('ralabala').child('storefrontInfo').once('value', function(snapshot) {
        $scope.storefrontInfo = snapshot.val();      
        // $scope.youtubeLink = $sce.trustAsResourceUrl('https://www.youtube.com/embed/'+$scope.storefrontInfo.youtubeId+'?rel=0&amp;showinfo=0');
      })
      
      storageRef.child('studios').child('body').child('images/header.jpg').getDownloadURL().then(function(url) {
        // $scope.headerUrl = url;
        $scope.backgroundImageUrl = url
        if(!$scope.$$phase) $scope.$apply();
      }).catch(function(error) {
        console.log(error)
      });
    }

    $scope.playYoutubeVideo = function() {
      $("#youtubeVideo")[0].src = $sce.trustAsResourceUrl('https://www.youtube.com/embed/'+$scope.storefrontInfo.youtubeId+'?rel=0&amp;showinfo=0&autoplay=1');
      // $scope.youtubeLink + '&autoplay=1';
      $scope.showVideoPlayer = true;
      $scope.hidePlayer = false;
      if(!$scope.$$phase) $scope.$apply();
    }

    $scope.stopPlayingVideo = function() {
      $("#youtubeVideo")[0].src = $sce.trustAsResourceUrl('https://www.youtube.com/embed/'+$scope.storefrontInfo.youtubeId+'?rel=0&amp;showinfo=0&autoplay=0');
      // $('#youtubeVideo').attr('src', $sce.trustAsResourceUrl('https://www.youtube.com/embed/'+$scope.storefrontInfo.youtubeId+'?rel=0&amp;showinfo=0&autoplay'));
      // $("#youtubeVideo")[0].src = $scope.youtubeLink;
      $scope.showVideoPlayer = false;
      $scope.hidePlayer = true;
      if(!$scope.$$phase) $scope.$apply();
    }
  	// $window.open("https://getbody.wufoo.com/forms/zd3urqw0x6csn6/")
  	// $location.path("/")
  });