'use strict';

angular.module('bodyAppApp')
  .controller('CreateStudioCtrl', function ($scope, $location, Auth) {
  	var currentUser = Auth.getCurrentUser();
  	var ref = new Firebase("https://bodyapp.firebaseio.com/");
  	$scope.createStudio = function(studioToCreate) {
  		if (currentUser.$$state) delete currentUser.$$state;
  		if (currentUser.$promise) delete currentUser.$promise;
  		if (currentUser.$resolved) delete currentUser.$resolved;
  		
  		var studioId = studioToCreate.studioId;
  		studioId = studioId.replace(/[^a-zA-Z0-9_-]/g,'').toLowerCase() //Gets rid of all special characters and spaces, but allows dash and underscore

  		if (!studioToCreate) return;
  		ref.child('studios').child(studioId).child('storefrontInfo').once('value', function(snapshot) {
  			if (snapshot.exists()) {
  				$scope.invalidId = true;
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
  					ref.child('studios').child(studioId).child('admins').child(currentUser._id).update({'isInstructor': true}, function(err) {
  						if (err) return console.log(err);
  						console.log("Set current user "+ currentUser._id + " as admin of " + studioId)
	  					ref.child('studios').child(studioId).child('instructors').child(currentUser._id).update(currentUser, function(err) {
	  						if (err) return console.log(err);
	  						console.log("Saved current user "+ currentUser._id + " as instructor of " + studioId)
	  						$location.path('/studios/' + studioId + '/storefrontInfo');
	  					})
  					})
  				})
  			}
  		})
  	}
  	// $window.open("https://getbody.wufoo.com/forms/zd3urqw0x6csn6/")
  	// $location.path("/")
  });