'use strict';

angular.module('bodyAppApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('referral', {
        url: '/referral/:referralCode',
        controller: function($stateParams, Referral, $location, $cookies) {
          // Referral.setReferralCode($stateParams.referralCode)
          analytics.track("wasReferredByUser", {referredBy: $stateParams.referralCode})
          $cookies.put('referredBy', $stateParams.referralCode);
          $location.path('/')
        }
      })
      .state('firstweekfree', {
        url: '/firstweekfree/:referralCode',
        controller: function($stateParams, Referral, $location, $cookies) {
          // Referral.setReferralCode($stateParams.referralCode)
          analytics.track("wasReferredByUser", {referredBy: $stateParams.referralCode})
          $cookies.put('referredBy', $stateParams.referralCode);
          $location.path('/')
        }
      })
      ;
  });