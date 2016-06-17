'use strict';

angular.module('bodyAppApp')
  .controller('DiscoverCtrl', function ($scope, $state, $mdDialog) {
  	var ref = firebase.database().ref();
    var storageRef = firebase.storage().ref();
    $scope.studioPictures = {};

    getStudios();

    $scope.categoryFilter = $state.params.tag;

    function getStudios() {
	    ref.child('studioIds').on('value', function(snapshot) {
	    	$scope.studios = [];
	    	snapshot.forEach(function(studioId) {
	    		getPicture(studioId.key)
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
  })

	.filter('filterByCategory', function() {
  return function(items, field) {
    var result = {};
    angular.forEach(items, function(value, key) {
      if (value.categories[field]) result[key] = value;
    });
    return result;
  };
});