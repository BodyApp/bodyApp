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
    var storageRef = firebase.storage().ref().child('studios').child(studioId);
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
        snapshot.forEach(function(testimonial) {
        	getTestimonialPhoto(testimonial.val().id)
        })
      })
    }

    $scope.addStory = function() {
      window.scrollTo(0, 0);
      $scope.addEditObject = {};
    }

    $scope.saveTestimonial = function(testimonial, imageToSave) {
      var testimonialRef = ref.child('testimonials').push(testimonial, function(err) {
      	if (err) return console.log(err)
      	ref.child('testimonials').child(testimonialRef.key).update({id: testimonialRef.key}, function(err) {
      		if (err) return console.log(err)
    			$scope.addEditObject = false;
          uploadImage(testimonialRef.key, imageToSave)
          $scope.imageApi.removeAll()
	    		if(!$scope.$$phase) $scope.$apply();
      	})
    		Intercom('trackEvent', 'addedNewTestimonial', testimonial);
      })
    }

    $scope.editTestimonial = function(testimonial) {
    	$scope.addEditObject = testimonial; 
    	$scope.editing = true;
    	if(!$scope.$$phase) $scope.$apply();
      window.scrollTo(0, 0);
    }

    $scope.updateTestimonial = function(testimonial, imageToSave) {
      ref.child('testimonials').child(testimonial.id).update(testimonial, function(err) {
      	if (err) return console.log(err)
    		Intercom('trackEvent', 'updatedTestimonial', testimonial);
    		$scope.addEditObject = false;
    		$scope.editing = false;
        uploadImage(testimonial.id, imageToSave)
        $scope.imageApi.removeAll()
    		if(!$scope.$$phase) $scope.$apply();
      })
    }

    $scope.deleteTestimonial = function(testimonial) {
    	ref.child('testimonials').child(testimonial.id).remove(function(err) {
    		if (err) return console.log(err)
  			storageRef.child('images').child('testimonials').child(testimonial.id+".jpg").delete().then(function() {
  				console.log("Testimonial image deleted")
  			}).catch(function(err) {
  				console.log(err)
  			})
    	})
    }


    function getTestimonialPhoto(testimonialId) {
    	storageRef.child('images').child('testimonials').child(testimonialId+".jpg").getDownloadURL().then(function(url) {
        $scope.testimonialImages = $scope.testimonialImages || {};
        $scope.testimonialImages[testimonialId] = url;
        if(!$scope.$$phase) $scope.$apply();
      }).catch(function(error) {
        console.log(error)
      });
    }

  	function uploadImage(testimonialId, imageToSave) {
  // $scope.$watch('headerImage.length',function(newVal,oldVal){
    $scope.testimonialImages = $scope.testimonialImages || {};
    $scope.testimonialImages[testimonialId] = "https://d13yacurqjgara.cloudfront.net/users/82092/screenshots/1073359/spinner.gif";
    if(!$scope.$$phase) $scope.$apply();

    angular.forEach(imageToSave,function(obj){
  //     // console.log(obj.lfFile)
      var uploadTask = storageRef.child('images').child('testimonials').child(testimonialId+".jpg").put(obj.lfFile);

      uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, function(snapshot) {
        // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
        var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log('Upload is ' + progress + '% done');
        switch (snapshot.state) {
          case firebase.storage.TaskState.PAUSED: // or 'paused'
            console.log('Upload is paused');
            break;
          case firebase.storage.TaskState.RUNNING: // or 'running'
            console.log('Upload is running');
            break;
        }
      }, function(error) {
        switch (error.code) {
          case 'storage/unauthorized':
          console.log("User doesn't have permission to access the object");
            // User doesn't have permission to access the object
            break;

          case 'storage/canceled':
          console.log("User canceled the upload");
            // User canceled the upload
            break;

          case 'storage/unknown':
          console.log("Unkown error occured");
          console.log(error.serverResponse);
            // Unknown error occurred, inspect error.serverResponse
            break;
        }
      }, function() {
        // Upload completed successfully, now we can get the download URL
        $scope.testimonialImages[testimonialId] = uploadTask.snapshot.downloadURL;
        if(!$scope.$$phase) $scope.$apply();
        Intercom('trackEvent', "uploadedTestimonialImage", {testimonialId: testimonialId})

      });
      // });
	  });

		}
	});
