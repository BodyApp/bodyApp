'use strict';

angular.module('bodyAppApp')
  .controller('NewSignupCtrl', function ($scope, $state, $cookies, $location, $window, $rootScope, Auth, User) {

    var ref = firebase.database().ref();
    var storageRef = firebase.storage().ref()

    $scope.step = $state.params.step;
    $scope.mode = $state.params.mode;

    console.log($scope.step)

  	var loggedInPath = '/'

    Intercom('trackEvent', 'navigatedToSignup');

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
      if (!$scope.userEmail || $scope.userEmail.length < 4) return $scope.invalidEmail = true;
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
      if (!$scope.emergencyPhone) alert("Need to enter an emergency contact.")
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
          $location.replace()
          if(!$scope.$$phase) $scope.$apply();
        } else {
          User.sendWelcomeEmail({ id: Auth.getCurrentUser()._id }, {
            }, function(user) {
              console.log("Sent welcome email since first time logging in.")
            }, function(err) {
              console.log("Error: " + err)
          })  

        	$scope.userEmail = Auth.getCurrentUser().email
        	$scope.userPicture = Auth.getCurrentUser().picture
	        $scope.step = 1;
          if(!$scope.$$phase) $scope.$apply();
        }
      }
    });
  });