'use strict';

angular.module('bodyAppApp')
  .controller('SettingsCtrl', function ($scope, $http, $uibModal, $state, User, Auth) {
    $scope.errors = {};
    $scope.teammates = true;
    $scope.profilePage = false;
    $scope.billing = false;
    $scope.support = false;

    $scope.editingCreditCardInfo = false;
    $scope.currentUser = Auth.getCurrentUser();
    var currentUser = $scope.currentUser;
    $scope.subEndDate;
    if ($scope.currentUser.stripe && $scope.currentUser.stripe.subscription) {
      $scope.subEndDate = new Date($scope.currentUser.stripe.subscription.endDate*1000)
    }

    $scope.friendList = [];

    var ref = new Firebase("https://bodyapp.firebaseio.com");
    pullFriendPictures()

    function pullFriendsFromFbObjects() {

    }


    function pullFriendPictures() {
      // for (var user in currentUser.friendListObject) {
      //   var userRef = ref.child("fbUsers").child(user)
      //   userRef.once('value', function(snapshot) {
      //     var userPulled = snapshot.val()
      //     if (userPulled) $scope.friendList.push(userPulled)
      //     if(!$scope.$$phase) $scope.$apply();
      //   })
      // }
      if (currentUser.friendList) {
        for (var i = 0; i < currentUser.friendList.length; i++) {
          var userRef = ref.child("fbUsers").child(currentUser.friendList[i].id)
          userRef.once('value', function(snapshot) {
            var userPulled = snapshot.val()
            if (userPulled) $scope.friendList.push(userPulled)
            if(!$scope.$$phase) $scope.$apply();
          })
        }     
      }
    }

    $scope.cancelSubscription = function() {
      if (confirm("Are you sure you want to cancel your subscription?")) {
        var modalInstance = openCancellationConfirmedModal()
        $http.post('/api/users/cancelsub', {
          user: Auth.getCurrentUser()
        })
        .success(function(data) {
            console.log("Successfully posted to /user/cancelsub");
            $scope.currentUser = data
            Auth.updateUser(data)
            modalInstance.close()
        })
        .error(function(err) {
            console.log("Error posting to /user/cancelsub: " + err)
        }.bind(this));
      }
    }

    $scope.formatEndDate = function(dateToFormat) {
      moment.locale('en')
      return moment(dateToFormat).format('LL');   // February 3, 2016
    }

    $scope.addSubscription = function() {
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
                $scope.subEndDate = new Date($scope.currentUser.stripe.subscription.endDate*1000)
                modalInstance.close()
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

      modalInstance.result.then(function (selectedItem) {
        $scope.selected = selectedItem;
      }, function () {
        $log.info('Modal dismissed at: ' + new Date());
      });

      return modalInstance;
    }

    $scope.changeCard = function() {

    }

    function openCancellationConfirmedModal() {
        var modalInstance = $uibModal.open({
          animation: true,
          templateUrl: 'app/account/settings/cancellation.html',
          controller: 'SettingsCtrl',
          backdrop: "static",
          keyboard: false
          // size: size,
          // resolve: {
          //   currentUser: function () {
          //     return currentUser;
          //   }
          // }
        });

        modalInstance.result.then(function (selectedItem) {
          $scope.selected = selectedItem;
        }, function () {
          $log.info('Modal dismissed at: ' + new Date());
        });

        return modalInstance;
    }

    $scope.setToSee = function(pageToView) {
      $scope.teammates = false;
      $scope.profilePage = false;
      $scope.billing = false;
      $scope.support = false;
      switch (pageToView) {
        case 0: return $scope.teammates = true; break;
        case 1: return $scope.profilePage = true; break;
        case 2: return $scope.billing = true; break;
        case 3: return $scope.support = true; break;
        default: break;
      }
    }

  //   $scope.changePassword = function(form) {
  //     $scope.submitted = true;
  //     if(form.$valid) {
  //       Auth.changePassword( $scope.user.oldPassword, $scope.user.newPassword )
  //       .then( function() {
  //         $scope.message = 'Password successfully changed.';
  //       })
  //       .catch( function() {
  //         form.password.$setValidity('mongoose', false);
  //         $scope.errors.other = 'Incorrect password';
  //         $scope.message = '';
  //       });
  //     }
		// };
  });
