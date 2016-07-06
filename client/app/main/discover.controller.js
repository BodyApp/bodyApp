'use strict';

angular.module('bodyAppApp')
  .controller('DiscoverCtrl', function ($scope, $state, $mdDialog) {
  	var ref = firebase.database().ref();
    var storageRef = firebase.storage().ref();
    $scope.studioPictures = {};

    getStudios();
    getDates();

    $scope.categoryFilter = $state.params.tag;
    Intercom('trackEvent', 'navigatedToDiscover');

    $scope.classesVsStudios = "classes";

    function getDates() {
      var today = new Date();
      $scope.today = moment(today).format('MMM Do')

      var sevenDaysFromNow = new Date(today.getTime() + (7*24*60*60*1000));
      $scope.sevenDaysFromNow = moment(sevenDaysFromNow).format('MMM Do');
    }

    function getStudios() {
	    ref.child('studioIds').orderByValue().on('value', function(snapshot) {
	    	$scope.studios = [];
	    	snapshot.forEach(function(studioId) {
	    		getPicture(studioId.key);
          getUpcomingClasses(studioId.key);
	    		ref.child('studios').child(studioId.key).child('storefrontInfo').once('value', function(snapshot) {
	    			$scope.studios.push(snapshot.val())
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

      console.log(rightNow)

      ref.child('studios').child(studioId).child('classes').startAt(rightNow).orderByKey().on('value', function(snapshot) {
        snapshot.forEach(function(classToAdd) {
          console.log(classToAdd.val())
          var dayOfClass = new Date(classToAdd.val().dateTime).getDay();
          var timeOfClass = classToAdd.val().dateTime
          $scope.upcomingClasses = $scope.upcomingClasses || {};
          $scope.upcomingClasses[dayOfClass] = $scope.upcomingClasses[dayOfClass] || {};
          $scope.upcomingClasses[dayOfClass][timeOfClass] = $scope.upcomingClasses[dayOfClass][timeOfClass] || [];
          $scope.upcomingClasses[dayOfClass][timeOfClass].push(classToAdd.val());
          if(!$scope.$$phase) $scope.$apply();
        })
        
      })
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