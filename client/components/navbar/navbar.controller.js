'use strict';

angular.module('bodyAppApp')
  .controller('NavbarCtrl', function ($scope, $location, Auth) {
    $scope.menu = [{
      'title': 'Home',
      'link': '/'
    }
    // ,
    // {
    //   'title': 'Join Class',
    //   'link': '/consumervideo'
    // },
    // {
    //   'title': 'Lead Class',
    //   'link': '/trainervideo'
    // },
    // {
    //   'title': 'Schedule',
    //   'link': '/schedule'
    // }
    ];

    $scope.isCollapsed = true;
    $scope.isLoggedIn = Auth.isLoggedIn;
    $scope.isAdmin = Auth.isAdmin;
    $scope.getCurrentUser = Auth.getCurrentUser;
    console.log($scope.getCurrentUser())

    $scope.logoStyle = {"background-color": "white"};
    $scope.imageSrc = "../assets/images/BodyLogo_blue_small.png"

    $scope.hover = function(element) {
      $scope.imageSrc = "../assets/images/BodyLogo_white_small.png";
      // $scope.logoStyle = {"background-color": "black"};
    }

    $scope.unhover = function(element) {
      $scope.imageSrc = "../assets/images/BodyLogo_blue_small.png";
      $scope.logoStyle = {"background-color": "white"};
    }

    $scope.logout = function() {
      Auth.logout();
      $location.path('/login');
    };

    $scope.isActive = function(route) {
      return route === $location.path();
    };
  });