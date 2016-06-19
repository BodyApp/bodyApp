angular.module('bodyAppApp')
  .factory('Studios', function(Auth, $rootScope, $q) {
  	
  	var service = {};
  	service.currentStudio;
  	service.userHasClassNow = false;
  	service.classUserJustJoined;
  	service.totalRevenueByCustomer = {};

    service.classTypes;
    service.playlists;
    service.workouts;
    service.instructors;
    service.admin;
    service.instructor;

    var testingAdmin = false;
    var deferObject;

    // var ref = new Firebase("https://bodyapp.firebaseio.com/studios"); 
    var ref = firebase.database().ref().child('studios');
    // var fbObject;

    // service.isAdmin = function() {
      // console.log(service.admin)
      // return service.admin;
      // if (!service.admin && service.currentStudio) {
      //   console.log("yeah")
      //   ref.child(service.currentStudio).child('admins').child(Auth.getCurrentUser()._id).once('value', function(snapshot) {
      //     if (snapshot.exists()) {
      //       service.admin = true
      //       return true;
      //     } else {
      //       service.admin = false
      //       return false;
      //     }
      //   })
      // } else {
      //   console.log("here")
        // return service.admin;
      // }
    // }

    service.isInstructor = function() {
      // return service.admin;
      // if (!service.admin && service.currentStudio) {
      //   console.log("yeah")
      //   ref.child(service.currentStudio).child('admins').child(Auth.getCurrentUser()._id).once('value', function(snapshot) {
      //     if (snapshot.exists()) {
      //       service.admin = true
      //       return true;
      //     } else {
      //       service.admin = false
      //       return false;
      //     }
      //   })
      // } else {
      //   console.log("here")
        return service.instructor;
      // }
    }

    //This should have promise in it
    service.setCurrentStudio = function(studioId) {
      var currentUser = Auth.getCurrentUser();
      // $rootScope.adminOf = $rootScope.adminOf || {};
      deferObject =  deferObject || $q.defer();
      service.currentStudio = studioId
      
      if ($rootScope.adminOf && $rootScope.adminOf[studioId]) {
        deferObject.resolve(true);
      } else if (currentUser.$promise) {
        currentUser.$promise.then(function(data) {
          if (studioId && data._id && !testingAdmin) {        
            testingAdmin = true;
            ref.child(studioId).child('admins').child(data._id).once('value').then(function(snapshot) {
              if (snapshot.exists()) {
                $rootScope.adminOf = $rootScope.adminOf || {};
                $rootScope.adminOf[studioId] = true;
                console.log($rootScope.adminOf)
                testingAdmin = false;
                deferObject.resolve(true);
                // service.admin = true
              } else {
                testingAdmin = false;
                deferObject.reject(false);
                // service.admin = false
              }
            }, function(error) {
              deferObject.reject(error);
            })
          }
        })
      } else if (currentUser._id) {
        if (studioId && currentUser._id && !testingAdmin) {
          testingAdmin = true;
          ref.child(studioId).child('admins').child(currentUser._id).once('value').then(function(snapshot) {
            if (snapshot.exists()) {
              $rootScope.adminOf = $rootScope.adminOf || {};
              $rootScope.adminOf[studioId] = true;
              console.log($rootScope.adminOf)
              testingAdmin = false;
              deferObject.resolve(true);
              // service.admin = true
            } else {
              testingAdmin = false;
              deferObject.reject(false);
              // service.admin = false
            }
          }, function(error) {
            deferObject.reject(error);
          })
        } else {
          deferObject.reject("Couldn't get current user");
        }
      }

      // if (!$rootScope.adminOf[studioId] && studioId && currentUser._id && !testingAdmin) {
      //   testingAdmin = true;
      //   ref.child(studioId).child('admins').child(currentUser._id).once('value').then(function(snapshot) {
      //     if (snapshot.exists()) {
      //       $rootScope.adminOf = $rootScope.adminOf || {};
      //       $rootScope.adminOf[studioId] = true;
      //       console.log($rootScope.adminOf)
      //       testingAdmin = false;
      //       deferObject.resolve(true);
      //       // service.admin = true
      //     } else {
      //       testingAdmin = false;
      //       deferObject.reject(false);
      //       // service.admin = false
      //     }
      //   }, function(error) {
      //     deferObject.reject(error);
      //   })
      // } 

      return deferObject.promise;
      // if (!service.instructor && studioId && Auth.getCurrentUser()._id) {
      //   ref.child(studioId).child('instructors').child(Auth.getCurrentUser()._id).on('value', function(snapshot) {
      //     if (snapshot.exists()) {
      //       $rootScope.adminOf = $rootScope.adminOf || {};
      //       $rootScope.adminOf[studioId] = true;
      //       // service.instructor = true
      //     } else {
      //       $rootScope.adminOf = $rootScope.adminOf || {};
      //       $rootScope.adminOf[studioId] = false;
      //       // service.instructor = false
      //     }
      //   })
      // }
    }    

    service.getCurrentStudio = function() {
      return service.currentStudio;
    }    

    service.saveCustomerRevenue = function(customer, revenue) {
    	service.totalRevenueByCustomer[customer.id] = revenue;
    }

    service.getCustomerRevenue = function(customer) {
    	return service.totalRevenueByCustomer[customer.id];
    }

    service.saveClassTypes = function(classTypes) {
      service.classTypes = classTypes;
    }

    service.getClassTypes = function() {
      return service.classTypes;
    }

    service.savePlaylistObjects = function(playlists) {
      service.playlists = playlists;
    }

    service.getPlaylistObjects = function() {
      return service.playlists;
    }

    service.saveInstructors = function(instructors) {
      service.instructors = instructors;
    }

    service.getInstructors = function() {
      return service.instructors;
    }

    service.saveWorkouts = function(workouts) {
      service.workouts = workouts;
    }

    service.getWorkouts = function() {
      return service.workouts;
    }

  	return service
  })