'use strict';

angular.module('bodyAppApp')
  .controller('CreateStudioCtrl', function ($scope, $location, $cookies, $timeout, $rootScope, $window, $sce, $uibModal, $state, Auth, Studios, User) {
  	var currentUser = Auth.getCurrentUser();
    var ref = firebase.database().ref();
    var storageRef = firebase.storage().ref();

    $scope.step = 0;
    // if (!Auth.getCurrentUser()) $cookies.remove('studioCreationStarted')
    if ($cookies.get('studioCreationStarted') && currentUser._id) {
      $scope.creationStarted = true;
      $cookies.remove('studioCreationStarted');
    }

    $scope.calcDuration = 'Yearly';
    $scope.subscriptionPrice = 30;
    $scope.numSubscribers = 250;
    calcTakeHome()

    getAssets();

    $scope.drop1 = false;
    $scope.drop2 = false;
    $scope.drop3 = false;
    $scope.drop4 = false;
    $scope.drop5 = false;
    $scope.drop6 = false
    $scope.drop7 = false;
    $scope.drop8 = false;
    $scope.drop9 = false;
    $scope.drop10 = false
    $scope.drop11 = false;
    $scope.drop12 = false;

    $scope.openNewMessage = function() {
      Intercom('showNewMessage', "I'm waiting for my class to start and have a question.");
    }

    function calcTakeHome() {
      $scope.subscriptionPrice
      $scope.numSubscribers

      if ($scope.subscriptionPrice > 0 && $scope.numSubscribers > 0) {
        var durationModifier;
        if ($scope.calcDuration === 'Monthly') durationModifier = 1
        if ($scope.calcDuration === 'Yearly') durationModifier = 12

        var grossRevenue = $scope.subscriptionPrice * $scope.numSubscribers * durationModifier
        $scope.grossRevenue = Math.round(grossRevenue, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        var bodyFee = grossRevenue * .17;
        $scope.bodyFee = Math.round(bodyFee, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        var processingFee = grossRevenue * .03
        $scope.processingFee = Math.round(processingFee, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        $scope.calculatedTakeHome = Math.round(grossRevenue - bodyFee - processingFee, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      }
    }

    $scope.calcTakeHome = function() {
      calcTakeHome()
    }

    $scope.switchCalcDuration = function() {
      if ($scope.calcDuration === 'Monthly') {
        $scope.calcDuration = 'Yearly'; 
        return $scope.calcTakeHome();
      }
      if ($scope.calcDuration === 'Yearly') {
        $scope.calcDuration = 'Monthly'; 
        return $scope.calcTakeHome();
      }
    }

  	$scope.sanitizeUrl = function(currentUrl) {
      if (currentUrl) return currentUrl.replace(/[^a-zA-Z0-9_-]/g,'').toLowerCase()
  	}

  	$scope.keyPressed = function(key, idToCheck) {
      if (key.keyCode === 13) $scope.checkId(idToCheck);
    }

    $scope.scrollTop = function() {
      // window.scrollTo(0, 0);
      $('.ss-content-container').scrollTop(0);
    }

    $scope.studioNameChanged = function() {
      if (!$scope.idEditedDirectly) {
        $scope.studioToCreate.studioId = $scope.sanitizeUrl($scope.studioToCreate.studioName)
      }
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
        // var modalInstance = $uibModal.open({
        //   animation: true,
        //   templateUrl: 'app/account/signup/signup.html',
        //   controller: 'SignupCtrl',
        //   windowClass: "modal-tall"
        // });
        $cookies.put('loggedInPath', $location.path())
        $cookies.put('studioCreationStarted', true)
        // $rootScope.loggedInPath = $location.path()
        $state.go('signup', {step: 0, mode: 'signup'})
      }
    }

    function loginOauth(provider) {
      $window.location.href = '/auth/' + provider + '/createstudio';
    };

  	$scope.createStudio = function(studioToCreate) {
      // if ($scope.creatingStudio) return
      // $scope.creatingStudio = true;
      if (!currentUser) $scope.beginStudioCreation();
  		if (currentUser.$$state) delete currentUser.$$state;
  		if (currentUser.$promise) delete currentUser.$promise;
  		if (currentUser.$resolved) delete currentUser.$resolved;

  		var studioId = studioToCreate.studioId;
  		studioId = studioId.replace(/[^a-zA-Z0-9_-]/g,'').toLowerCase() //Gets rid of all special characters and spaces, but allows dash and underscore

  		if (!studioToCreate) return;
  		// if (studioId.length < 4) return $scope.invalidId = true;
      $rootScope.adminOf = $rootScope.adminOf || {};
      $rootScope.adminOf[studioId] = true;
      if(!$scope.$$phase) $scope.$apply();
  		ref.child('studios').child(studioId).child('storefrontInfo').once('value', function(snapshot) {
        if (snapshot.exists()) {
          console.log('ID taken')
          return $scope.takenId = true;
        } else {
          $scope.idSaved = true;
        }
				var ownerName = currentUser.firstName + " " + currentUser.lastName;
				ref.child('studios').child(studioId).child('storefrontInfo').set({
					'studioId':studioId, 
					'ownerName': ownerName,
          'ownerEmail': currentUser.email,
          'ownerFbId': currentUser.facebookId,
          'studioName': studioToCreate.studioName,
          'dateCreated': new Date().getTime()
				}, function(err) {
					if (err) return console.log(err);
          // $scope.creatingStudio = false;
					console.log("Successfully created studio with ID " + studioId + " and set owner as " + ownerName)
          Intercom('update', {
            "createdStudio_at": Math.floor(new Date() / 1000),
            "studioOwnedId": studioId,
            "studioOwnedName": studioToCreate.studioName
          });

          $cookies.remove('studioCreationStarted');
          $cookies.put('showScheduleAlert', true)
          $cookies.put('showStorefrontInfoAlert', true)
          $cookies.put('showClassTypesAlert', true)
          $cookies.put('showPricingAlert', true)
          $cookies.put('showWorkoutsAlert', true)
          
          // var storageRef = firebase.storage().ref().child('studios').child(studioId);
          // angular.forEach($scope.iconImage,function(obj){
          //   var uploadTask = storageRef.child('images/icon.jpg').put(obj.lfFile);
          // })
          // angular.forEach($scope.headerImage,function(obj){
          //   var uploadTask = storageRef.child('images/header.jpg').put(obj.lfFile);
          // })
          
          $scope.basicsComplete = true;
          $scope.step++;
          
          if(!$scope.$$phase) $scope.$apply();

          var toSet = {};
          toSet[studioId] = true;
          ref.child('fbUsers').child(currentUser.facebookId).child('studiosAdmin').update(toSet, function(err) {
            if (err) console.log(err)
          })   

          createDefaultClassType(studioId);
          addDefaultPlaylist(studioId);     

          ref.child('studios').child(studioId).child("toSetup").update({
            "classTypes": true, 
            "instructors": true, 
            "playlists": true, 
            "pricing": true, 
            "storefrontAlert": true, 
            "workouts": true,
            "images": true
          }, function(err) {if (err) console.log(err)})
					
          ref.child('studios').child(studioId).child('admins').child(currentUser._id).update({'isInstructor': true}, function(err) {
						if (err) return console.log(err);
						console.log("Set current user "+ currentUser._id + " as admin of " + studioId)
            Studios.setCurrentStudio(studioId);
						// User.getInstructorByEmail({
			   //      id: currentUser._id
			   //    }, {
			   //      email: currentUser.email
			   //    }).$promise.then(function(instructor) {
			        if (currentUser._id) {
                if (currentUser.$promise) delete currentUser.$promise;
                if (currentUser.$resolved) delete currentUser.$resolved;
			          ref.child('studios').child(studioId).child('instructors').child(currentUser._id).update({
                   "_id": currentUser._id,
                   "facebookId": currentUser.facebookId,
                   "firstName": currentUser.firstName,
                   "gender": currentUser.gender,
                   "lastName": currentUser.lastName,
                   "nickName": currentUser.nickName,
                   "permissions": "Studio Admin",
                   "picture": currentUser.picture,
                   "trainerNumRatings": 0,
                   "trainerRating": 5
                }, function(err) {
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
  					
					// })
				})
  		})
  	}

    function createDefaultClassType(studioId) {
      var classToSave = {};
      classToSave.name = "Trial Class"
      classToSave.classDescription = "Come try out a class at my studio!"
      classToSave.created = new Date().getTime();
      classToSave.updated = new Date().getTime();
      classToSave.createdBy = Auth.getCurrentUser()._id
      classToSave.classType = "Regular"

      var toPush = ref.child('studios').child(studioId).child("classTypes").push(classToSave, function(err) {
        if (err) return console.log(err);
        console.log("Default class successfully saved")
        ref.child('studios').child(studioId).child("classTypes").child(toPush.key).update({id: toPush.key}, function(err) {
          if (err) return console.log(err)
          createDefaultWorkout(studioId, toPush.key)
        })
      })
    }

    function createDefaultWorkout(studioId, defaultClassType) {
      var workoutToSave = {};
      workoutToSave.created = new Date().getTime();
      workoutToSave.updated = new Date().getTime();
      workoutToSave.createdBy = currentUser._id;

      workoutToSave.title = "Default workout";
      workoutToSave.id = "defaultWorkout";
      workoutToSave.classTypes = {};
      workoutToSave.classTypes[defaultClassType] = {dateSaved: new Date().getTime()}

      var savedWorkout = ref.child('studios').child(studioId).child('workouts').update({'defaultWorkout': workoutToSave}, function(err) {
        if (err) return console.log(err);
        console.log("Default workout successfully saved.")
        ref.child('studios').child(studioId).child('classTypes').child(defaultClassType).child('workoutsUsingClass').child('defaultWorkout').update({'dateSaved': new Date().getTime()}, function(err) {
          if (err) return console.log(err);
          console.log("Default workout successfully saved as a workout of Default class type.")
        })        
      })
    }

    function addDefaultPlaylist(studioId) {
      ref.child('defaultPlaylist').limitToFirst(1).once('value', function(snapshot) {
        snapshot.forEach(function(playlist) {
          ref.child('studios').child(studioId).child('playlists').child(playlist.val().id).update(playlist.val(), function(err) {
            if (err) return console.log(err);
            console.log("Default playlist successfully saved.")
          })
        })
      })
    }

    $scope.goToStep = function(step) {
      if ($scope.basicsComplete) $scope.step = step;
      $scope.scrollTop();
      $cookies.remove('studioCreationStarted');
      if(!$scope.$$phase) $scope.$apply();
    }

    //Add billing controller
    $scope.beginStripeConnect = function() {
      $cookies.remove('studioCreationStarted');
      $window.location.href = '/auth/stripe?studioid=' + $scope.studioToCreate.studioId;
      // var retrievedInfo = $http.get('https://connect.stripe.com/oauth/authorize?response_type=code&client_id=ca_8NvwFunaEsSeZJ56Ez9yb1XhXaDR00bE&scope=read_write')
      // $location.path('https://connect.stripe.com/oauth/authorize?response_type=code&client_id=ca_8NvwFunaEsSeZJ56Ez9yb1XhXaDR00bE&scope=read_write')
    }

    $scope.setDescription = function(studioToCreate) {
      $scope.triedSettingDescription = true;
      if(!$scope.$$phase) $scope.$apply();
      ref.child('studios').child(studioToCreate.studioId).child('storefrontInfo').update({
        'shortDescription': studioToCreate.shortDescription,
        'longDescription': studioToCreate.longDescription,
        'categories': studioToCreate.categories
      }, function(err) {
        
        if (err) return console.log(err)
        // $scope.step++;
        $location.path('/studios/' + studioToCreate.studioId + "/editschedule")
        $scope.descriptionComplete = true;
        if(!$scope.$$phase) $scope.$apply();
      })
    }

    function getAssets() {
      ref.child('studios').child('ralabala').child('storefrontInfo').once('value', function(snapshot) {
        $scope.storefrontInfo = snapshot.val();      
        // $scope.youtubeLink = $sce.trustAsResourceUrl('https://www.youtube.com/embed/'+$scope.storefrontInfo.youtubeId+'?rel=0&amp;showinfo=0');
      })
      
      // storageRef.child('studios').child('body').child('images/header.jpg').getDownloadURL().then(function(url) {
        // $scope.headerUrl = url;
        // $scope.backgroundImageUrl = url
        // if(!$scope.$$phase) $scope.$apply();
      // }).catch(function(error) {
        // console.log(error)
      // });
    }

    $scope.updateCategoryCount = function(category) {
      if ($scope.studioToCreate.categories[category] === false) delete $scope.studioToCreate.categories[category]
      $scope.categoriesSelected = Object.keys($scope.studioToCreate.categories).length
      if(!$scope.$$phase) $scope.$apply();
    }

    $scope.playYoutubeVideo = function() {
      $("#youtubeVideo")[0].src = $sce.trustAsResourceUrl('https://www.youtube.com/embed/pZtWOp-zxok?rel=0&amp;showinfo=0&autoplay=1');
      // $scope.youtubeLink + '&autoplay=1';
      $scope.showVideoPlayer = true;
      $scope.hidePlayer = false;
      if(!$scope.$$phase) $scope.$apply();
    }

    $scope.stopPlayingVideo = function() {
      $("#youtubeVideo")[0].src = $sce.trustAsResourceUrl('https://www.youtube.com/embed/pZtWOp-zxok?rel=0&amp;showinfo=0&autoplay=0');
      // $('#youtubeVideo').attr('src', $sce.trustAsResourceUrl('https://www.youtube.com/embed/'+$scope.storefrontInfo.youtubeId+'?rel=0&amp;showinfo=0&autoplay'));
      // $("#youtubeVideo")[0].src = $scope.youtubeLink;
      $scope.showVideoPlayer = false;
      $scope.hidePlayer = true;
      if(!$scope.$$phase) $scope.$apply();
    }
  	// $window.open("https://getbody.wufoo.com/forms/zd3urqw0x6csn6/")
  	// $location.path("/")
  });