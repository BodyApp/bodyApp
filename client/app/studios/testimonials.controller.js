angular.module('bodyAppApp')
  .controller('TestimonialsCtrl', function ($scope, $stateParams, $state, Studios, Auth) {
    var currentUser = Auth.getCurrentUser()
    var studioId = $stateParams.studioId;
    $scope.studioId = studioId;    
    
    Studios.setCurrentStudio(studioId)
    .then(function(){
      console.log("Succeeded")
      delayedStartup()
    }, function(){
      console.log("Failed")
      // if (!currentUser.role === 'admin') return $state.go('storefront', { "studioId": studioId });  
      if (currentUser.$promise) {
        currentUser.$promise.then(function(data) {
          if (data.role != 'admin') return $state.go('storefront', { "studioId": studioId });
          if (data.role === 'admin') return delayedStartup()
        })
      } else if (currentUser.role) {
        if (currentUser.role != 'admin') return $state.go('storefront', { "studioId": studioId });
        if (currentUser.role === 'admin') return delayedStartup()
      }
    })

    var ref = firebase.database().ref().child('studios').child(studioId);
    var auth = firebase.auth();

    function delayedStartup() {
      Intercom('trackEvent', 'navigatedToTestimonials', { studio: studioId });
      auth.onAuthStateChanged(function(user) {
        if (user) {
        	getTestimonials()
        } else {
          // console.log("User is logged out");
          if (currentUser.firebaseToken) {
            auth.signInWithCustomToken(currentUser.firebaseToken).then(function(user) {
              if (currentUser.role === "admin") console.log("Firebase user authentication succeeded!", user);
              getTestimonials()
            }); 
          } else {
            console.log("User doesn't have a firebase token saved, should retrieve one.")
          }
        }
      })
    }

    function getTestimonials() {
      ref.child('testimonials').on('value', function(snapshot) {
      	$scope.loaded = true;
      	if(!$scope.$$phase) $scope.$apply();
        if (!snapshot.exists()) return;
        $scope.testimonials = snapshot.val()
        if(!$scope.$$phase) $scope.$apply();
      })
    }

    $scope.saveTestimonial = function(testimonial) {
      var testimonialRef = ref.child('testimonials').push(testimonial, function(err) {
      	if (err) return console.log(err)
      	ref.child('testimonials').child(testimonialRef.key).update({id: testimonialRef.key}, function(err) {
      		if (err) return console.log(err)
    			$scope.addEditObject = false;
	    		if(!$scope.$$phase) $scope.$apply();
      	})
    		Intercom('trackEvent', 'addedNewTestimonial', testimonial);
      })
    }

    $scope.editTestimonial = function(testimonial) {
    	$scope.addEditObject = testimonial; 
    	$scope.editing = true;
    	if(!$scope.$$phase) $scope.$apply();
    }

    $scope.updateTestimonial = function(testimonial) {
      var testimonialKey = ref.child('testimonials').child(testimonial.id).update(testimonial, function(err) {
      	if (err) return console.log(err)
    		Intercom('trackEvent', 'updatedTestimonial', testimonial);
    		$scope.addEditObject = false;
    		$scope.editing = false;
    		if(!$scope.$$phase) $scope.$apply();
      })
    }

    $scope.deleteTestimonial = function(testimonial) {
    	ref.child('testimonials').child(testimonial.id).remove(function(err) {
    		if (err) return console.log(err)
    	})
    }
  });
