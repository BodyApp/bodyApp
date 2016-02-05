
'use strict';

angular.module('bodyAppApp')
  .controller('MembershipCtrl', function ($scope, $document, $http, $location, $uibModal, $uibModalInstance, Auth, slot, User) {

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

		$scope.joinClicked = function() {
			$uibModalInstance.dismiss('join');
			openStripePayment()
		}

		function openStripePayment() {
      var handler = StripeCheckout.configure({
        key: 'pk_live_mpdcnmXNQpt0zTgZPjD4Tfdi',
        image: '../../assets/images/body-stripe.jpg',
        locale: 'auto',
        token: function(token, args) {
          var modalInstance = openPaymentConfirmedModal()
          $http.post('/api/users/charge', {
            user: currentUser,
            stripeToken: token,
            shippingAddress: args,
          })
          .success(function(data) {
              console.log("Successfully posted to /user/charge");
              Auth.updateUser(data)
              currentUser = data
              $scope.currentUser = currentUser
              // modalInstance.close() //Added an x to the modal, so can close that way
              if (slot) bookClass(slot)  
          })
          .error(function(err) {
              console.log(err)
              modalInstance.close();
              if (err.message) return alert(err.message + " Please try again or contact daniel@getbodyapp.com for assistance.")
              return alert("We had trouble processing your payment. Please try again or contact daniel@getbodyapp.com for assistance.")
          }.bind(this));
        }
      });
      if (currentUser.stripe && currentUser.stripe.customer && currentUser.stripe.customer.customerId) {
        //If user has already signed up previously
        if (!currentUser.email || (currentUser.email && currentUser.email.length < 4)) {
          handler.open({
            name: 'BODY SUBSCRIPTION',
            description: '$10/mo Pilot Price!',
            panelLabel: "Pay {{amount}} / Month",
            shippingAddress: true,
            zipCode: true,
            amount: 1000
          });    
        } else {
          handler.open({
            name: 'BODY SUBSCRIPTION',
            email: currentUser.email,
            description: '$10/mo Pilot Price!',
            panelLabel: "Pay {{amount}} / Month",
            shippingAddress: true,
            zipCode: true,
            amount: 1000
          });
        }
      } else {
        if (!currentUser.email || (currentUser.email && currentUser.email.length < 4)) {
          handler.open({
            name: 'BODY SUBSCRIPTION',
            description: '$10/mo Pilot Price!',
            panelLabel: "Pay {{amount}} / Month",
            zipCode: true,
            shippingAddress: true,
            amount: 1000
          });    
        } else {
          handler.open({
            name: 'BODY SUBSCRIPTION',
            email: currentUser.email,
            description: '$10/mo Pilot Price!',
            panelLabel: "Pay {{amount}} / Month",
            zipCode: true,
            shippingAddress: true,
            amount: 1000
          });
        }
      }
    } 

    function openPaymentConfirmedModal() {
      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: 'app/account/payment/paymentThanks.html',
        controller: 'PaymentCtrl',
        backdrop: "static",
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
        classToAdd: slot.date
      }, function(user) {
        // getInfo(slot.date);
        ref.child("bookings").child(slot.date).child(currentUser._id).update({firstName: currentUser.firstName, lastName: currentUser.lastName.charAt(0), timeBooked: new Date().getTime(), picture: currentUser.picture, facebookId: currentUser.facebookId})
        ref.child("userBookings").child(currentUser._id).child(slot.date).update({date: slot.date, trainer: slot.trainer, level: slot.level})
        // slot.bookedUsers = slot.bookedUsers || {};
        // slot.bookedFbUserIds = slot.bookedFbUserIds || {};
        // slot.bookedUsers[currentUser._id] = {firstName: currentUser.firstName, lastName: currentUser.lastName.charAt(0), timeBooked: new Date().getTime(), picture: currentUser.picture, facebookId: currentUser.facebookId};
        // slot.bookedFbUserIds[currentUser.facebook.id] = true
        // slot.$save();
        currentUser = user;
        $scope.currentUser = currentUser;
      }, function(err) {
          console.log("Error adding class: " + err)
          ref.child("bookings").child(slot.date).child(currentUser._id).remove()
          ref.child("userBookings").child(currentUser._id).child(slot.date).remove()
          // slot.bookedUsers = slot.bookedUsers || {};
          // delete slot.bookedUsers[currentUser._id];
          // delete slot.bookedFbUserIds[currentUser.facebook.id];
          alert("sorry, there was an issue booking your class.  Please try reloading the site and booking again.  If that doesn't work, contact the BODY help team at (216) 408-2902 to get this squared away.")    
      }).$promise;
    }

	});