'use strict';

angular.module('bodyAppApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('referral', {
        url: '/referral/:referralCode',
        controller: function($stateParams, Referral, $location, $cookieStore) {
          // Referral.setReferralCode($stateParams.referralCode)
          $cookieStore.put('referredBy',$stateParams.referralCode);
          $location.path('/')
        }
      })
      ;
  });