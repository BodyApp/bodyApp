'use strict';

angular.module('bodyAppApp')
  .controller('DiscoverCtrl', function ($scope, $state, $mdDialog) {
  	var ref = firebase.database().ref();
    var storageRef = firebase.storage().ref();
    $scope.studioPictures = {};
    $scope.classTypes = {};
    $scope.instructors = {};

    getStudios();
    getDates();

    $scope.categoryFilter = $state.params.tag;
    Intercom('trackEvent', 'navigatedToDiscover');

    $scope.classesVsStudios = "classes";

    $scope.days = [];
    for (var i = 0; i < 8; i++) {
      var classDate = new Date(new Date().getTime() + (i*24*60*60*1000))
      $scope.days.push(new Date(classDate.getFullYear(), classDate.getMonth(), classDate.getDate(), 12, 0, 0, 0).getTime())
    }

    function getDates() {
      var today = new Date();
      $scope.today = moment(today).format('MMM Do')

      var sevenDaysFromNow = new Date(today.getTime() + (7*24*60*60*1000));
      $scope.sevenDaysFromNow = moment(sevenDaysFromNow).format('MMM Do');
    }

    function getStudios() {
	    ref.child('studioIds').orderByValue().once('value', function(snapshot) {
	    	$scope.studios = {};
	    	snapshot.forEach(function(studioId) {
	    		getPicture(studioId.key);
          getUpcomingClasses(studioId.key);
	    		ref.child('studios').child(studioId.key).child('storefrontInfo').once('value', function(snapshot) {
	    			$scope.studios[studioId.key] = snapshot.val()
				    if(!$scope.$$phase) $scope.$apply();
	    		})
	    	})
	    })
	  }

	  function getPicture(studioId) {
	  	storageRef.child('studios').child(studioId).child('images/header.jpg').getDownloadURL().then(function(url) {
        $scope.studioPictures[studioId] = url
        if(!$scope.$$phase) $scope.$apply();
      }).catch(function(error) {
        console.log(error)
      });
	  }
  
    function getUpcomingClasses(studioId) {
      var rightNow = (new Date().getTime() - 30*60*1000).toString(); //Can see clases that started up to 30 minutes ago
      var sevenDaysFromNow = new Date(new Date().getTime() + (7*24*60*60*1000)).toString();    

      ref.child('studios').child(studioId).child('classes').startAt(rightNow).endAt(sevenDaysFromNow).orderByKey().once('value', function(snapshot) {
        snapshot.forEach(function(classToAdd) {
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

    $scope.getDayOfWeek = function(day) {
      var dayToFormat = new Date(day*1)
      return moment(dayToFormat).format('ddd')
    }

    $scope.getDate = function(day) {
      var dayToFormat = new Date(day*1)
      return moment(dayToFormat).format("MMM Do")
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
        if (value.categories[field]) result[key] = value;
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
