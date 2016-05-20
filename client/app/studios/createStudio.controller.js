'use strict';

angular.module('bodyAppApp')
  .controller('CreateStudioCtrl', function ($scope, $location, $timeout, $rootScope, Auth, Studios) {
  	var currentUser = Auth.getCurrentUser();
  	var ref = new Firebase("https://bodyapp.firebaseio.com/");

  	$scope.sanitizeUrl = function(currentUrl) {
  		return currentUrl.replace(/[^a-zA-Z0-9_-]/g,'').toLowerCase()
  	}

  	$scope.keyPressed = function(key, studioToCreate) {
      if (key.keyCode === 13) $scope.createStudio(studioToCreate);
    }

  	$scope.createStudio = function(studioToCreate) {
  		if (currentUser.$$state) delete currentUser.$$state;
  		if (currentUser.$promise) delete currentUser.$promise;
  		if (currentUser.$resolved) delete currentUser.$resolved;
  		
  		var studioId = studioToCreate.studioId;
  		studioId = studioId.replace(/[^a-zA-Z0-9_-]/g,'').toLowerCase() //Gets rid of all special characters and spaces, but allows dash and underscore

  		if (!studioToCreate) return;
  		if (studioId.length < 4) return $scope.invalidId = true;
  		ref.child('studios').child(studioId).child('storefrontInfo').once('value', function(snapshot) {
  			if (snapshot.exists()) {
  				$scope.takenId = true;
  				console.log('ID taken')
	        if(!$scope.$$phase) $scope.$apply();
  				return;
  			} else {
  				var ownerName = currentUser.firstName + " " + currentUser.lastName;
  				ref.child('studios').child(studioId).child('storefrontInfo').set({
  					'studioId':studioId, 
  					'ownerName': ownerName
  				}, function(err) {
  					if (err) return console.log(err);
  					console.log("Successfully created studio with ID " + studioId + " and set owner as " + ownerName)
  					Studios.setCurrentStudio(studioId);
  					ref.child('studios').child(studioId).child('admins').child(currentUser._id).update({'isInstructor': true}, function(err) {
  						if (err) return console.log(err);
  						console.log("Set current user "+ currentUser._id + " as admin of " + studioId)
	  					ref.child('studios').child(studioId).child('instructors').child(currentUser._id).update(currentUser, function(err) {
	  						if (err) return console.log(err);
	  						console.log("Saved current user "+ currentUser._id + " as instructor of " + studioId)
	  						$rootScope.$apply(function() {
	  							// $timeout(function() {
	  								return $location.path('/studios/' + studioId + '/storefrontinfo');	
	  							// }, 2000)
					      });
	  					})
  					})
  				})
  			}
  		})
  	}
  	// $window.open("https://getbody.wufoo.com/forms/zd3urqw0x6csn6/")
  	// $location.path("/")
  });