
'use strict';

angular.module('bodyAppApp')
  .controller('MembershipCtrl', function ($scope, $document, $http, $location, $uibModal, $uibModalInstance, $rootScope, Auth, slot, studioId, User, Schedule, Studio, accountId, $timeout) {

    // var studio = Schedule.getCurrentStudio()

    $scope.slot = slot;
    if (slot) {
      moment.locale('en')
      var slotDate = moment(slot.dateTime).format('M/D')
      var slotTime = moment(slot.dateTime).format('LT')
    }

    var planInfo;
    var dropinRate;
    var specialtyRate;
    var ref = firebase.database().ref().child('studios').child(studioId);
    var storageRef = firebase.storage().ref().child('studios').child(studioId);
    var decodedIcon;

    if (slot && slot.typeOfClass === 'Specialty') {
      ref.child('classTypes').child(slot.classType).once('value', function(snapshot) {
        specialtyRate = snapshot.val().specialtyClassRate*100
        $scope.specialtyRate = specialtyRate;
        $scope.classInfo = snapshot.val();
        if(!$scope.$$phase) $scope.$apply();
      })
    } else {
      getRates()
    }

    function getRates() {
      ref.child('stripeConnected').child('subscriptionPlans').once('value', function(snapshot) {
        if (!snapshot.exists()) return console.log("No subscription plans set for this studio.")
        planInfo = snapshot.val()[Object.keys(snapshot.val())[0]]
        $scope.planInfo = planInfo;
        if(!$scope.$$phase) $scope.$apply();
        getInstructorPicture()
        getStudioName()
        getStudioPicture();
      })

      ref.child('stripeConnected').child('dropinPlan').once('value', function(snapshot) {
        if (!snapshot.exists()) return console.log("No dropin plan set for this studio.")
        dropinRate = snapshot.val().amount
        $scope.dropinRate = dropinRate;
        if(!$scope.$$phase) $scope.$apply();
        getInstructorPicture()
        getStudioName()
      })  
    }

    function getStudioName() {
      ref.child('storefrontInfo').child('studioName').once('value', function(snapshot) {
        $scope.studioName = snapshot.val()
      })
    }

    function getStudioPicture() {
      storageRef.child('images/icon.jpg').getDownloadURL().then(function(url) {
        $scope.iconUrl = url;
        decodedIcon = decodeURI(url)
        console.log($scope.iconUrl)
        if(!$scope.$$phase) $scope.$apply();
      }).catch(function(error) {
        console.log(error)
      });
    }

    function getInstructorPicture() {
      if (!slot) return
      ref.child('instructors').child(slot.instructor).child('picture').once('value', function(snapshot) {
        $scope.instructorPicture = snapshot.val();
      })
    }
    

    $scope.closeModal = function() {
      $uibModalInstance.close()
    }

  	$scope.scrollDown = function() {

  		// var container = angular.element(document.getElementById('membershipModal'));
  		// var section2 = angular.element(document.getElementById('scroll-link2'));
  		// $uibModalInstance.scrollTo(section2, 0, 1000);


  		// // var top = 400;
	   //  var duration = 2000; //milliseconds

	   //  //Scroll to the exact position
	   //  // $document.scrollTop(top, duration).then(function() {
	   //  //   console && console.log('You just scrolled to the top!');
	   //  // });

	   //  var offset = 30; //pixels; adjust for floating menu, context etc
	   //  //Scroll to #some-id with 30 px "padding"
	   //  //Note: Use this in a directive, not with document.getElementById 
	   //  var someElement = angular.element(document.getElementById('scroll-link2'));
	   //  $document.scrollToElement(someElement, offset, duration, someElement);


  		// var someElement = angular.element(document.getElementById('scroll-link2'));
    // 	$document.scrollToElementAnimated(someElement);
  		// var elem = document.getElementById('scroll-link2')
	  	// var pos = 100;
  		
  		// function scrollTo(elem, pos) {
	  	// 	var y = elem.scrollTop;
		  //   y += (pos - y) * 0.3;
		  //   if (Math.abs(y-pos) < 2)
		  //   {
		  //       elem.scrollTop = pos;
		  //       return;
		  //   }
		  //   elem.scrollTop = y;
		  //   setTimeout(scrollTo, 40, elem, pos); 
		  // }
  		document.getElementById('scroll-link1').scrollIntoView()
  		// $scope.scrollPosition = 100;
  		// $location.hash(idToScrollTo);
    //   anchorSmoothScroll.scrollTo(idToScrollTo);
  	}
    // $(".arrow").click(function() {
    // 	console.log("Clicked arrow.")
    //   $('html,body,membershipModal').animate({
    //     scrollTop: $(".scroll-to").offset().top},
    //     600);
    // });

	  var currentUser = Auth.getCurrentUser();
    // $scope.couponEntered = currentUser.referredBy;

    // if ($scope.couponEntered) {
      // User.checkCoupon({ id: currentUser._id }, {
      //   couponString: $scope.couponEntered
      // }, function(coupon) {
      //   if (!coupon.valid) {
      //     $scope.couponEntered = undefined
      //   }
      // }, function(err) {
      //     $scope.couponEntered = undefined
      //     console.log("sorry, there was an issue retrieving your coupon discount.  Please try reloading the site and trying again.  If that doesn't work, contact the BODY help team at concierge@getbodyapp.com to get this squared away.")    
      // }).$promise
    //   Studio.checkCoupon({ id: currentUser._id }, {
    //     couponString: $scope.couponEntered,
    //     studioId: studioId
    //   }, function(coupon) {
    //     if (!coupon.valid) {
    //       $scope.couponEntered = undefined
    //     }
    //   }, function(err) {
    //       $scope.couponEntered = undefined
    //       console.log("sorry, there was an issue retrieving your coupon discount.  Please try reloading the site and trying again.  If that doesn't work, contact the BODY help team at concierge@getbodyapp.com to get this squared away.")    
    //   }).$promise
    // }

    $scope.applyCoupon = function() {
      Studio.checkCoupon({ id: currentUser._id }, {
          couponString: $scope.couponEntered,
          studioId: studioId
        }, function(coupon) {
          if (coupon.valid) {
            console.log("Coupon valid") 
            $scope.validCoupon = coupon;
            console.log(coupon)
            if(!$scope.$$phase) $scope.$apply();
          } else {
            $scope.invalidCouponEntered = true;
            $scope.enterCoupon = false;
            if(!$scope.$$phase) $scope.$apply();
          }
        }, function(err) {
            $scope.couponEntered = undefined;
            $scope.enterCoupon = false;
            $scope.invalidCouponEntered = true;
            if(!$scope.$$phase) $scope.$apply();
            console.log("sorry, there was an issue retrieving your coupon discount.  Please try reloading the site and trying again.  If that doesn't work, contact the BODY help team at concierge@getbodyapp.com to get this squared away.")    
        }).$promise
    }

		$scope.joinClicked = function(couponEntered) {
      if (!$scope.validCoupon) {
  			openStripePayment()
      } else if (couponEntered === currentUser.referralCode){
        $scope.userEnteredOwnCoupon = true;
        if(!$scope.$$phase) $scope.$apply();
      } else {
        openStripePayment($scope.validCoupon)
      }
		}

    $scope.payClicked = function() {
      openStripeDropIn()
    }

		function openStripePayment(coupon) {
      if ($rootScope.subscribing) return
      $rootScope.errorProcessingPayment = false;
      
      // ref.child('stripeConnected').child('subscriptionPlans').once('value', function(snapshot) {
      // if (!snapshot.exists()) return console.log("No subscription plans set for this studio.")
      
      // var planInfo = snapshot.val()[Object.keys(snapshot.val())[0]]
      // var planInfo = snapshot.val()
      if (!planInfo) return
      var amountToPay = planInfo.amount;
      // $scope.invalidCouponEntered = false; //Reset the invalid coupon warning
      $uibModalInstance.dismiss('join'); //Gets rid of membership modal.
      
      if (coupon && coupon.valid) {
        amountToPay = coupon.amount_off ? amountToPay - coupon.amount_off : amountToPay * (100-coupon.percent_off)/100;
      }

      var handler = StripeCheckout.configure({
        key: 'pk_live_mpdcnmXNQpt0zTgZPjD4Tfdi',
        // key: 'pk_test_dSsuXJ4SmEgOlv0Sz4uHCdiT',
        // image: $scope.iconUrl,
        locale: 'auto',
        token: function(token, args) {
          var modalInstance = openPaymentConfirmedModal()
          $rootScope.subscribing = true
          $http.post('/api/payments/addcustomersubscription', {
            stripeToken: token,
            shippingAddress: args,
            coupon: coupon,
            studioId: studioId,
            planInfo: planInfo,
            accountId: accountId
          })
          .success(function(data) {
            console.log("Successfully created new customer subscription.");
            // modalInstance.close();
            // Auth.updateUser(data);
            // currentUser = data;
            // currentUser = currentUser;
            // $rootScope.subscriptions = $rootScope.subscriptions || {};
            // $rootScope.subscriptions[studioId] = 'active';
            $rootScope.subscribing = false;
            if(!$scope.$$phase) $scope.$apply();
            if (slot) bookClass(slot);               
          })
          .error(function(err) {
            console.log(err)
            $rootScope.subscribing = false;
            $rootScope.errorProcessingPayment = true;
            if(!$scope.$$phase) $scope.$apply();
            // modalInstance.close()
            // return alert("We had trouble processing your payment. Please try again or contact daniel@getbodyapp.com for assistance.")
          }.bind(this));
        }
      });

      var handlerObject = {};
      handlerObject.name = $scope.studioName;
      handlerObject.description = (coupon && coupon.metadata.text && coupon.valid) ? coupon.metadata.text : "$" + amountToPay / 100 + "/mo Price!";
      handlerObject.panelLabel = "Pay $" + amountToPay / 100 + " / Month";
      handlerObject.shippingAddress = true;
      handlerObject.zipCode = true;
      // handlerObject.closed = function() { $rootScope.subscribing = false;}
      if (currentUser.email && currentUser.email.length > 4) {
        handlerObject.email = currentUser.email
      }
      handler.open(handlerObject)
    }  

    function openStripeDropIn() {
      if (!slot) return
      if ($rootScope.subscribing) return
      $rootScope.errorProcessingPayment = false;

      var amountToPay = dropinRate;
      // $scope.invalidCouponEntered = false;
      $uibModalInstance.dismiss('join');
      
      // if (coupon && coupon.valid) {
      //   amountToPay = coupon.amount_off ? amountToPay - coupon.amount_off : amountToPay * (100-coupon.percent_off)/100;
      // }
      // Stripe.setPublishableKey('pk_live_mpdcnmXNQpt0zTgZPjD4Tfdi');
      // console.log(Stripe.Coupons.retrieve("BODY4AYEAR", function(err, coupon) {console.log(coupon)}))
      var handler = StripeCheckout.configure({
        key: 'pk_live_mpdcnmXNQpt0zTgZPjD4Tfdi',
        // image: $scope.iconUrl.replace("252F", "2F"),
        locale: 'auto',
        token: function(token, args) {
          var modalInstance = openDropInPaymentConfirmedModal()
          $rootScope.subscribing = true;
          
          $http.post('/api/payments/chargedropin', {
            amount: dropinRate,
            stripeToken: token,
            shippingAddress: args,
            slot: slot,
            studioId: studioId,
            accountId: accountId
          })
          .success(function(data) {
            $rootScope.subscribing = false;
            $rootScope.errorProcessingPayment = false;
            if(!$scope.$$phase) $scope.$apply();
            console.log("Successfully posted to /user/chargedropin");
            // modalInstance.close()
            // Auth.updateUser(data);
            // currentUser = data;
            // currentUser = currentUser;
            // $rootScope.subscriptionActive = true;
            if (slot) bookClass(slot);
          })
          .error(function(err) {
            $rootScope.subscribing = false;
            $rootScope.errorProcessingPayment = true;
            if(!$scope.$$phase) $scope.$apply();
            console.log(err)
            // modalInstance.close()
            // if (err.message) return alert(err.message + " Please try again or contact daniel@getbodyapp.com for assistance.")
            // return alert("We had trouble processing your payment. Please try again or contact daniel@getbodyapp.com for assistance.")
          }.bind(this));
        }
      });
      // if (currentUser.stripe && currentUser.stripe.customer && currentUser.stripe.customer.customerId) {
        //If user has already signed up previously

      var handlerObject = {};
      handlerObject.name = '$'+amountToPay/100 +' DROP IN CLASS';
      handlerObject.description = "Book " + slotTime + " class on " + slotDate;
      handlerObject.panelLabel = "Pay $" + amountToPay / 100;
      handlerObject.shippingAddress = true;
      handlerObject.zipCode = true;
      // handlerObject.closed = function() { $rootScope.subscribing = false;}
      if (currentUser.email && currentUser.email.length > 4) {
        handlerObject.email = currentUser.email
      }
      handler.open(handlerObject)
    } 

    $scope.paySpecialtyClicked = function() {
      openStripeSpecialty()
    }

    $scope.chooseDropin = function() {
      $scope.dropinChosen = true;
    }

    $scope.chooseSubscription = function() {
      $scope.subscriptionChosen = true;
    }

    function openStripeSpecialty() {
      if (!slot) return
      if ($rootScope.subscribing) return
      $rootScope.errorProcessingPayment = false;
      
      var amountToPay = specialtyRate;
      // $scope.invalidCouponEntered = false;
      $uibModalInstance.dismiss('join');
      
      // if (coupon && coupon.valid) {
      //   amountToPay = coupon.amount_off ? amountToPay - coupon.amount_off : amountToPay * (100-coupon.percent_off)/100;
      // }
      // Stripe.setPublishableKey('pk_live_mpdcnmXNQpt0zTgZPjD4Tfdi');
      // console.log(Stripe.Coupons.retrieve("BODY4AYEAR", function(err, coupon) {console.log(coupon)}))
      var handler = StripeCheckout.configure({
        key: 'pk_live_mpdcnmXNQpt0zTgZPjD4Tfdi',
        // image: $scope.iconUrl.replace("252F", "2F"),
        locale: 'auto',
        token: function(token, args) {
          var modalInstance = openDropInPaymentConfirmedModal()
          $rootScope.subscribing = true
          $http.post('/api/payments/chargedropin', {
            amount: dropinRate,
            stripeToken: token,
            shippingAddress: args,
            slot: slot,
            studioId: studioId,
            accountId: accountId
          })
          .success(function(data) {
            $rootScope.subscribing = false;
            $rootScope.errorProcessingPayment = false;
            if(!$scope.$$phase) $scope.$apply();
            console.log("Successfully posted to /user/chargedropin");
            // modalInstance.close()
            // Auth.updateUser(data);
            // currentUser = data;
            // currentUser = currentUser;
            // $rootScope.subscriptionActive = true;
            if (slot) bookClass(slot);
          })
          .error(function(err) {
            $rootScope.subscribing = false;
            $rootScope.errorProcessingPayment = true;
            if(!$scope.$$phase) $scope.$apply();

            console.log(err)
            // modalInstance.close()
            // if (err.message) return alert(err.message + " Please try again or contact daniel@getbodyapp.com for assistance.")
            // return alert("We had trouble processing your payment. Please try again or contact daniel@getbodyapp.com for assistance.")
          }.bind(this));
        }
      });
      // if (currentUser.stripe && currentUser.stripe.customer && currentUser.stripe.customer.customerId) {
        //If user has already signed up previously

      var handlerObject = {};
      handlerObject.name = '$'+amountToPay/100 + " " + $scope.classInfo.name;
      handlerObject.description = slotTime + " on " + slotDate;
      handlerObject.panelLabel = "Pay $" + amountToPay / 100;
      handlerObject.shippingAddress = true;
      handlerObject.zipCode = true;
      // handlerObject.closed = function() { $rootScope.subscribing = false;}
      if (currentUser.email && currentUser.email.length > 4) {
        handlerObject.email = currentUser.email
      }
      handler.open(handlerObject)
    } 

    function openPaymentConfirmedModal() {
      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: 'app/account/payment/paymentThanks.html',
        controller: 'PaymentCtrl',
        backdrop: "static",
        resolve: {
          studioName: function() {
            return $scope.studioName;
          },
          instructorPicture: function() {
            return $scope.instructorPicture;
          }
        },
        keyboard: false
      });

      modalInstance.result.then(function () {
      }, function () {
      });

      return modalInstance;
    }	

    function openDropInPaymentConfirmedModal() {
      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: 'app/account/payment/dropInThanks.html',
        controller: 'PaymentCtrl',
        backdrop: "static",
        resolve: {
          studioName: function() {
            return $scope.studioName;
          },
          instructorPicture: function() {
            return $scope.instructorPicture;
          }
        },
        keyboard: false
      });

      modalInstance.result.then(function () {
      }, function () {
      });

      return modalInstance;
    } 

    function bookClass() {
    	var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: 'app/schedule/bookingConfirmation.html',
        controller: 'BookingConfirmationCtrl',
        resolve: {
          slot: function () {
            return slot;
          }
        }
      });

      modalInstance.result.then(function () {
      }, function () {
      });

      User.addBookedClass({ id: currentUser._id }, {
        classToAdd: slot.dateTime
      }, function(user) {
        // getInfo(slot.dateTime);
        ref.child("bookings").child(slot.dateTime).child(currentUser._id).update({firstName: currentUser.firstName, lastName: currentUser.lastName.charAt(0), timeBooked: new Date().getTime(), picture: currentUser.picture ? currentUser.picture : "", facebookId: currentUser.facebookId ? currentUser.facebookId : ""})
        ref.child("userBookings").child(currentUser._id).child(slot.dateTime).update({dateTime: slot.dateTime, instructor: slot.instructor, classType: slot.classType, workout: slot.workout})
        // ref.child("userBookings").child(currentUser._id).update({firstName: currentUser.firstName, lastName: currentUser.lastName, facebookId: currentUser.facebookId})           
        // slot.bookedUsers = slot.bookedUsers || {};
        // slot.bookedFbUserIds = slot.bookedFbUserIds || {};
        // slot.bookedUsers[currentUser._id] = {firstName: currentUser.firstName, lastName: currentUser.lastName.charAt(0), timeBooked: new Date().getTime(), picture: currentUser.picture, facebookId: currentUser.facebookId};
        // slot.bookedFbUserIds[currentUser.facebook.id] = true
        // slot.$save();
        currentUser = user;
        currentUser = currentUser;
      }, function(err) {
          console.log("Error adding class: " + err)
          ref.child("bookings").child(slot.dateTime).child(currentUser._id).remove()
          ref.child("userBookings").child(currentUser._id).child(slot.dateTime).remove()
          // slot.bookedUsers = slot.bookedUsers || {};
          // delete slot.bookedUsers[currentUser._id];
          // delete slot.bookedFbUserIds[currentUser.facebook.id];
          alert("sorry, there was an issue booking your class.  Please try reloading the site and booking again.  If that doesn't work, contact the BODY help team at (216) 408-2902 to get this squared away.")    
      }).$promise;
    }

	});