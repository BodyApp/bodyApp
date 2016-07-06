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

    function getDates() {
      var today = new Date();
      $scope.today = moment(today).format('MMM Do')

      var sevenDaysFromNow = new Date(today.getTime() + (8*24*60*60*1000));
      $scope.sevenDaysFromNow = moment(sevenDaysFromNow).format('MMM Do');
    }

    function getStudios() {
	    ref.child('studioIds').orderByValue().on('value', function(snapshot) {
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
      var rightNow = new Date().getTime().toString();
      var sevenDaysFromNow = new Date(new Date().getTime() + (7*24*60*60*1000)).toString();    

      ref.child('studios').child(studioId).child('classes').startAt(rightNow).endAt(sevenDaysFromNow).orderByKey().on('value', function(snapshot) {
        snapshot.forEach(function(classToAdd) {
          getClassTypes(studioId, classToAdd.val().classType)
          getInstructors(studioId, classToAdd.val().instructor)
          var dateToUse = new Date(classToAdd.val().dateTime)
          var dateOfClass = new Date(dateToUse.getFullYear(), dateToUse.getMonth(), dateToUse.getDate(), 12, 0, 0, 0);
          var timeOfClass = classToAdd.val().dateTime
          $scope.upcomingClasses = $scope.upcomingClasses || {};
          $scope.upcomingClasses[dateOfClass] = $scope.upcomingClasses[dateOfClass] || {};
          $scope.upcomingClasses[dateOfClass][timeOfClass] = $scope.upcomingClasses[dateOfClass][timeOfClass] || [];
          var toPush = classToAdd.val()
          toPush.studioId = studioId;
          $scope.upcomingClasses[dateOfClass][timeOfClass].push(toPush);
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
      var dayToFormat = new Date(day)
      return moment(dayToFormat).format('ddd')
    }

    $scope.getDate = function(day) {
      var dayToFormat = new Date(day)
      return moment(dayToFormat).format("MMM Do")
    }

    $scope.getFullDate = function(day) {
      var dayToFormat = new Date(day)
      return moment(dayToFormat).format('ddd MMM Do')
    }

    $scope.getTime = function(timeToFormat) {
      timeToFormat = new Date(timeToFormat*1);
      return moment(timeToFormat).format('h:mma');
    }

    $scope.setCategoryFilter = function(tag) {
      $scope.categoryFilter = tag
    }

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
});