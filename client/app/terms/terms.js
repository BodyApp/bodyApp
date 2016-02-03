'use strict';

angular.module('bodyAppApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('terms', {
        url: '/terms',
        templateUrl: 'app/terms/terms.html',
        controller: 'TermsCtrl'
      })
      .state('privacy', {
        url: '/privacy',
        templateUrl: 'app/terms/privacy.html',
        controller: 'TermsCtrl'
      })
      .state('membership_agreement', {
        url: '/membership_agreement',
        templateUrl: 'app/terms/membership_agreement.html',
        controller: 'TermsCtrl'
      })
      .state('acceptable_use', {
        url: '/acceptable_use',
        templateUrl: 'app/terms/acceptable_use.html',
        controller: 'TermsCtrl'
      })
      .state('medical_disclaimer', {
        url: '/medical_disclaimer',
        templateUrl: 'app/terms/medical_disclaimer.html',
        controller: 'TermsCtrl'
      })      
  });