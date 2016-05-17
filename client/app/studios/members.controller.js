angular.module('bodyAppApp')
  .controller('MembersCtrl', function ($scope, $stateParams, $window, $state, Studios, $http, Studio, Auth, User) {
    var currentUser = Auth.getCurrentUser()
    if (currentUser.$promise) {
      currentUser.$promise.then(function(data) {
        if (!Studios.isAdmin() && data.role != 'admin') $state.go('storefront');  
      })
    } else if (currentUser.role) {
      if (!Studios.isAdmin() && currentUser.role != 'admin') $state.go('storefront');  
    }
    console.log(currentUser);
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

    // ref.child('trainers').on('value', function(snapshot) {
    //   $scope.trainersPulled = snapshot.val()
    //   if(!$scope.$$phase) $scope.$apply();

    // })

    ref.onAuth(function(authData) {
      if (authData) {
        console.log("User is authenticated with fb ");
        listCustomers()
      } else {
        console.log("User is logged out");
        if (currentUser.firebaseToken) {
          ref.authWithCustomToken(currentUser.firebaseToken, function(error, authData) {
            if (error) {
              Auth.logout();
              $window.location.reload()
              console.log("Firebase currentUser authentication failed", error);
            } else {
              if (currentUser.role === "admin") console.log("Firebase currentUser authentication succeeded!", authData);
              listCustomers()
            }
          }); 
        } else {
          Auth.logout();
          $window.location.reload()
        }
      }
    })

    function listCustomers() { //Can also pass in a particular planId to only get subscriptions for that plan.
      Studio.listCustomers({
        id: currentUser._id
      }, { //Can also pass a limit in later to prevent thousands of subscriptions being pulled
        studioId: studioId,
        limit: 100
      }).$promise.then(function(customers) {
        if (!customers) return console.log("No customers retrieved.")
        console.log("Retrieved " + customers.length + " customers");

        $scope.customers = {}
        for (var i = 0; i < customers.length; i++) {
        // console.log(customers[i])
        if (customers[i].metadata && customers[i].metadata.mongoId) $scope.customers[customers[i].metadata.mongoId] = customers[i];
          User.getUser({id: currentUser._id}, {userToGet: customers[i].metadata.mongoId}).$promise.then(function(data) {
            $scope.customers[data._id] = $scope.customers[data._id] || {};
            $scope.customers[data._id].profileInfo = data;
            console.log($scope.customers)
            if(!$scope.$$phase) $scope.$apply();
          })  
        }
      })
    }

    $scope.getTimeMember = function(customer) {
      if (!customer || !customer.subscriptions) {return "Not a customer"}
      if (!customer.subscriptions.data) { return "Not a member" }
      var now = new Date().getTime()
      var subStart = new Date(customer.subscriptions.data[0].start*1000).getTime()
      var numberOfDays = Math.round((now - subStart) / 1000 / 60 / 60 / 24)
      return numberOfDays < 30 ? "Member for " + numberOfDays + " Days" : "Member for " + numberOfDays/30 + " Months"
    }

    // $scope.getTotalRevenue = function(customer) {
    //   if (!Studios.getCustomerRevenue(customer)) {
    //     Studio.getUserRevenue({id: currentUser._id}, {customerToGet: customer.id, studioId: studioId}).$promise.then(function(data) {
    //       // console.log(data)
    //       Studios.saveCustomerRevenue(customer, data);
    //       return data;
    //       // if(!$scope.$$phase) $scope.$apply();
    //     })    
    //   } else {
    //     return Studios.getCustomerRevenue(customer);
    //   }
    // }

    $scope.exportCustomers = function(customers) {
      var toExport = {};
      for (var prop in customers) {
        if (!customers.hasOwnProperty(prop)) return
        toExport[prop] = {};
        toExport[prop].email = $scope.customers[prop].email
        toExport[prop].profileInfo = $scope.customers[prop].profileInfo
      }
      console.log(toExport)
      // $scope.toExport = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(toExport));
      // var members = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(toExport));
      var members = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(toExport));

      // if(!$scope.$$phase) $scope.$apply();

      // var dlAnchorElem = document.getElementById('downloadAnchorElem');

      // dlAnchorElem.setAttribute("href", dataStr );
      // dlAnchorElem.setAttribute("download", "members.json");
      // dlAnchorElem.click();

      $('<a href="data:' + members + '" download="members.json">Export</a>').appendTo('#exportButton');
    }

    $scope.clickCustomer = function(customer) {
      $scope.showCustomerDetail = customer;
      $scope.scrollTop()
    }

    $scope.getNumberOf = function(items) {
      if (items) return Object.keys(items).length;
    }

    $scope.keyPressed = function(key, enteredSoFar) {
      if (key.keyCode === 13) $scope.searchForUser(enteredSoFar)
    }

    $scope.scrollTop = function() {
      window.scrollTo(0, 0);
    }

  });