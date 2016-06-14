'use strict';

angular.module('bodyAppApp')
  .controller('NewSignupCtrl', function ($scope, $state, $cookies, $location, $window, Auth, User) {

    var ref = firebase.database().ref();
    var storageRef = firebase.storage().ref()

    $scope.step = $state.params.step;
    $scope.mode = $state.params.mode;

  	var loggedInPath = '/'

    $scope.getBackgroundImages = function() {
      storageRef.child('signupImages').getDownloadURL().then(function(urls) {
        // $scope.headerUrl = url;
        $scope.backgroundImages = urls
        if(!$scope.$$phase) $scope.$apply();
      }).catch(function(error) {
        console.log(error)
      });
    }

    $scope.loginOauth = function(provider) {
      $window.location.href = '/auth/' + provider;
    };

    $scope.updateEmail = function() {
    	User.saveEmailAddress({id: Auth.getCurrentUser()._id}, {email: $scope.userEmail}, function(user){
        console.log("Email successfully updated in mongo.")
        ref.child('fbUsers').child(Auth.getCurrentUser().facebookId).update({'email': $scope.userEmail}, function(err) {
        	if (err) return console.log(err)
        	console.log("Email successfully updated in firebase.")
        	$scope.step = 3;
	        if(!$scope.$$phase) $scope.$apply();
	        Intercom('update', { "email": $scope.userEmail });
        })
      })
    }

    $scope.saveEmergencyContactInfo = function() {
    	var emergencyContact = {fullName: $scope.emergencyName, emergencyPhone: $scope.emergencyPhone, emergencyRelationship: $scope.emergencyRelationship}
    	console.log(emergencyContact)
    	User.saveEmergency({id: Auth.getCurrentUser()._id}, {emergencyContact: emergencyContact}).$promise.then(function(user) {
    		console.log("Emergency info saved in mongo.")
    		ref.child('fbUsers').child(Auth.getCurrentUser().facebookId).update({'emergencyContact': emergencyContact}, function(err) {
    			console.log("Emergency info saved in firebase.")
					if (err) return console.log(err)
	      	Intercom('update', { "emergencyContactPhone": emergencyContact.emergencyPhone, "emergencyName": emergencyContact.fullName });
	      	$scope.step = 4;   
	        if(!$scope.$$phase) $scope.$apply();
	      })
			})
    };

    $scope.routeToLoggedInPath = function() {
    	$location.path(loggedInPath)
    }

    $scope.userClickedOutside = function() {
    	if ($scope.step < 1) $location.path(loggedInPath)	
    }

    Auth.isLoggedInAsync(function(loggedIn) {
    	loggedInPath = $cookies.get('loggedInPath')
      if (loggedIn) {
        if (Auth.getCurrentUser().emergencyContact && Auth.getCurrentUser().email) {
          $location.path(loggedInPath)
        } else {
        	$scope.userEmail = Auth.getCurrentUser().email
        	$scope.userPicture = Auth.getCurrentUser().picture
          $scope.step = 1;
	        if(!$scope.$$phase) $scope.$apply();
        }
      }
    });
  });