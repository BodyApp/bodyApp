angular.module('bodyAppApp')
  .controller('PricingCtrl', function ($scope, $stateParams, $window, $state, Studios, Studio, $http, Auth, User) {
    var currentUser = Auth.getCurrentUser()
    var studioId = $stateParams.studioId;
    if (currentUser.$promise) {
      currentUser.$promise.then(function(data) {
        if (!Studios.isAdmin() && data.role != 'admin') $state.go('storefront', { "studioId": studioId });
        // listCoupons(data);
        // listSubscriptionPlans(data);
      })
    } else if (currentUser.role) {
      if (!Studios.isAdmin() && currentUser.role != 'admin') $state.go('storefront', { "studioId": studioId });
    }

    var accessCode;

    if (!studioId) studioId = 'body'
    Studios.setCurrentStudio(studioId);
    var ref = firebase.database().ref().child('studios').child(studioId);
    var auth = firebase.auth();
    auth.onAuthStateChanged(function(user) {
      if (user) {
        getDropinPlan();
        getAccessCode();
        getSyncedStudioName();
        getToSetup();
      } else {
        if (currentUser.firebaseToken) {
          auth.signInWithCustomToken(currentUser.firebaseToken).then(function(user) {
            if (currentUser.role === "admin") console.log("Firebase user authentication succeeded!", user);
            getDropinPlan();
            getAccessCode();
            getSyncedStudioName();
            getToSetup();
          }); 
        } else {
          console.log("User doesn't have a firebase token saved, should retrieve one.")
        }
      }
    })
    
    $scope.studioId = studioId;
    $scope.classToCreate = {};

    // ref.onAuth(function(authData) {
    //   if (authData) {
    //     // console.log("User is authenticated with fb ");
    //     // listCoupons();
    //     // listSubscriptionPlans();
    //     getDropinPlan();
    //     getAccessCode()
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
    //           // listCoupons();
    //           // listSubscriptionPlans();
    //           getDropinPlan();
    //           getAccessCode()
    //         }
    //       }); 
    //     } else {
    //       Auth.logout();
    //       $window.location.reload()
    //     }
    //   }
    // })

    function getSyncedStudioName() {
      ref.child('stripeConnected').child('detailedAccountInfo').child('display_name').on('value', function(snapshot) {
        if (!snapshot.exists) return
        $scope.connectedStripeAccount = snapshot.val()
      })
    }

    function getAccessCode() {
      ref.child('stripeConnected').child('access_token').once('value', function(snapshot) {
        if (!snapshot.exists) accessCode = null
        $scope.stripeConnected = true;
        accessCode = snapshot.val();
        listCoupons();
        listSubscriptionPlans();
      })
    }

    function listCoupons() {
      Studio.listCoupons({
        id: currentUser._id
      }, {
        studioId: studioId,
        limit: 100,
        accessCode: accessCode
      }).$promise.then(function(existingCoupons) {
        console.log("Retrieved " + existingCoupons.length + " coupons");
        $scope.existingCoupons = existingCoupons;
      })
    }

    function listSubscriptionPlans() {
      ref.child('stripeConnected').child('subscriptionPlans').on('value', function(snapshot) {
        $scope.loaded = true;
        if (!snapshot.exists()) {
          $scope.subscriptionPlan = false;
          if(!$scope.$$phase) $scope.$apply();  
          return;
        }
        snapshot.forEach(function(plan) {
          $scope.subscriptionPlan = plan.val();
          if(!$scope.$$phase) $scope.$apply();  
        })
      })

      Studio.listSubscriptionPlans({
        id: currentUser._id          
      }, {
        studioId: studioId,
        accessCode: accessCode
      }).$promise.then(function(plans) {
        console.log(plans.length + " subscription plans exist in this Stripe account");
        // if (plans.length < 1) $scope.subscriptionPlan = false;
                    
        //Checks whether the subscription still exists in Stripe.  Removes it if not.
        var planGone = true;
        for (var i = 0; i < plans.length; i++) {
          if (plans[i].id === $scope.subscriptionPlan.id) planGone = false;
        }

        if (planGone) {
          ref.child("stripeConnected").child('subscriptionPlans').remove(function(err) {
            if (err) return console.log(err)
              console.log("Removed subscription plan because it didn't exist in Stripe")
              $scope.subscriptionPlan = false;
              ref.child("storefrontInfo").child('subscriptionPricing').remove();
          })
        }

        // $scope.subscriptionPlan = plans[0];
        // if(!$scope.$$phase) $scope.$apply();
        // ref.child('storefrontInfo').update({subscriptionPricing: plans[0].amount})
        // ref.child('stripeConnected').child('subscriptionPlans').child(plans[0].id).update($scope.subscriptionPlan)
        // for (var plan = 0; plan < plans.length; plan++) { //This is no longer necessary as doing on backend.
        //   ref.child('stripeConnected').child('subscriptionPlans').child(plans[plan].id).update(plans[plan]) //Make sure subscription plans are all added to firebase and info is current.
        // }
      })
    }

    function getDropinPlan() {
    	ref.child("stripeConnected").child('dropinPlan').on('value', function(snapshot) {
        // if (!snapshot.exists()) return
    		$scope.dropinPlan = snapshot.val()
        // ref.child('storefrontInfo').update({'dropinPricing': snapshot.val().amount})
    		if(!$scope.$$phase) $scope.$apply();
    	})
    }

    function getToSetup() {
      ref.child('toSetup').child('storefrontAlert').once('value', function(snapshot) {
        if (!snapshot.exists()) return;
        $scope.storefrontAlert = snapshot.val()
        if(!$scope.$$phase) $scope.$apply();
      })
    }

    $scope.closeAlertPushed = function() {
      $scope.closeAlert = true;
      ref.child('toSetup').child('storefrontAlert').remove(function(err) {
        if (err) return console.log(err);
      })  
    }

    //Add billing controller
    $scope.beginStripeConnect = function() {
      $window.location.href = '/auth/stripe?studioid=' + studioId;
      // var retrievedInfo = $http.get('https://connect.stripe.com/oauth/authorize?response_type=code&client_id=ca_8NvwFunaEsSeZJ56Ez9yb1XhXaDR00bE&scope=read_write')
      // $location.path('https://connect.stripe.com/oauth/authorize?response_type=code&client_id=ca_8NvwFunaEsSeZJ56Ez9yb1XhXaDR00bE&scope=read_write')
    }

    $scope.deleteSubscriptionPlan = function(planId) {
      Studio.deleteSubscriptionPlan({
        id: currentUser._id
      }, {
        studioId: studioId,
        planId: planId,
        accessCode: accessCode
      }).$promise.then(function(deletedPlanId) {
      	ref.child('stripeConnected').child('subscriptionPlans').child(planId).remove(function(err) {
      		if (err) return console.log(err);
      		listSubscriptionPlans()
      		console.log("Deleted subscription plan with id: " + planId);
          ref.child('storefrontInfo').child('subscriptionPricing').remove(function(err) {
            if (err) return console.log(err)
            console.log("Removed subscription pricing from storefront.")
          })
      	})
      })
    }

    $scope.initPricingPlan = function() {
    	$scope.showAddPricingPlan = {};
    	if ($scope.dropinPlan) {
    		$scope.showAddPricingPlan.pricingType = 'Monthly';
    	} else {
    		$scope.showAddPricingPlan.pricingType = 'Drop In';
    	}
    }

    $scope.savePricingPlan = function(planToSave) {
      if (planToSave.amountInDollars < 1) return $scope.greaterThanZeroRequired = true;
      $scope.greaterThanZeroRequired = false;
    	if (planToSave.pricingType === 'Drop In') {
    		planToSave.amount = planToSave.amountInDollars * 100;
    		ref.child("stripeConnected").child('dropinPlan').update(planToSave, function(err) {
    			if (err) return console.log(err)
  				$scope.showAddPricingPlan = false;
	    		if(!$scope.$$phase) $scope.$apply();
          ref.child('storefrontInfo').child('dropinPricing').set(planToSave.amount)
    		})
    	} else if (planToSave.pricingType === 'Monthly'){
    		Studio.createSubscriptionPlan({
	        id: currentUser._id
	      }, {
	        studioId: studioId,
	        amount: planToSave.amountInDollars*100,
	        name: studioId + " BODY Subscription",
	        currency: "usd",
	        interval: "month",
	        statement_descriptor: $scope.connectedStripeAccount,
	        userThatCreatedPlan: currentUser._id,
          accessCode: accessCode
	      }).$promise.then(function(subscription) {
	      	console.log("Saved new subscription");
          ref.child('storefrontInfo').child('subscriptionPricing').set(planToSave.amountInDollars*100)
          ref.child('toSetup').child('pricing').remove(function(err) {
            if (err) console.log(err)
          })
	      	// listSubscriptionPlans()
	      	$scope.showAddPricingPlan = false;
	    		if(!$scope.$$phase) $scope.$apply();

	        // $scope.pricingOptions.push(subscription); 
	        // $scope.returnedSubscription = subscription;
	      })
    	}
    }

    $scope.deleteDropinPlan = function() {
    	ref.child("stripeConnected").child('dropinPlan').remove(function(err) {
    		if (err) return console.log(err)
        ref.child('storefrontInfo').child('dropinPricing').remove(function(err) {
          if (err) return console.log(err)
          console.log("Dropin plan removed");
        })
    	})
    }

    $scope.editDropinPlan = function(planToEdit) {
    	$scope.showAddPricingPlan = planToEdit;
    	$scope.editing = true;
    }

    $scope.updateDropinPlan = function(planToEdit) {
      if (planToEdit.amountInDollars < 1) return $scope.greaterThanZeroRequired = true;
      $scope.greaterThanZeroRequired = false;
    	planToEdit.amount = planToEdit.amountInDollars * 100;
    	ref.child("stripeConnected").child('dropinPlan').update(planToEdit, function(err) {
  			if (err) return console.log(err)
        console.log("Dropin plan updated")
        ref.child('toSetup').child('pricing').remove(function(err) {
          if (err) console.log(err)
        })
				$scope.showAddPricingPlan = false;
				$scope.editing = false;
    		if(!$scope.$$phase) $scope.$apply();
  		})
    }

    $scope.deleteCoupon = function(couponToDelete) {
    	console.log(couponToDelete);
      Studio.deleteCoupon({
        id: currentUser._id
      }, {
        studioId: studioId,
        couponId: couponToDelete.id,
        accessCode: accessCode
      }).$promise.then(function(deletedCouponId) {
        console.log("Deleted coupon with id: " + couponToDelete.id);
        listCoupons()
      })
    }

    $scope.initShowAddCoupon = function() {
    	$scope.showAddCoupon = {};
    	$scope.showAddCoupon.couponType = "Percentage off";
    	$scope.showAddCoupon.duration = "once";
    }

    $scope.createCoupon = function(couponToCreate) {
    	if (couponToCreate.unformattedDate) couponToCreate.redeem_by = new Date(couponToCreate.unformattedDate).getTime()/1000
  		if (couponToCreate.couponType === 'Dollars off') {
  			couponToCreate.currency = "usd"
  			couponToCreate.amount_off = couponToCreate.amountInDollars * 100;
  			delete couponToCreate.amountInDollars;
  		}

    	Studio.createCoupon({
        id: currentUser._id
      }, {
        studioId: studioId,
        accessCode: accessCode,
        couponToCreate: couponToCreate
      }).$promise.then(function(coupon) {
      	console.log("Saved new coupon");
      	listCoupons()
      	$scope.showAddCoupon = false;
    		if(!$scope.$$phase) $scope.$apply();

        // $scope.pricingOptions.push(subscription); 
        // $scope.returnedSubscription = subscription;
      })
    }

    $scope.keyPressed = function(key, enteredSoFar) {
      if (key.keyCode === 13) $scope.searchForUser(enteredSoFar)
    }

    $scope.scrollTop = function() {
      window.scrollTo(0, 0);
    }

    $scope.formatDate = function(dateToFormat) {
    	moment.locale('en');
    	return moment(dateToFormat*1000).format('l'); //Times 1000 to convert from Unix
    }

  });
