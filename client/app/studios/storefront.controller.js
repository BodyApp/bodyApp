'use strict';

angular.module('bodyAppApp')
  .controller('StorefrontCtrl', function ($scope, $stateParams, $sce, $window, $http, $uibModal, Studios, Auth, $rootScope) {
  	var currentUser = Auth.getCurrentUser()

    var ref;
    var studioId = $stateParams.studioId;
    $scope.classToCreate = {};
    Studios.setCurrentStudio(studioId);
    if (studioId) {
      ref = new Firebase("https://bodyapp.firebaseio.com/studios").child(studioId);
    } else {
      studioId = 'ralabala'
      // $location.path('/ralabala/admin')
      ref = new Firebase("https://bodyapp.firebaseio.com/studios").child("ralabala");
    }

    $scope.studioId = studioId;

    var daysInFuture = 0;
    var numDaysToShow = 7;

    getClasses(0, 7);
    getStorefrontInfo();
    getInstructors();
    getClassTypes();
    getWorkouts();
    getPlaylistObjects();
    createSchedule(numDaysToShow, daysInFuture);
    ref.unauth()

    if (currentUser && currentUser.$promise) {
      currentUser.$promise.then(function(user) {
        console.log("Using promise to check subscription")
        console.log(currentUser)
        checkSubscriptionStatus()
      })            
    } else if (currentUser) {
      console.log("Checking subscription without promise")
      checkSubscriptionStatus()
    } else {
      console.log("Can't check subscription status")
    }

    function checkSubscriptionStatus() {
      $http.post('/api/payments/updatecustomersubscriptionstatus', {
        studioId: studioId
      })
      .success(function(data) {
        console.log("Successfully updated customer subscription status.");
        Auth.updateUser(data);
        currentUser = data;
        console.log(currentUser)
        $rootScope.subscriptions = $rootScope.subscriptions || {}
        if (currentUser.studioSubscriptions && currentUser.studioSubscriptions[studioId]) {
          $rootScope.subscriptions[studioId] = currentUser.studioSubscriptions[studioId].status === "active"
        } 

        // currentUser = data;
        // $scope.currentUser = currentUser;
        // $rootScope.subscriptionActive = true; //Need to change this
        // if (slot) bookClass(slot);               
      })
      .error(function(err) {
        console.log(err)
      }.bind(this));
    }
   

    // console.log(currentUser);
    // if (currentUser.stripe && currentUser.stripe.studios) $rootScope.subscriptions[studioId] = currentUser.stripe.studios[studioId]

    ref.onAuth(function(authData) {
      if (authData) {
        console.log("User is authenticated with fb ");
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
            }
          }); 
        } else {
          // Auth.logout();
          // $window.location.reload()
        }
      }
    })

    function getStorefrontInfo() {
      ref.child('storefrontInfo').once('value', function(snapshot) {
        $scope.storefrontInfo = snapshot.val();
        $scope.youtubeLink = $sce.trustAsResourceUrl('https://www.youtube.com/embed/'+$scope.storefrontInfo.youtubeId+'?rel=0&amp;showinfo=0');
        if(!$scope.$$phase) $scope.$apply();
      })
    }

    function getDropinPricing() {
      ref.child('stripeConnected').child('dropinPlan').child('amount').once('value', function(snapshot) {
        console.log(snapshot.val())
        $scope.dropinPricing = snapshot.val()/100
        if(!$scope.$$phase) $scope.$apply();
      })  
    }

    function getSubscriptionPricing() {
      ref.child('stripeConnected').child('subscriptionPlans').once('value', function(snapshot) {
        $scope.subscriptionPricing = snapshot.val()[Object.keys(snapshot.val())[0]].amount/100
        if(!$scope.$$phase) $scope.$apply();
      })  
    }

    function getClassTypes() {
      ref.child('classTypes').once('value', function(snapshot) {
        $scope.classTypes = snapshot.val()
        if(!$scope.$$phase) $scope.$apply();
      })  
    }

    function getInstructors() {
      ref.child('instructors').once('value', function(snapshot) {
        $scope.instructors = snapshot.val();
        $scope.numOfInstructors = Object.keys(snapshot.val()).length
        if(!$scope.$$phase) $scope.$apply();
      })
    }

    function getClasses(daysInFuture, numDaysToShow) {
      var startAt = new Date().getTime() - 1*60*60*1000 //Can see classes that started an hour ago
      startAt = (startAt*1 + daysInFuture*24*60*60*1000).toString()
      var numberOfDaysToDisplay = numDaysToShow;
      var toAdd = numberOfDaysToDisplay * 24 * 60 * 60 * 1000
      var endAt = (startAt*1 + toAdd + 1*60*60*1000).toString()

      ref.child('classes').orderByKey().startAt(startAt).endAt(endAt).on('value', function(snapshot) {
        $scope.classSchedule = snapshot.val();
        console.log("Pulled " + Object.keys($scope.classSchedule).length + " classes for schedule.")
        if(!$scope.$$phase) $scope.$apply();
      })
    }

    function createSchedule(days, daysInFuture) {
      $scope.daysToShow = [];
      var dateTimeNow = new Date();
      var beginningDateToday = new Date(dateTimeNow.getFullYear(), dateTimeNow.getMonth(), dateTimeNow.getDate(), 0, 0, 0, 1).getTime();
      beginningDateToday = beginningDateToday + daysInFuture*24*60*60*1000;
      for (var i=0; i<days; i++) {
        var day = {}
        day.beginDateTime = beginningDateToday + i*24*60*60*1000
        day.endDateTime = day.beginDateTime + 24*60*60*1000-1000
        day.formattedDate = getFormattedDateTime(day.beginDateTime).dayOfWeek + ", " + getFormattedDateTime(day.beginDateTime).month + " " + getFormattedDateTime(day.beginDateTime).day;
        day.formattedDayOfWeek = getFormattedDateTime(day.beginDateTime).dayOfWeek;
        day.formattedMonthAndDay = getFormattedDateTime(day.beginDateTime).month + " " + getFormattedDateTime(day.beginDateTime).day;

        $scope.daysToShow.push(day)
        if(!$scope.$$phase) $scope.$apply();
      }
    }

    function getWorkouts() {
      ref.child('workouts').once('value', function(snapshot) {
        $scope.workouts = snapshot.val()
        // Studios.saveWorkouts(snapshot.val())
        if(!$scope.$$phase) $scope.$apply();
      })
    }

    function getPlaylistObjects() {
      ref.child('playlists').once('value', function(snapshot) {
        $scope.playlistObjects = snapshot.val();
        // Studios.savePlaylistObjects(snapshot.val())
        if(!$scope.$$phase) $scope.$apply();
      })
    }

    $scope.joinStudioClicked = function() {
      Auth.isLoggedInAsync(function(loggedIn) {
        if (!loggedIn) {
          // if (Auth.getCurrentUser().completedNewUserFlow || Auth.getCurrentUser().injuries || Auth.getCurrentUser().goals) {
          //   $state.go('storefront');
          // } else {
          var modalInstance = $uibModal.open({
            animation: true,
            templateUrl: 'app/account/signup/signup.html',
            controller: 'SignupCtrl',
            windowClass: "modal-tall"
          });

          modalInstance.result.then(function (selectedItem) {
            // $window.location.href = '/auth/' + 'facebook';
            $window.location.reload()
          }, function () {
            $window.location.reload()
          });
          // }
        } else {
          var modalInstance = $uibModal.open({
            animation: true,
            templateUrl: 'app/membership/membership.html',
            controller: 'MembershipCtrl',
            windowClass: "modal-wide",
            resolve: {
              slot: function() {
                return null
              },
              studioId: function() {
                return studioId
              }
            }
            // scope: {classToJoin: slot} //passed current scope to the modal
          });

          modalInstance.result.then(function () {
            currentUser = Auth.getCurrentUser()
          }, function () {
            currentUser = Auth.getCurrentUser()
            // openStripePayment() //Killed here because moved into the membership modal's controller
          });
        }
      });
    }

    $scope.getFormattedDateTime = function(dateTime, noToday) {
      return getFormattedDateTime(dateTime, noToday);
    }

    function getFormattedDateTime(dateTime, noToday) {
      var newDate = new Date(dateTime);
      var formatted = {};

      if (newDate.getHours() == 12) {
          formatted.classTime = newDate.getHours() +":"+ ((newDate.getMinutes() < 10)?"0":"") + newDate.getMinutes() + "pm"
      } else if (newDate.getHours() == 0) {
          formatted.classTime = 12 +":"+ ((newDate.getMinutes() < 10)?"0":"") + newDate.getMinutes() + "am"
      } else {
          formatted.classTime = ((newDate.getHours() < 13)? newDate.getHours() : newDate.getHours()-12) +":"+ ((newDate.getMinutes() < 10)?"0":"") + newDate.getMinutes() + ((newDate.getHours() < 13)? "am" : "pm")
      } 
      
      formatted.day = newDate.getDate();
      formatted.year = newDate.getFullYear();
      
      // $scope.dayOfWeek;
      
      switch (newDate.getDay()) {
          case 0: formatted.dayOfWeek = "Sun"; break;
          case 1: formatted.dayOfWeek = "Mon"; break;
          case 2: formatted.dayOfWeek = "Tue"; break;
          case 3: formatted.dayOfWeek = "Wed"; break;
          case 4: formatted.dayOfWeek = "Thu"; break;
          case 5: formatted.dayOfWeek = "Fri"; break;
          case 6: formatted.dayOfWeek = "Sat"; break;
          default: break;
      }

      if (newDate.getDay() == new Date().getDay() && newDate.getDate() === new Date().getDate() && !noToday) {
          formatted.dayOfWeek = "Today"
      }

      var month = new Array();
      month[0] = "Jan";
      month[1] = "Feb";
      month[2] = "Mar";
      month[3] = "Apr";
      month[4] = "May";
      month[5] = "Jun";
      month[6] = "Jul";
      month[7] = "Aug";
      month[8] = "Sept";
      month[9] = "Oct";
      month[10] = "Nov";
      month[11] = "Dec";

      formatted.month = month[newDate.getMonth()]    
      // console.log(formatted);       
      return formatted;
    }

  });