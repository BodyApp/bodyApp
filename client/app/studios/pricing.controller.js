angular.module('bodyAppApp')
  .controller('PricingCtrl', function ($scope, $stateParams, Studios, Studio, $http, Auth, User) {
    var currentUser = Auth.getCurrentUser()
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
        if (user.firebaseToken) {
          ref.authWithCustomToken(user.firebaseToken, function(error, authData) {
            if (error) {
              Auth.logout();
              $window.location.reload()
              console.log("Firebase user authentication failed", error);
            } else {
              if (user.role === "admin") console.log("Firebase user authentication succeeded!", authData);
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
        $scope.subscriptionPlan = plans[0];
        // for (var plan = 0; plan < plans.length; plan++) { //This is no longer necessary as doing on backend.
        //   ref.child('stripeConnected').child('subscriptionPlans').child(plans[plan].id).update(plans[plan]) //Make sure subscription plans are all added to firebase and info is current.
        // }
      })
    }

    function getDropinPlan() {
    	ref.child("stripeConnected").child('dropinPlan').on('value', function(snapshot) {
    		$scope.dropinPlan = snapshot.val()
    		if(!$scope.$$phase) $scope.$apply();
    	})
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
    	$scope.showAddPricingPlan.pricingType = 'Drop In';
    }

    $scope.savePricingPlan = function(planToSave) {
    	if (planToSave.pricingType === 'Drop In') {
    		ref.child("stripeConnected").child('dropinPlan').update(planToSave, function(err) {
    			if (err) return console.log(err)
  				$scope.showAddPricingPlan = false;
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
	        // $scope.pricingOptions.push(subscription); 
	        // $scope.returnedSubscription = subscription;
	      })
    	}
    }

    $scope.keyPressed = function(key, enteredSoFar) {
      if (key.keyCode === 13) $scope.searchForUser(enteredSoFar)
    }

    $scope.scrollTop = function() {
      window.scrollTo(0, 0);
    }

  });
