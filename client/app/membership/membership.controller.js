
'use strict';

angular.module('bodyAppApp')
  .controller('MembershipCtrl', function ($scope, $uibModal, $uibModalInstance, Auth, slot, User) {
    $(".arrow").click(function() {
      $('html,body').animate({
        scrollTop: $(".scroll-to").offset().top},
        600);
    });

	  var currentUser = Auth.getCurrentUser();
	  console.log(slot);

		$scope.joinClicked = function() {
			$uibModalInstance.dismiss('join');
			openStripePayment()
		}

		function openStripePayment() {
      var handler = StripeCheckout.configure({
        key: 'pk_live_mpdcnmXNQpt0zTgZPjD4Tfdi',
        image: '../../assets/images/body-app-logo-header.png',
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
              modalInstance.close()
              bookClass(slot)
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
        slot.bookedUsers = slot.bookedUsers || {};
        // slot.bookedFbUserIds = slot.bookedFbUserIds || {};
        slot.bookedUsers[currentUser._id] = {firstName: currentUser.firstName, lastName: currentUser.lastName, timeBooked: new Date().getTime(), injuries: currentUser.injuries, picture: currentUser.picture, facebookId: currentUser.facebookId};
        // slot.bookedFbUserIds[currentUser.facebook.id] = true
        // slot.$save();
        currentUser = user;
        $scope.currentUser = currentUser;
      }, function(err) {
          console.log("Error adding class: " + err)
          slot.bookedUsers = slot.bookedUsers || {};
          delete slot.bookedUsers[currentUser._id];
          // delete slot.bookedFbUserIds[currentUser.facebook.id];
          alert("sorry, there was an issue booking your class.  Please try reloading the site and booking again.  If that doesn't work, contact the BODY help team at (216) 408-2902 to get this squared away.")    
      }).$promise;
    }

	});