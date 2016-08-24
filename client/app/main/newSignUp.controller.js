'use strict';

angular.module('bodyAppApp')
  .controller('NewSignupCtrl', function ($scope, $state, $cookies, $location, $window, $rootScope, Auth, User) {

    var ref = firebase.database().ref();
    var storageRef = firebase.storage().ref()
    var auth = firebase.auth();

    $scope.step = $state.params.step;
    $scope.mode = $state.params.mode;

  	var loggedInPath = '/'

    Intercom('trackEvent', 'navigatedToSignup');
    analytics.track('navigatedToSignup');

    if (Auth.getCurrentUser()) {
      if (Auth.getCurrentUser().$promise) {
        Auth.getCurrentUser().$promise.then(function(data) {
          var currentUser = data;
          auth.onAuthStateChanged(function(user) {
            if (user) {
              console.log("User is authenticated with fb ");
              //Do Stuff
            } else {
              console.log("User is logged out");
              if (currentUser.firebaseToken) {
                auth.signInWithCustomToken(currentUser.firebaseToken).then(function(user) {
                  if (currentUser.role === "admin") console.log("Firebase user authentication succeeded!", user);
                  //Do Stuff
                }); 
              } else {
                User.createFirebaseToken({ id: currentUser._id }, {}, function(token) {
                  auth.signInWithCustomToken(token).then(function(user) {
                    if (currentUser.role === "admin") console.log("Firebase user authentication succeeded!", user);
                    //Do Stuff
                  }); 
                })
              }
            }
          })
        })
      } else {
        var currentUser = Auth.getCurrentUser();
        auth.onAuthStateChanged(function(user) {
          if (user) {
            console.log("User is authenticated with fb ");
            //Do Stuff
          } else {
            console.log("User is logged out");
            if (currentUser.firebaseToken) {
              auth.signInWithCustomToken(currentUser.firebaseToken).then(function(user) {
                if (currentUser.role === "admin") console.log("Firebase user authentication succeeded!", user);
                //Do Stuff
              }); 
            } else {
              User.createFirebaseToken({ id: currentUser._id }, {}, function(token) {
                auth.signInWithCustomToken(token).then(function(user) {
                  if (currentUser.role === "admin") console.log("Firebase user authentication succeeded!", user);
                  //Do Stuff
                }); 
              })
            }
          }
        })
      }
    }



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
        analytics.track('updatedEmail', {email: $scope.userEmail});
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
          Intercom('trackEvent', 'setEmergencyContact');
          analytics.track('setEmergencyContact');
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
              Intercom('update', {sentWelcomeEmail: true})
              Intercom('trackEvent', 'sentWelcomeEmail');
              analytics.track('sentWelcomeEmail')
              console.log("Sent welcome email since first time logging in.")
            }, function(err) {
              console.log("Error: " + err)
          })  

          $scope.userEmail = Auth.getCurrentUser().email
          $scope.userPicture = Auth.getCurrentUser().picture
          $scope.step = 1;
          if(!$scope.$$phase) $scope.$apply();
          var referredBy = $cookies.get('referredBy');
          console.log(referredBy)
          $cookies.remove('referredBy');
          if (referredBy) {
            ref.child('referrals').child(referredBy).child(Auth.getCurrentUser()._id).update({
              dateReferred: new Date().getTime(),
              firstName: Auth.getCurrentUser().firstName,
              facebookId: Auth.getCurrentUser().facebookId,
              lastName: Auth.getCurrentUser().lastName,
              mongoId: Auth.getCurrentUser()._id
            }, function(err) {
              if (err) return console.log(err)
              console.log('referral code saved')
              User.referredBy({ id: Auth.getCurrentUser._id }, {
                referredBy: referredBy
              }, function(user) {
                Intercom('update', {
                  "referredBy": referredBy
                });
                analytics.track("wasReferredByUser", {referredBy: referredBy})
              }, function(err) {
                  console.log(err)
              }).$promise
            })
            
          }
        }
        
        //Segment.io
        analytics.identify(Auth.getCurrentUser()._id, {
          firstName: Auth.getCurrentUser().firstName,
          lastName: Auth.getCurrentUser().lastName,
          email: Auth.getCurrentUser().email,
          facebookId: Auth.getCurrentUser().facebookId,
          referredBy: Auth.getCurrentUser().referredBy
        }, function() {

        })
      }
    });
  });