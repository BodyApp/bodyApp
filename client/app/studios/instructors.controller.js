'use strict';

angular.module('bodyAppApp')
  .controller('InstructorsCtrl', function ($scope, $stateParams, Studios, $http, Auth, User) {
    var currentUser = Auth.getCurrentUser()
    var ref;
    var studioId = $stateParams.studioId;
    $scope.classToCreate = {};
    Studios.setCurrentStudio(studioId);
    if (studioId) {
      ref = new Firebase("https://bodyapp.firebaseio.com/studios").child(studioId);
    } else {
      // $location.path('/ralabala/admin')
      ref = new Firebase("https://bodyapp.firebaseio.com/studios").child("ralabala");
    }

    // $scope.tags = [
    //   { name: "Brazil", flag: "Brazil.png" },
    //   { name: "Italy", flag: "Italy.png" },
    //   { name: "Spain", flag: "Spain.png" },
    //   { name: "Germany", flag: "Germany.png" },
    // ];

    ref.child('classTypes').orderByChild('created').on('value', function(snapshot) {
      $scope.savedClassTypes = snapshot.val()
      if(!$scope.$$phase) $scope.$apply();

    })

    $scope.searchForUser = function(userToSearchFor) {
      console.log(userToSearchFor)
      User.getInstructorByEmail({
        id: currentUser._id
      }, {
        email: userToSearchFor
      }).$promise.then(function(instructor) {
        $scope.returnedInstructor = instructor;
      })
    }

    $scope.saveInstructor = function(instructorToSave) {
      
    }

    $scope.scrollTop = function() {
      window.scrollTo(0, 0);
    }

  });
