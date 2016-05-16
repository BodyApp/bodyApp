angular.module('bodyAppApp')
  .controller('PricingCtrl', function ($scope, $stateParams, $window, $state, Studios, Studio, $http, Auth, User) {
    var currentUser = Auth.getCurrentUser()
    if (!Studios.isAdmin() && currentUser.role != 'admin') $state.go('storefront');
    var ref;
    var studioId = $stateParams.studioId;
    $scope.studioId = studioId;
    $scope.classToCreate = {};
    Studios.setCurrentStudio(studioId);
    if (studioId) {
      ref = new Firebase("https://bodyapp.firebaseio.com/studios").child(studioId);
    } else {
      // $location.path('/ralabala/admin')
      ref = new Firebase("https://bodyapp.firebaseio.com/studios").child("ralabala");
    }

    ref.onAuth(function(authData) {
      if (authData) {
        console.log("User is authenticated with fb ");
        listCoupons();
        listSubscriptionPlans();
        getDropinPlan();
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
              listCoupons();
              listSubscriptionPlans();
              getDropinPlan();
            }
          }); 
        } else {
          Auth.logout();
          $window.location.reload()
        }
      }
    })

    function listCoupons() {
      Studio.listCoupons({
        id: currentUser._id
      }, { //Can also pass a limit in later to prevent thousands of subscriptions being pulled
        studioId: studioId,
        limit: 100
      }).$promise.then(function(existingCoupons) {
        console.log("Retrieved " + existingCoupons.length + " coupons");
        $scope.existingCoupons = existingCoupons;
      })
    }

    function listSubscriptionPlans() {
      Studio.listSubscriptionPlans({
        id: currentUser._id
      }, {
        studioId: studioId
      }).$promise.then(function(plans) {
        console.log("Retrieved " + plans.length + " subscription plans");
        if (plans.length < 1) return $scope.subscriptionPlan = false;
        $scope.subscriptionPlan = plans[0];
        if(!$scope.$$phase) $scope.$apply();
        ref.child('storefrontInfo').update({subscriptionPricing: plans[0].amount})
        // for (var plan = 0; plan < plans.length; plan++) { //This is no longer necessary as doing on backend.
        //   ref.child('stripeConnected').child('subscriptionPlans').child(plans[plan].id).update(plans[plan]) //Make sure subscription plans are all added to firebase and info is current.
        // }
      })
    }

    function getDropinPlan() {
    	ref.child("stripeConnected").child('dropinPlan').on('value', function(snapshot) {
        if (!snapshot.exists()) return
    		$scope.dropinPlan = snapshot.val()
        ref.child('storefrontInfo').update({dropinPricing: snapshot.val().amount})
    		if(!$scope.$$phase) $scope.$apply();
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
        planId: planId
      }).$promise.then(function(deletedPlanId) {
      	ref.child('stripeConnected').child('subscriptionPlans').child(planId).remove(function(err) {
      		if (err) return console.log(err);
      		listSubscriptionPlans()
      		console.log("Deleted subscription plan with id: " + planId);
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
    	if (planToSave.pricingType === 'Drop In') {
    		planToSave.amount = planToSave.amountInDollars * 100;
    		ref.child("stripeConnected").child('dropinPlan').update(planToSave, function(err) {
    			if (err) return console.log(err)
  				$scope.showAddPricingPlan = false;
	    		if(!$scope.$$phase) $scope.$apply();
    		})
    	} else {
    		Studio.createSubscriptionPlan({
	        id: currentUser._id
	      }, {
	        studioId: studioId,
	        amount: planToSave.amountInDollars*100,
	        name: studioId + " BODY Subscription",
	        currency: "usd",
	        interval: "month",
	        statement_descriptor: studioId + " Subscription",
	        userThatCreatedPlan: currentUser._id
	      }).$promise.then(function(subscription) {
	      	console.log("Saved new subscription");
	      	listSubscriptionPlans()
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
    		console.log("Dropin plan removed");
    	})
    }

    $scope.editDropinPlan = function(planToEdit) {
    	$scope.showAddPricingPlan = planToEdit;
    	$scope.editing = true;
    }

    $scope.updateDropinPlan = function(planToEdit) {
    	planToEdit.amount = planToEdit.amountInDollars * 100;
    	ref.child("stripeConnected").child('dropinPlan').update(planToEdit, function(err) {
  			if (err) return console.log(err)
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
        couponId: couponToDelete.id
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
