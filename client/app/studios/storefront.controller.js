'use strict';

angular.module('bodyAppApp')
  .controller('StorefrontCtrl', function ($scope, $stateParams, $sce, $window, $http, $location, $uibModal, $cookies, $state, $timeout, Studios, Auth, User, Schedule, Studio, Video, $rootScope) {
  	var currentUser = Auth.getCurrentUser()
    $scope.currentUser = currentUser;

    var studioId = $stateParams.studioId;
    $scope.studioId = studioId;
    $scope.classToCreate = {};
    $scope.studioName = studioId;
    $scope.studioLongDescription = $scope.studioName + " is a new virtual fitness studio on BODY where you can take live classes.  We're offering one week of unlimited free classes if you click this link!"
    $scope.bookings = {};
    $scope.storyToShow = 0;
    $scope.numDaysToShow = 7;
    $scope.videosToShow = 5;
    var lastVideoPlayedId;
    // if (!studioId) studioId = 'body'
    Studios.setCurrentStudio(studioId);
    Video.destroyHardwareSetup()

    var ref = firebase.database().ref().child('studios').child(studioId);
    var storageRef = firebase.storage().ref().child('studios').child(studioId);
    var auth = firebase.auth();

    // //Check and handle if mobile
    // if(window.innerWidth > 1100) {
    //   $scope.numDaysToShow = 7;
    //   if(!$scope.$$phase) $scope.$apply();
    // } else if (window.innerWidth > 650) {
    //   $scope.numDaysToShow = 6;
    //   if(!$scope.$$phase) $scope.$apply();
    // } else if (window.innerWidth > 550) {
    //   $scope.numDaysToShow = 5;
    //   if(!$scope.$$phase) $scope.$apply();
    // } else if (window.innerWidth > 455) {
    //   $scope.numDaysToShow = 4;
    //   if(!$scope.$$phase) $scope.$apply();
    // } else {
    //   // $scope.isMobile = true;
    //   $scope.numDaysToShow = 3;
    // }
    
    setTimezone()

    ref.once('value', function(snapshot) {
      if (!snapshot.exists()) {
        $location.path('/')
      }
    })

    window.prerenderReady = false;

    

    var daysInFuture = 0;
    var numDaysToShow = 14;
    $scope.nextWeek = 0;

    Intercom('trackEvent', 'visitedStudioStorefront', {
      studio: studioId
    });

    analytics.track('visitedStudioStorefront', {
      studio: studioId
    });

    getClasses(0, 14);
    getSpecialtyClasses();
    getStorefrontInfo();
    getInstructors();
    getClassTypes();
    getWorkouts();
    getPlaylistObjects();
    createSchedule(numDaysToShow, daysInFuture);
    getImages()
    getVideoLibrary()
    getVideoStatus()
    getTestimonials()

    Video.destroyHardwareSetup()
    // ref.unauth()

    var accountId;

    Auth.isLoggedInAsync(function(loggedIn) {
      if (!loggedIn) {        
        $scope.showLoginButton = true;
        if(!$scope.$$phase) $scope.$apply();
      }
    });

    if (Auth.getCurrentUser() && Auth.getCurrentUser().$promise) {
      Auth.getCurrentUser().$promise.then(function(data) {
        // updateIntercom(data)
        // getUserBookings()
        // checkSubscriptionStatus()
        // if (data.studioSubscriptions && data.studioSubscriptions[studioId]) {
        //   $rootScope.subscriptions = $rootScope.subscriptions || {};
        //   $rootScope.subscriptions[studioId] = data.studioSubscriptions[studioId].status === "active"
        //   if (!$rootScope.subscriptions[studioId] && data.stripe && data.stripe.subscription) $rootScope.subscriptions[studioId] = data.stripe.subscription.status === "active"
        //   console.log("Subscription active? " + $rootScope.subscriptions[studioId])
        // }
      
      auth.onAuthStateChanged(function(user) {
        if (user) {
          // console.log("User is authenticated with fb ");
          getUserBookings()
          getAccountId()
          
        } 
        // else {
        //   // console.log("User is logged out");
        //   if (currentUser.firebaseToken) {
        //     auth.signInWithCustomToken(currentUser.firebaseToken).then(function(user) {
        //       if (currentUser.role === "admin") console.log("Firebase user authentication succeeded!", user);
        //       getUserBookings()
        //       getAccountId()
        //       checkSubscriptionStatus()
        //     }); 
        //   } else {
        //     console.log("User doesn't have a firebase token saved, should retrieve one.")
        //   }
        // }
      })

        // ref.onAuth(function(authData) {
        //   if (authData) {
        //     // console.log("User is authenticated with fb ");
        //     getUserBookings()
        //     getAccountId()
        //     checkSubscriptionStatus()
        //   } else {
        //     console.log("User is logged out");
        //     if (currentUser.firebaseToken) {
        //       ref.authWithCustomToken(currentUser.firebaseToken, function(error, authData) {
        //         if (error) {
        //           Auth.logout();
        //           $window.location.reload()
        //           console.log("Firebase currentUser authentication failed", error);
        //         } else {
        //           if (currentUser.role === "admin") console.log("Firebase currentUser authentication succeeded!", authData);
        //           getUserBookings()
        //           getAccountId()
        //           checkSubscriptionStatus()
        //         }
        //       }); 
        //     } else {
        //       // Auth.logout();
        //       // $window.location.reload()
        //     }
        //   }
        // })
      })
    } else if (currentUser._id) {
      console.log("Checking subscription without promise")
      // checkSubscriptionStatus()
      // getUserBookings()
      // updateIntercom(currentUser);
      // if (currentUser.studioSubscriptions && currentUser.studioSubscriptions[studioId]) {
      //   $rootScope.subscriptions = $rootScope.subscriptions || {};
      //   $rootScope.subscriptions[studioId] = currentUser.studioSubscriptions[studioId].status === "active"
      //   if (!$rootScope.subscriptions[studioId] && currentUser.stripe && currentUser.stripe.subscription) $rootScope.subscriptions[studioId] = currentUser.stripe.subscription.status === "active"
      //   console.log("Subscription active? " + $rootScope.subscriptions[studioId])
      // }
      // ref.onAuth(function(authData) {
      //   if (authData) {
      //     // console.log("User is authenticated with fb ");
      //     getUserBookings()
      //     getAccountId()
      //     checkSubscriptionStatus()
      //   } else {
      //     console.log("User is logged out");
      //     if (currentUser.firebaseToken) {
      //       ref.authWithCustomToken(currentUser.firebaseToken, function(error, authData) {
      //         if (error) {
      //           Auth.logout();
      //           $window.location.reload()
      //           console.log("Firebase currentUser authentication failed", error);
      //         } else {
      //           if (currentUser.role === "admin") console.log("Firebase currentUser authentication succeeded!", authData);
      //           getUserBookings()
      //           getAccountId()
      //           checkSubscriptionStatus()
      //         }
      //       }); 
      //     } else {
            // Auth.logout();
            // $window.location.reload()
      //     }
      //   }
      // })
    }

    // if (currentUser && currentUser.$promise) {
    //   currentUser.$promise.then(function(user) {
    //     console.log("Using promise to check subscription")
    //     console.log(currentUser)
    //     checkSubscriptionStatus()
    //   })            
    // } else 
    // if (currentUser._id) {
    //   console.log("Checking subscription without promise")
    //   checkSubscriptionStatus()
    //   getUserBookings()
    // } 
    // else {
    //   console.log("Can't check subscription status")
    // }

    // function updateIntercom(user) {
    //   if (user.intercomHash) {
    //     window.intercomSettings = {
    //       app_id: "daof2xrs",
    //       name: user.firstName + " " + user.lastName, // Full name
    //       email: user.email, // Email address
    //       user_id: user._id,
    //       user_hash: user.intercomHash,
    //       "goals": user.goals,
    //       "emergencyContact": user.emergencyContact,
    //       "injuries": user.injuries,
    //       // "latestClass_at": user.classesBookedArray ? Math.floor(new Date(user.classesBookedArray[user.classesBookedArray.length-1]*1) / 1000) : "",
    //       // "bookedIntro": user.bookedIntroClass ? user.bookedIntroClass : false,
    //       // "introTaken": user.introClassTaken ? user.introClassTaken : false,
    //       "numFriendsOnPlatform": user.friendList ? user.friendList.length : 0,
    //       "newUserFlowComplete": user.completedNewUserFlow ? user.completedNewUserFlow : false,
    //       // "isPayingMember" : user.stripe ? user.stripe.subscription.status === "active" : false,
    //       // "introClassBooked_at": Math.floor(new Date(user.introClassBooked*1) / 1000),
    //       "referredBy": user.referredBy,
    //       "referralCode" : user.referralCode,
    //       "role": user.role,
    //       "timezone": user.timezone
    //     };
    //   } else {
    //     User.createIntercomHash({id: user._id}, {}, function(user) {
    //       Auth.updateUser(user);
    //       window.intercomSettings = {
    //         app_id: "daof2xrs",
    //         name: user.firstName + " " + user.lastName, // Full name
    //         email: user.email, // Email address
    //         user_id: user._id,
    //         user_hash: user.intercomHash,
    //         "goals": user.goals,
    //         "emergencyContact": user.emergencyContact,
    //         "injuries": user.injuries,
    //         // "latestClass_at": user.classesBookedArray ? Math.floor(new Date(user.classesBookedArray[user.classesBookedArray.length-1]*1) / 1000) : "",
    //         // "bookedIntro": user.bookedIntroClass,
    //         // "introTaken": user.introClassTaken,
    //         "numFriendsOnPlatform": user.friendList ? user.friendList.length : 0,
    //         "newUserFlowComplete": user.completedNewUserFlow,
    //         // "isPayingMember" : user.stripe ? user.stripe.subscription.status === "active" : false,
    //         // "introClassBooked_at": Math.floor(new Date(user.introClassBooked*1) / 1000),
    //         "referredBy": user.referredBy,
    //         "referralCode" : user.referralCode,
    //         "role": user.role,
    //         "timezone": user.timezone
    //       };
    //     }, function(err) {console.log("Error creating Intercom hash: "+err)}).$promise;
    //   }
    // }

    function setTimezone() {
      var tzName = jstz().timezone_name;
      $scope.timezone = moment().tz(tzName).format('z');
    }

    function getImages() {
      storageRef.child('images/icon.jpg').getDownloadURL().then(function(url) {
        $scope.iconUrl = url;
        if(!$scope.$$phase) $scope.$apply();
      }).catch(function(error) {
        console.log(error)
      });

      storageRef.child('images/header.jpg').getDownloadURL().then(function(url) {
        // $scope.headerUrl = url;
        window.prerenderReady = true;
        $scope.backgroundImageUrl = url
        $scope.jsonId.image = url;
        if(!$scope.$$phase) $scope.$apply();
      }).catch(function(error) {
        console.log(error)
      });
    }

    function getAccountId() {
      ref.child("stripeConnected").child('stripe_user_id').once('value', function(snapshot) {
        if (!snapshot.exists()) return console.log("Can't get access code for studio.")
        accountId = snapshot.val()
        if ($scope.currentUser._id) checkSubscriptionStatus()
      })

      ref.child("stripeConnected").child('subscriptionPlans').limitToLast(1).once('value', function(snapshot) {
        snapshot.forEach(function(plan) {
          $scope.subscriptionPlan = plan.val()
          if(!$scope.$$phase) $scope.$apply();
        })      
      })
    }

    function checkSubscriptionStatus() {
      $http.post('/api/payments/updatecustomersubscriptionstatus', {
        studioId: studioId,
        accountId: accountId
      })
      .success(function(data) {
        console.log("Successfully updated customer subscription status.");
        console.log(data)
        // Auth.updateUser(data);
        // currentUser = data;
        // console.log(currentUser)
        // $rootScope.subscriptions = $rootScope.subscriptions || {}
        // if (!currentUser.studioSubscriptions) $rootScope.subscriptions = {}
        // if (currentUser.studioSubscriptions && currentUser.studioSubscriptions[studioId]) {
        //   $rootScope.subscriptions[studioId] = currentUser.studioSubscriptions[studioId].status === "active"
        //   if (!$rootScope.subscriptions[studioId]) $rootScope.subscriptions[studioId] = currentUser.stripe.subscription.status === "active"
        //   console.log("Subscription active? " + $rootScope.subscriptions[studioId])
        // } 

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

    function getStorefrontInfo() {
      ref.child('storefrontInfo').once('value', function(snapshot) {
        if (!snapshot.exists()) return;
        $scope.storefrontInfo = snapshot.val();
        $scope.studioName = $scope.storefrontInfo.studioName
        $scope.studioLongDescription = $scope.storefrontInfo.longDescription

        $http.post('https://api.prerender.io/recache', {
          "prerenderToken": "0xk2UugZ3MhosEzMYKrg",
          "url": "https://www.getbodyapp.com" + $location.path()
        }).then(function(){
          console.log("Successfully posted to prerender")
        }, function(err){
          console.log(err)
        });

        $scope.jsonId = {
          "@context": "http://schema.org/",
          "@type": "ExerciseGym",
          "exerciseType": "",
          "name": $scope.studioName,
          "description": $scope.studioLongDescription,
          "instructor": $scope.storefrontInfo.ownerName,
          "url": "https://www.getbodyapp.com/studios/" + studioId
        };

        for (var i = 0; i < $scope.storefrontInfo.categories.length; i++) {
          $scope.jsonId.exerciseType += $scope.storefrontInfo.categories[i]
          if (i < $scope.storefrontInfo.categories.length - 1) {
            $scope.jsonId.exerciseType += ", "
          }
        }    

        $scope.youtubeLink = $sce.trustAsResourceUrl('https://www.youtube.com/embed/'+$scope.storefrontInfo.youtubeId+'?rel=0&amp;showinfo=0');
        if(!$scope.$$phase) $scope.$apply();
      })
    }

    function getDropinPricing() {
      ref.child('stripeConnected').child('dropinPlan').child('amount').once('value', function(snapshot) {
        if (!snapshot.exists()) return;
        $scope.dropinPricing = snapshot.val()/100
        if(!$scope.$$phase) $scope.$apply();
      })  
    }

    function getSubscriptionPricing() {
      ref.child('stripeConnected').child('subscriptionPlans').once('value', function(snapshot) {
        if (!snapshot.exists()) return;
        $scope.subscriptionPricing = snapshot.val()[Object.keys(snapshot.val())[0]].amount/100
        if(!$scope.$$phase) $scope.$apply();
      })  
    }

    function getClassTypes() {
      ref.child('classTypes').once('value', function(snapshot) {
        if (!snapshot.exists()) return;
        $scope.classTypes = snapshot.val()
        if(!$scope.$$phase) $scope.$apply();
      })  
    }

    function getInstructors() {
      ref.child('instructors').once('value', function(snapshot) {
        if (!snapshot.exists()) return;
        $scope.instructors = snapshot.val();
        $scope.numOfInstructors = Object.keys(snapshot.val()).length
        if(!$scope.$$phase) $scope.$apply();
      })
    }

    function getTestimonials() {
      ref.child('testimonials').once('value', function(snapshot) {
        if (!snapshot.exists()) return $scope.testimonialsLoaded = true;
        $scope.testimonials = [];
        $scope.numOfTestimonials = Object.keys(snapshot.val()).length
        if(!$scope.$$phase) $scope.$apply();
        snapshot.forEach(function(story) {
          getStoryImage(story.val()) 
        })
      })
    }

    function getStoryImage(story) {
      var storyId = story.id;
      $scope.storyImages = $scope.storyImages || {};
      storageRef.child('images').child('testimonials').child(storyId+'.jpg').getDownloadURL().then(function(url) {
        $scope.testimonialsLoaded = true;
        if (!url) return
        else {
          $scope.storyImages[storyId] = url;
          $scope.testimonials.push(story)
          if(!$scope.$$phase) $scope.$apply();
        }
      }).catch(function(error) {
        console.log(error)
      });
    }

    function getClasses(daysInFuture, numDaysToShow) {
      var startAt = new Date().getTime() - 60*60*1000; //Can see classes that started an hour ago

      // startAt = new Date(startAt*1 + daysInFuture*24*60*60*1000).setHours(0,0,0,0).toString()
      var numberOfDaysToDisplay = numDaysToShow;
      var toAdd = numberOfDaysToDisplay * 24 * 60 * 60 * 1000
      var endAt = new Date(startAt*1 + toAdd + 1*60*60*1000).setHours(23,59,59,59).toString()
      startAt = startAt.toString()

      ref.child('classes').orderByKey().startAt(startAt).endAt(endAt).on('value', function(snapshot) {
        if (!snapshot.exists()) return;
        $scope.classSchedule = snapshot.val();
        console.log("Pulled " + Object.keys($scope.classSchedule).length + " classes for schedule.")
        if(!$scope.$$phase) $scope.$apply();
        snapshot.forEach(function(upcomingClass) {
          ref.child('bookings').child(upcomingClass.key).once('value', function(bookingInfo) {
            bookingInfo.forEach(function(info) {
              $scope.bookings[bookingInfo.key] = $scope.bookings[bookingInfo.key] || [];
              $scope.bookings[bookingInfo.key].push(info.val())  
              if(!$scope.$$phase) $scope.$apply();
            })
            // $scope.bookings[bookingInfo.key] = $scope.bookings[bookingInfo.key] || [];
            // $scope.bookings[bookingInfo.key].push(bookingInfo.val())
            // console.log($scope.bookings)
            
          })
        })
      })
    }

    function getSpecialtyClasses() {
      var startAt = new Date().setHours(0,0,0,0) //Can see classes that started an hour ago
      startAt = (startAt*1 + daysInFuture*24*60*60*1000).toString()

      ref.child('specialtyClasses').orderByKey().startAt(startAt).on('value', function(snapshot) {
        $scope.specialtyClasses = $scope.specialtyClasses || {};
        if (!snapshot.exists()) return $scope.specialtyClasses = false;
        snapshot.forEach(function(specialtyClass) {
          ref.child('classes').child(specialtyClass.key).once('value', function(snapshot) {
            console.log(snapshot.val())
            $scope.specialtyClasses[snapshot.key] = snapshot.val();  
            if(!$scope.$$phase) $scope.$apply();
          })
        })
      })
    }

    function createSchedule(days, daysInFuture) {
      $scope.daysToShow = [];
      // var dateTimeNow = new Date();
      // var beginningDateToday = new Date(dateTimeNow.getFullYear(), dateTimeNow.getMonth(), dateTimeNow.getDate(), 0, 0, 0, 1).getTime();
      var beginningOfDay = new Date().setHours(0,0,0,0)
      // console.log(beginningOfDay)
      beginningOfDay = beginningOfDay + daysInFuture*24*60*60*1000;
      for (var i=0; i<days; i++) {
        var day = {}
        day.beginDateTime = beginningOfDay + i*24*60*60*1000
        day.endDateTime = day.beginDateTime + 24*60*60*1000-1000
        day.formattedDate = getFormattedDateTime(day.beginDateTime).dayOfWeek + ", " + getFormattedDateTime(day.beginDateTime).month + " " + getFormattedDateTime(day.beginDateTime).day;
        day.formattedDayOfWeek = getFormattedDateTime(day.beginDateTime).dayOfWeek;
        // day.formattedMonthAndDay = getFormattedDateTime(day.beginDateTime).month + " " + getFormattedDateTime(day.beginDateTime).day;
        day.formattedMonthAndDay = new Date(day.beginDateTime).getMonth()+1 + "/" + new Date(day.beginDateTime).getDate();

        $scope.daysToShow.push(day)
        if(!$scope.$$phase) $scope.$apply();
      }
    }

    function getWorkouts() {
      ref.child('workouts').once('value', function(snapshot) {
        if (!snapshot.exists()) return;
        $scope.workouts = snapshot.val()
        // Studios.saveWorkouts(snapshot.val())
        if(!$scope.$$phase) $scope.$apply();
      })
    }

    function getPlaylistObjects() {
      ref.child('playlists').once('value', function(snapshot) {
        if (!snapshot.exists()) return;
        $scope.playlistObjects = snapshot.val();
        // Studios.savePlaylistObjects(snapshot.val())
        if(!$scope.$$phase) $scope.$apply();
      })
    }

    function getUserBookings() {
      // console.log("Getting bookings for " + currentUser._id)
      ref.child('userBookings').child(currentUser._id).on('value', function(snapshot) {
        // console.log(snapshot.val())
        if (!snapshot.exists()) return;
        // console.log(snapshot.val())
        $scope.userBookings = snapshot.val()
        snapshot.forEach(function(booking) {
          // console.log(booking.val())
          timeCanJoin(booking.val().dateTime)
        })
        if(!$scope.$$phase) $scope.$apply();
      })
    }

    function checkMembership(slot) {
      $rootScope.subscriptions = $rootScope.subscriptions || {};
      if (!slot) slot = null
      Auth.isLoggedInAsync(function(loggedIn) {
        if (!loggedIn) {
          $cookies.put('loggedInPath', $location.path())
          // $rootScope.loggedInPath = $location.path()
          $state.go('signup', {step: 0, mode: 'signup'})
          // if (Auth.getCurrentUser().completedNewUserFlow || Auth.getCurrentUser().injuries || Auth.getCurrentUser().goals) {
          //   $state.go('storefront');
          // } else {
          // var modalInstance = $uibModal.open({
          //   animation: true,
          //   templateUrl: 'app/account/signup/signup.html',
          //   controller: 'SignupCtrl',
          //   windowClass: "modal-tall"
          // });

          // modalInstance.result.then(function (selectedItem) {
          //   // $window.location.href = '/auth/' + 'facebook';
          //   $window.location.reload()
          // }, function () {
          //   $window.location.reload()
          // });
          // }

        } else if (slot && slot.typeOfClass === 'Specialty') {
          console.log("Booking specialty class")
          return bookSpecialtyClass(slot)
        } else if (slot && $scope.classTypes && $scope.classTypes[slot.classType] && $scope.classTypes[slot.classType].freeClass) { //Book class if studio hasn't set pricing.
          console.log("Booking for free because this is a free class.")
          return bookClass(slot)
        } else if (slot && !$scope.storefrontInfo.subscriptionPricing && !$scope.storefrontInfo.dropinPricing) { //Book class if studio hasn't set pricing.
          console.log("Booking for free because no pricing is set")
          return bookClass(slot)
        } else if (slot && currentUser && currentUser.role === 'admin') {
          console.log("Booking for free because user is admin.")
          return bookClass(slot)
        // } else if (slot && studioId === 'body') {
        //   console.log("Booking for free because this is the BODY studio.")
        //   return bookClass(slot)
        } else if ($rootScope.subscriptions && $rootScope.subscriptions[studioId] != 'active') {
          var modalInstance = $uibModal.open({
            animation: true,
            templateUrl: 'app/membership/membership.html',
            controller: 'MembershipCtrl',
            windowClass: "modal-wide",
            resolve: {
              slot: function() {
                return slot
              },
              studioId: function() {
                return studioId
              },
              accountId: function() {
                return accountId
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
        } else {
          return true;
        }
      });
    }

    $scope.joinStudioClicked = function() {
      Intercom('trackEvent', "joinStudioClicked")
      analytics.track('joinStudioClicked', {
      studio: studioId
    });
      if ($rootScope.subscribing) return
      checkMembership()
    }

    $scope.cancelSubscription = function() {
      // console.log(currentUser);
      // var planId;
      // ref.child('studios').child(studioId).child('stripeConnected').child('subscriptionPlans').limitToLast(1).once('value', function(snapshot) {
        // snapshot.forEach(function(plan) {
          // planId = plan.val().id  
      if (confirm("Are you sure you want to cancel your subscription?")) {
        var modalInstance = openCancellationConfirmedModal()
        $http.post('/api/payments/cancelcustomersubscription', {            
          studioId: studioId,
          // planInfo: planId,
          accountId: accountId
        })
        .success(function(data) {
          console.log("Successfully cancelled subscription to " + studioId);
          Intercom('trackEvent', "cancelledMembership", {studioId: studioId})
          analytics.track('cancelledMembership', {
            studio: studioId
          });
          // Auth.updateUser(data);
          // $rootScope.subscriptions = $rootScope.subscriptions || {};
          // delete $rootScope.subscriptions[studioId];
        })
        .error(function(err) {
          console.log(err)                
        }.bind(this));
      }
        // })
      // })
      
    }

    function openCancellationConfirmedModal() {
        var modalInstance = $uibModal.open({
          animation: true,
          templateUrl: 'app/account/settings/cancellation.html',
          controller: 'CancellationCtrl',
        });

        modalInstance.result.then(function (selectedItem) {
          $scope.selected = selectedItem;
        }, function () {
          $log.info('Modal dismissed at: ' + new Date());
        });

        return modalInstance;
    }

    $scope.playYoutubeVideo = function() {
      Intercom('trackEvent', "playedYoutubeVideo")
      analytics.track('playedYoutubeVideo', {
        studio: studioId
      });
      $("#youtubeVideo")[0].src += "&autoplay=1";
      $scope.showVideoPlayer = true;
      $scope.hidePlayer = false;
      if(!$scope.$$phase) $scope.$apply();
    }

    $scope.stopPlayingVideo = function() {
      $('#youtubeVideo').attr('src', $sce.trustAsResourceUrl('https://www.youtube.com/embed/'+$scope.storefrontInfo.youtubeId+'?rel=0&amp;showinfo=0&autoplay'));
      $scope.showVideoPlayer = false;
      if(!$scope.$$phase) $scope.$apply();
    }

    $scope.reserveClicked = function(slot) {
      if (($scope.userBookings && $scope.userBookings[slot.dateTime]) || slot.instructor === currentUser._id) {
        return $scope.joinClass(slot)
      }

      // console.log(slot)
      if ($rootScope.subscribing) return

      // if (currentUser && currentUser.role === 'admin') {
      //   bookClass(slot)
      // } else if (studioId === 'body') {
      //   bookClass(slot)
      // } else 
      if (!currentUser || !$rootScope.subscriptions || !$rootScope.subscriptions[studioId]) {
        console.log("No subscription found.")
        checkMembership(slot)
      } else {
        // console.log("Beginning to book class " +slot.dateTime)
        bookClass(slot)
      }
    }

    function bookSpecialtyClass(slot) {
      console.log(slot)
      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: 'app/membership/membership.html',
        controller: 'MembershipCtrl',
        windowClass: "modal-wide",
        resolve: {
          slot: function() {
            return slot
          },
          studioId: function() {
            return studioId
          },
          accountId: function() {
            return accountId
          }
        }
        // scope: {classToJoin: slot} //passed current scope to the modal
      });
    }

    function bookClass(slot) {
      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: 'app/schedule/bookingConfirmation.html',
        controller: 'BookingConfirmationCtrl',
        resolve: {
          slot: function () {
            return slot;
          },
          studioId: function () {
            return studioId;
          }
        }
      });

      modalInstance.result.then(function (selectedItem) {
        // $scope.selected = selectedItem;
      }, function () {
        // $log.info('Modal dismissed at: ' + new Date());
      });

      User.addBookedClass({ id: currentUser._id }, {
        classToAdd: slot.dateTime,
        className: $scope.classTypes[slot.classType].name,
        studioName: $scope.storefrontInfo.studioName,
        studioId: $scope.storefrontInfo.studioId,
        instructorFullName: $scope.instructors[slot.instructor].firstName + " " + $scope.instructors[slot.instructor].lastName,
        classStartingUrl: "https://www.getbodyapp.com/studios/"+studioId+"/classinfo/"+slot.dateTime,
        equipmentRequired: $scope.classTypes[slot.classType].equipment,
        classDescription: $scope.classTypes[slot.classType].classDescription,
        studioIconUrl: $scope.iconUrl
      }, function(user) {
        ref.child("bookings").child(slot.dateTime).child(currentUser._id).update({firstName: currentUser.firstName, lastName: currentUser.lastName.charAt(0), timeBooked: new Date().getTime(), picture: currentUser.picture ? currentUser.picture : "", facebookId: currentUser.facebookId ? currentUser.facebookId : ""}, function(err) {
          if (err) return console.log(err)
          console.log("Added booking")
        });
        ref.child("userBookings").child(currentUser._id).child(slot.dateTime).update({dateTime: slot.dateTime, instructor: slot.instructor, classType: slot.classType, workout: slot.workout}, function(err) {
          if (err) return console.log(err)
          console.log("Added user booking")
        });
        // ref.child("userBookings").child(currentUser._id).update({firstName: currentUser.firstName, lastName: currentUser.lastName, facebookId: currentUser.facebookId});
        // getInfo(slot.date);
        // slot.bookedUsers = slot.bookedUsers || {};
        // slot.bookedFbUserIds = slot.bookedFbUserIds || {};
        // slot.bookedUsers[currentUser._id] = {firstName: currentUser.firstName, lastName: currentUser.lastName.charAt(0), timeBooked: new Date().getTime(), picture: currentUser.picture, facebookId: currentUser.facebookId};
        // slot.bookedFbUserIds[currentUser.facebook.id] = true
        // slot.$save();
        currentUser = user;
        // $scope.currentUser = currentUser;
        Intercom('update', {
            "latestClassTaken_at": Math.floor(new Date(slot.dateTime*1) / 1000)
        });

        Intercom('trackEvent', 'bookedClass', {
          studioId: studioId,
          classToBook: slot ? slot.dateTime : "None",
          dateOfClass_at: Math.floor(slot.dateTime/1000)
        });
        analytics.track('bookedClass', {
          studioId: studioId,
          classToBook: slot ? slot.dateTime : "None",
        });
      }, function(err) {
          console.log("Error adding class: " + err)
          // slot.bookedUsers = slot.bookedUsers || {};
          // delete slot.bookedUsers[currentUser._id];
          // delete slot.bookedFbUserIds[currentUser.facebook.id];
          // alert("sorry, there was an issue booking your class.  Please try reloading the site and booking again.  If that doesn't work, contact the BODY help team at (216) 408-2902 to get this squared away.")    
      }).$promise;
    }

    $scope.cancelClass = function(classToCancel) {
      // User.cancelBookedClass({ id: currentUser._id }, {
      //   classToCancel: slot.date,
      //   studioId: studioId
      // }, function(user) {
      if (confirm("Are you sure you want to cancel class?")) {
        ref.child("bookings").child(classToCancel.dateTime).child(currentUser._id).remove()
        ref.child("userBookings").child(currentUser._id).child(classToCancel.dateTime).remove()
        ref.child("cancellations").child(classToCancel.dateTime).child(currentUser._id).update({firstName: currentUser.firstName, lastName: currentUser.lastName.charAt(0), timeBooked: new Date().getTime(), picture: currentUser.picture ? currentUser.picture : "", facebookId: currentUser.facebookId ? currentUser.facebookId : ""})
        Intercom('trackEvent', 'cancelledClass', {
          studioId: studioId,
          classToCancel: slot ? slot.dateTime : "None",
          dateOfClass_at: Math.floor(slot.dateTime/1000)
        });
        analytics.track('cancelledClass', {
          studioId: studioId,
          classId: slot ? slot.dateTime : "None",
        });
        // Auth.updateUser(user);
        // currentUser = user;
        // $scope.currentUser = currentUser;  
      }
        
      // }, function(err) {
      //     console.log("Error adding class: " + err)
      //     alert("sorry, there was an issue canceling your class.  Please try reloading the site and booking again.  If that doesn't work, contact the BODY help team at (216) 408-2902 to get this squared away.")    
      // }).$promise;
    }

    function timeCanJoin(classDateTime) {
      var rightNow = new Date().getTime();
      var minutesBeforeClassThatCanJoin = 65;
      var timeCanJoin = classDateTime*1 - minutesBeforeClassThatCanJoin * 60 * 1000
      $scope.classesJoinTime = $scope.classesJoinTime || {};
      $scope.classesJoinTime[classDateTime] = timeCanJoin;
      $scope.rightNow = rightNow;
      // console.log(timeCanJoin)
      // console.log(rightNow)
      if(!$scope.$$phase) $scope.$apply();

      // var timeUntilClass = rightNow - timeCanJoin;
      // console.log(timeCanJoin)
      // return timeCanJoin;
    }

    $scope.joinClass = function(classToJoin) {
      Schedule.setClassUserJustJoined(studioId, classToJoin);
      $location.path('/studios/' + studioId + '/classinfo/' + classToJoin.dateTime)
    }

    $scope.goToDiscover = function(tag) {
       // $location.path('/discover/' + tag) 
       $state.go('discover', {tag: tag})
    }

    $scope.incrementNextWeek = function() {
      // if ($scope.isMobile) return $scope.nextWeek += 3
      if ($scope.nextWeek < $scope.numDaysToShow + (7-$scope.numDaysToShow)*2) $scope.nextWeek += $scope.numDaysToShow;
    }

    $scope.decrementNextWeek = function() {
      // if ($scope.isMobile) return $scope.nextWeek += 3
      if ($scope.nextWeek > 0) $scope.nextWeek -= $scope.numDaysToShow;
    }

    function getVideoLibrary() {
      firebase.database().ref().child('videoLibraries').child(studioId).child('videos').on('value', function(snapshot) {
        $scope.videoLibrary = [];
        $scope.loadedMedia = {};
        snapshot.forEach(function(video) {
          var toPush = video.val()
          toPush.key = video.key
          $scope.videoLibrary.push(toPush);
          if(!$scope.$$phase) $scope.$apply();
          console.log($scope.videoLibrary)
          $scope.loadedMedia[video.key] = {
            sources: [
              {
                src:'https://s3.amazonaws.com/videolibraries/'+toPush.s3Key,
                type: 'video/mp4'
              }
            ]
          };
          if(!$scope.$$phase) $scope.$apply();

          $timeout(function(){
            var videoKey = document.getElementById('video'+video.key);
            // videoKey.addEventListener('loadedmetadata', function() {
              $scope.videoDurations = $scope.videoDurations || {};
              $scope.videoDurations[video.key] = videoKey.duration.toString().toHHMMSS()
              if(!$scope.$$phase) $scope.$apply();
                // console.log(videoKey.duration);
                // videoKey.bind('contextmenu',function() { return false; });
            // });  
          },1000)
          
            // videoPlayer.src({"src":'https://s3.amazonaws.com/videolibraries/'+toPush.s3Key})
          // });
          // var videoKey = $('#video'+video.key)
          
          // videoKey.bind('contextmenu',function() { return false; });
        })
      })

      // $http.post('/api/videolibrary/getstudiovideos', {
      //   studioId: studioId,
      // })
      // .success(function(data) {
      //   console.log("Successfully retrieved videos.");
      //   $scope.videoLibrary = data;
      //   if(!$scope.$$phase) $scope.$apply();
      // })
      // .error(function(err) {
      //   console.log(err)
      //   console.log("Error retrieving videos")
      // }.bind(this));
    }

    $(document).on('webkitfullscreenchange mozfullscreenchange fullscreenchange', function() {       
      var fullscreenElement = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement;
      
      if (fullscreenElement) {
        var videoPlayer = videojs(fullscreenElement.id)
        videoPlayer.play()
        videoPlayer.controls(true)
        lastVideoPlayedId = fullscreenElement.id;

      } else {
        var videoPlayer = videojs(lastVideoPlayedId)
        videoPlayer.pause()
        videoPlayer.controls(false)
      }
    }); 

    $scope.watchVideoFromLibrary = function(videoId) {
      var videoPlayer = videojs('video'+videoId)
      videoPlayer.requestFullscreen()

      ////This is breaking stuff for some reason
      // firebase.database().ref().child('videoLibraries').child(studioId).child('videos').child(videoId).child('views').transaction(function(viewCount) {
      //   return viewCount + 1;
      // })  
    }

    $scope.getDuration = function(video) {
      // var videoKey = document.getElementById('video'+video);
      // videoKey.addEventListener('loadedmetadata', function() {
      //     console.log(videoKey.duration);
      // });
    }

    $scope.getVideoUrl = function(s3Url) {
      console.log(s3Url)
      return $sce.trustAsResourceUrl('https://s3.amazonaws.com/videolibraries/'+s3Url)
    }

    function getVideoStatus() {
      ref.child('videoLibrary').child('videos').once('value', function(snapshot) {
        if (!snapshot.exists()) return;
        $scope.videosFirebase = snapshot.val()
        $scope.numSubscriberVideos = Object.keys($scope.videosFirebase).length;
        if(!$scope.$$phase) $scope.$apply();
      })
    }

    $scope.playVideo = function(videoToPlay) {
      Intercom('trackEvent', "playedVideoFromLibrary", {videoToken: videoToPlay.token})
      analytics.track('playedVideoFromLibrary', {
        studioId: studioId,
        videoToken: videoToPlay.token
      });
      ZiggeoApi.Embed.popup({
        video: videoToPlay.token,
        autoplay: true,
        popup_width: window.innerWidth*.7,
        popup_height: window.innerHeight*.7
      });
    }

    $scope.formatDuration = function(duration) {
      return duration.toString().toHHMMSS();
    }

    String.prototype.toHHMMSS = function () {
      var sec_num = parseInt(this, 10); // don't forget the second param
      var hours   = 0;
      // var hours   = Math.floor(sec_num / 3600);
      var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
      var seconds = sec_num - (hours * 3600) - (minutes * 60);

      // if (hours   < 10) {hours   = "0"+hours;}
      // if (minutes < 10) {minutes = "0"+minutes;}
      if (seconds < 10) {seconds = "0"+seconds;}
      return minutes+':'+seconds;
    }

    $scope.getFormattedDateTime = function(dateTime, noToday) {
      return getFormattedDateTime(dateTime, noToday);
    }

    $scope.facebookCallback = function(info) {
      console.log(info)
    }

    $scope.formatDateSaved = function(dateTime) {
      var dateNow = new Date().getTime();
      var minutesSinceSaved = (dateNow - dateTime)/(60*1000)
      if (minutesSinceSaved<60) return Math.round(minutesSinceSaved) + " minutes ago"
      
      var hoursSinceSaved = Math.round((dateNow - dateTime)/(60*60*1000))
      if (hoursSinceSaved === 1) return hoursSinceSaved + " hour ago"
      if (hoursSinceSaved < 24) return hoursSinceSaved + " hours ago"
        
      var daysSinceSaved = Math.round((dateNow - dateTime)/(24*60*60*1000))
      if (daysSinceSaved === 1) return daysSinceSaved + " day ago"
      return daysSinceSaved + " days ago"
      // return 1 day ago
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
      formatted.shortMonth = newDate.getMonth()+1;
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

  })

  .directive('jsonld', ['$filter', '$sce', function($filter, $sce) {
  return {
    restrict: 'E',
    template: function() {
      return '<script type="application/ld+json" ng-bind-html="onGetJson()"></script>';
    },
    scope: {
      json: '=json'
    },
    link: function(scope, element, attrs) {
      scope.onGetJson = function() {
        return $sce.trustAsHtml($filter('json')(scope.json));
      }
    },
    replace: true
  };
}])