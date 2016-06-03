'use strict';

angular.module('bodyAppApp')
  .controller('CreateStudioCtrl', function ($scope, $location, $timeout, $rootScope, Auth, Studios, User) {
  	var currentUser = Auth.getCurrentUser();
    var ref = firebase.database().ref();

  	$scope.sanitizeUrl = function(currentUrl) {
  		return currentUrl.replace(/[^a-zA-Z0-9_-]/g,'').toLowerCase()
  	}

  	$scope.keyPressed = function(key, studioToCreate) {
      if (key.keyCode === 13) $scope.createStudio(studioToCreate);
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
          'name': studioToCreate.name
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
					Studios.setCurrentStudio(studioId);
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
  	// $window.open("https://getbody.wufoo.com/forms/zd3urqw0x6csn6/")
  	// $location.path("/")
  });