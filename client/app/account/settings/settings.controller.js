'use strict';

angular.module('bodyAppApp')
  .controller('SettingsCtrl', function ($scope, $http, $uibModal, $state, $rootScope, User, Auth) {
    var ref = new Firebase("https://bodyapp.firebaseio.com");
    $scope.errors = {};
    $scope.teammates = true;
    $scope.profilePage = false;
    $scope.billing = false;
    $scope.support = false;

    $scope.editingCreditCardInfo = false;
    var currentUser;
    
    if (Auth.getCurrentUser() && Auth.getCurrentUser().$promise) {
      Auth.getCurrentUser().$promise.then(function(user) {
        setUser(user)
      })            
    } else {
      setUser(Auth.getCurrentUser())
    }

    function setUser(user) {
      $scope.currentUser = user;  
      currentUser = $scope.currentUser;
      $scope.numReferrals = currentUser.referrals ? Object.keys(currentUser.referrals).length : 0;
      if ($scope.numReferrals) pullReferrals(currentUser);

      $scope.friendList = [];

      if (!$scope.currentUser.referralCode) {
        User.generateReferralCode({id: $scope.currentUser._id}, {}, function(user){
            console.log("Successfully generated referral code " + user.referralCode)
            $scope.currentUser = user;
            Auth.updateUser(user)
        }, function(err){console.log(err)})
      }

      //Temporary campaign.  Delete 3/21
      if (!$scope.currentUser.singleParentCode && $scope.currentUser.stripe.subscription.status === "active") {
        User.generateSingleParentCoupon({id: $scope.currentUser._id}, {}, function(user){
            console.log("Successfully generated single parent code " + user.singleParentCode)
            $scope.currentUser = user;
            Auth.updateUser(user)
        }, function(err){console.log('error generating single parent code code: ' + err)})
      }
      
      pullFriendPictures()
    }
    
    
    // $scope.subEndDate;
    // if ($scope.currentUser.stripe && $scope.currentUser.stripe.subscription) {
    //   if ($scope.currentUser.stripe.subscription.endDate) {
    //     console.log($scope.currentUser.stripe.subscription.endDate)
    //     $scope.subEndDate = new Date($scope.currentUser.stripe.subscription.endDate*1000)
    //   } else { 
    //     var now = new Date();
    //     if (now.getMonth() == 11) {
    //         $scope.subEndDate = new Date(now.getFullYear() + 1, 0, 1);
    //     } else {
    //         $scope.subEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    //     }
    //   }
    // }

    function pullFriendsFromFbObjects() {

    }

    function pullReferrals(user) {
      $scope.referrals = []
      for (var referee in user.referrals) {
        console.log(user.referrals[referee]);
    
        ref.child("fbUsers").child(user.referrals[referee].facebookId).once('value', function(snapshot) {
          console.log(snapshot.val())
          $scope.referrals.push(snapshot.val())
          if(!$scope.$$phase) $scope.$apply();
        })
      }
    }


   $scope.saveNewEmail = function(emailToSave) {
      console.log(emailToSave)
      User.saveEmailAddress({id: $scope.currentUser._id}, {email: emailToSave}, function(user){
          console.log("Email successfully updated.")
          $scope.currentUser = user;
          Auth.updateUser(user)
          $scope.editingEmail = false;
      }, function(err){console.log('error saving new email: ' + err)})
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
            $rootScope.subscriptionActive = false;
            // modalInstance.close() //Adds x so they can close themselves
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
      if ($rootScope.subscriptionActive) {
            return true;
      } else {
        var modalInstance = $uibModal.open({
          animation: true,
          templateUrl: 'app/membership/membership.html',
          controller: 'MembershipCtrl',
          windowClass: "modal-wide",
          resolve: {
            slot: function() {
              return undefined
            }
          }
        });

        modalInstance.result.then(function () {
          currentUser = Auth.getCurrentUser()
          $scope.currentUser = currentUser;
          if(!$scope.$$phase) $scope.$apply();
        }, function () {
          currentUser = Auth.getCurrentUser()
          $scope.currentUser = currentUser;
          if(!$scope.$$phase) $scope.$apply();
        });
      }
      // var handler = StripeCheckout.configure({
      //     key: 'pk_live_mpdcnmXNQpt0zTgZPjD4Tfdi',
      //     image: '../../assets/images/body-stripe.jpg',
      //     locale: 'auto',
      //     token: function(token, args) {
      //       var modalInstance = openPaymentConfirmedModal()
      //       $http.post('/api/users/charge', {
      //         user: currentUser,
      //         stripeToken: token,
      //         shippingAddress: args,
      //       })
      //       .success(function(data) {
      //           console.log("Successfully posted to /user/charge");
      //           Auth.updateUser(data)
      //           currentUser = data
      //           $scope.currentUser = currentUser
      //           $scope.subEndDate = new Date($scope.currentUser.stripe.subscription.endDate*1000)
      //           // modalInstance.close() //Added x to this, so user can close themselves once they've read it.
      //       })
      //       .error(function(err) {
      //           console.log(err)
      //           modalInstance.close();
      //           if (err.message) return alert(err.message + " Please try again or contact daniel@getbodyapp.com for assistance.")
      //           return alert("We had trouble processing your payment. Please try again or contact daniel@getbodyapp.com for assistance.")
      //       }.bind(this));
      //     }
      // });

      // if (currentUser.stripe && currentUser.stripe.customer && currentUser.stripe.customer.customerId) {
      //   //If user has already signed up previously
      //     if (!currentUser.email || (currentUser.email && currentUser.email.length < 4)) {
      //         handler.open({
      //           name: 'BODY SUBSCRIPTION',
      //           description: '$10/mo Pilot Price!',
      //           panelLabel: "Pay {{amount}} / Month",
      //           zipCode: true,
      //           shippingAddress: true,
      //           amount: 1000
      //         });    
      //     } else {
      //         handler.open({
      //           name: 'BODY SUBSCRIPTION',
      //           email: currentUser.email,
      //           description: '$10/mo Pilot Price!',
      //           panelLabel: "Pay {{amount}} / Month",
      //           zipCode: true,
      //           shippingAddress: true,
      //           amount: 1000
      //         });
      //     }
      // } else {
      //     if (!currentUser.email || (currentUser.email && currentUser.email.length < 4)) {
      //         handler.open({
      //           name: 'BODY SUBSCRIPTION',
      //           description: '$10/mo Pilot Price!',
      //           panelLabel: "Pay {{amount}} / Month",
      //           zipCode: true,
      //           shippingAddress: true,
      //           amount: 1000
      //         });    
      //     } else {
      //         handler.open({
      //           name: 'BODY SUBSCRIPTION',
      //           email: currentUser.email,
      //           description: '$10/mo Pilot Price!',
      //           panelLabel: "Pay {{amount}} / Month",
      //           zipCode: true,
      //           shippingAddress: true,
      //           amount: 1000
      //         });
      //     }
      // }
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
        $scope.currentUser = Auth.getCurrentUser();
        currentUser = $scope.currentUser;
        if(!$scope.$$phase) $scope.$apply();
      }, function () {
        $log.info('Modal dismissed at: ' + new Date());
        $scope.currentUser = Auth.getCurrentUser();
        currentUser = $scope.currentUser;
        if(!$scope.$$phase) $scope.$apply();
      });

      return modalInstance;
    }

    $scope.changeCard = function() {

    }

    function openCancellationConfirmedModal() {
        var modalInstance = $uibModal.open({
          animation: true,
          templateUrl: 'app/account/settings/cancellation.html',
          controller: 'CancellationCtrl',
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
