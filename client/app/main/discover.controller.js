'use strict';

angular.module('bodyAppApp')
  .controller('DiscoverCtrl', function ($scope, $state, $mdDialog, Auth) {
    $scope.currentUser = Auth.getCurrentUser()
  	var ref = firebase.database().ref();
    var storageRef = firebase.storage().ref();
    $scope.studioPictures = {};
    $scope.classTypes = {};
    $scope.instructors = {};

    $scope.bookings = {};
    $scope.numBookings = {};

    var start = 0;
    var end = 7;

    getStudios(start, end);
    getDates();
    $scope.showAll = true;

    $scope.categoryFilter = $state.params.tag;
    Intercom('trackEvent', 'navigatedToDiscover');
    analytics.track('navigatedToDiscover');

    $scope.classesVsStudios = "classes";
    
    $scope.showAllClasses = function() {
      $scope.showAll = true;
      if(!$scope.$$phase) $scope.$apply();
    }

    $scope.showDay = function(dayToShow) {
      $scope.showAll = false;
      $scope.showDate = dayToShow;
      if(!$scope.$$phase) $scope.$apply();
    }

    $scope.nextWeek = function() {
      getStudios(8, 7);
    }

    function getDates() {
      var today = new Date();
      $scope.today = moment(today).format('MMM Do')

      var sevenDaysFromNow = new Date(today.getTime() + (7*24*60*60*1000));
      $scope.sevenDaysFromNow = moment(sevenDaysFromNow).format('MMM Do');
    }

    function getStudios(start, end) {
      $scope.days = []
      for (var i = start; i < end; i++) {
        var classDate = new Date(new Date().getTime() + (i*24*60*60*1000))
        $scope.days.push(new Date(classDate.getFullYear(), classDate.getMonth(), classDate.getDate(), 12, 0, 0, 0).getTime())
      }
	    ref.child('studioIds').orderByValue().once('value', function(snapshot) {
	    	$scope.studios = {};
	    	snapshot.forEach(function(studioId) {
	    		getPicture(studioId.key);
          getUpcomingClasses(studioId.key, start, end);
          getFlair(studioId.key)
	    		ref.child('studios').child(studioId.key).child('storefrontInfo').once('value', function(snapshot) {
	    			$scope.studios[studioId.key] = snapshot.val()
				    if(!$scope.$$phase) $scope.$apply();
	    		})
	    	})
	    })
	  }

    function getFlair(studioId) {
      ref.child('studioIds').child(studioId).once('value', function(snapshot) {
        $scope.flair = $scope.flair || {};
        $scope.flair[studioId] = snapshot.val();
      })
    }

	  function getPicture(studioId) {
	  	storageRef.child('studios').child(studioId).child('images/header.jpg').getDownloadURL().then(function(url) {
        $scope.studioPictures[studioId] = url
        if(!$scope.$$phase) $scope.$apply();
      }).catch(function(error) {
        switch (error.code) {
          case 'storage/object_not_found':
            // File doesn't exist
            break;
          case 'storage/unauthorized':
            // User doesn't have permission to access the object
            break;
          case 'storage/canceled':
            // User canceled the upload
            break;
          case 'storage/unknown':
            // Unknown error occurred, inspect the server response
            break;
        }
      });
	  }
  
    function getUpcomingClasses(studioId, start, daysToShow) {
      var rightNow = (new Date().getTime() + start*24*60*60*1000 - 30*60*1000).toString(); //Can see clases that started up to 30 minutes ago
      var sevenDaysFromNow = new Date(new Date().getTime() + (daysToShow*24*60*60*1000)).toString();    

      ref.child('studios').child(studioId).child('classes').startAt(rightNow).endAt(sevenDaysFromNow).orderByKey().once('value', function(snapshot) {
        snapshot.forEach(function(classToAdd) {
          getBookings(studioId, classToAdd.val());
          getClassTypes(studioId, classToAdd.val().classType);
          getInstructors(studioId, classToAdd.val().instructor);
          var dateToUse = new Date(classToAdd.val().dateTime);
          var dateOfClass = new Date(dateToUse.getFullYear(), dateToUse.getMonth(), dateToUse.getDate(), 12, 0, 0, 0).getTime();
          var timeOfClass = classToAdd.val().dateTime;
          $scope.upcomingClasses = $scope.upcomingClasses || {};
          $scope.upcomingClasses[dateOfClass] = $scope.upcomingClasses[dateOfClass] || [];
          // $scope.upcomingClasses[dateOfClass][timeOfClass] = $scope.upcomingClasses[dateOfClass][timeOfClass] || [];
          var toPush = classToAdd.val();
          toPush.studioId = studioId;
          $scope.upcomingClasses[dateOfClass].push(toPush)
          // $scope.upcomingClasses[dateOfClass][timeOfClass].push(toPush);
          if(!$scope.$$phase) $scope.$apply();
        })  
      })
    }

    function getBookings(studioId, classToAdd) {
      var classRef = ref.child('studios').child(studioId).child('bookings').child(classToAdd.dateTime).once('value', function(snapshot) {
        if (!snapshot.exists()) return
        $scope.numBookings[studioId] = $scope.numBookings[studioId] || {};
        $scope.numBookings[studioId][classToAdd.dateTime] = snapshot.numChildren();
        if(!$scope.$$phase) $scope.$apply();

        snapshot.forEach(function(booking) {
          $scope.bookings[studioId] = $scope.bookings[studioId] || {};
          $scope.bookings[studioId][classToAdd.dateTime] = $scope.bookings[studioId][classToAdd.dateTime] || [];
          $scope.bookings[studioId][classToAdd.dateTime].push(booking.val());
        })
      })
    }

    function getClassTypes(studioId, classTypeId) {
      ref.child('studios').child(studioId).child('classTypes').child(classTypeId).once('value', function(snapshot) {
        // snapshot.forEach(function(classType) {
          $scope.classTypes[snapshot.key] = snapshot.val()
          if(!$scope.$$phase) $scope.$apply();  
        // })
      })
    }

    function getInstructors(studioId, instructorId) {
      ref.child('studios').child(studioId).child('instructors').child(instructorId).once('value', function(snapshot) {
        // snapshot.forEach(function(classType) {
          $scope.instructors[snapshot.key] = snapshot.val()
          if(!$scope.$$phase) $scope.$apply();  
        // })
      })
    }

    $scope.trackEvent = function(name, data) {
      analytics.track(name, data)
    }

    $scope.getDayOfWeek = function(day) {
      var dayToFormat = new Date(day*1)
      return moment(dayToFormat).format('ddd')
    }

    $scope.getDate = function(day) {
      var dayToFormat = new Date(day*1)
      return moment(dayToFormat).format("M/D")
    }

    $scope.getFullDate = function(day) {
      var dayToFormat = new Date(day*1)
      return moment(dayToFormat).format('ddd MMM Do')
    }

    $scope.getTime = function(timeToFormat) {
      timeToFormat = new Date(timeToFormat*1);
      return moment(timeToFormat).format('h:mma');
    }

    $scope.setCategoryFilter = function(tag) {
      $scope.categoryFilter = tag
      Intercom('trackEvent', 'setDiscoverCategoryFilter', {filter: tag});
      analytics.track('setDiscoverCategoryFilter', {filter: tag})
    }

    String.prototype.trunc = function( n, useWordBoundary ){
       var isTooLong = this.length > n,
           s_ = isTooLong ? this.substr(0,n-1) : this;
       s_ = (useWordBoundary && isTooLong) ? s_.substr(0,s_.lastIndexOf(' ')) : s_;
       return  isTooLong ? s_ + '...' : s_;
    };

  })

	.filter('filterByCategory', function() {
    return function(items, field) {
      if (field.length < 1) return items
      var result = {};
      angular.forEach(items, function(value, key) {
        if (value.categories && value.categories[field]) result[key] = value;
      });
      return result;
    };
  })

  .filter('filterStudiosObject', function() {
    return function(items, field) {
      if (field.length < 1) return items
      var result = {};
      angular.forEach(items, function(value, key) {
        
        if (value.categories && value.categories[field]) result[key] = value;
      });
      return result;
    };
  })
  .filter('orderObjectBy', function() {
    return function(items, field, reverse) {
      var filtered = [];
      angular.forEach(items, function(item) {
        filtered.push(item);
      });
      filtered.sort(function (a, b) {
        return (a[field] > b[field] ? 1 : -1);
      });
      if(reverse) filtered.reverse();
      return filtered;
    };
  });
