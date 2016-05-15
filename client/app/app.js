'use strict';

angular.module('bodyAppApp', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'btford.socket-io',
  'ui.router',
  'ui.bootstrap',
  'firebase',
  'jshor.angular-addtocalendar',
  'SoundCloud',
  'timer',
  "checklist-model",
  "angularScreenfull",
  'angular-tour',
  'duScroll',
  'ngclipboard',
  'ngTagsInput',
  'ngMaterial',
  'ngMaterialDatePicker'
])
  .config(function ($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider) {
    $urlRouterProvider
      
    // .rule(function ($injector, $location, Referral) {
    //  //what this function returns will be set as the $location.url
    //   var path = $location.path(), normalized = path.toLowerCase();
      
    //   if (path != normalized) {
    //       //instead of returning a new url string, I'll just change the $location.path directly so I don't have to worry about constructing a new url string and so a new state change is not triggered
    //       $location.replace().path(normalized);
    //   }
    //   console.log(path) 
    //   Referral.setReferralCode(path.slice(1))
    // })
    .otherwise('/');

    $locationProvider.html5Mode(true);
    // $locationProvider.hashPrefix('#!');
    $httpProvider.interceptors.push('authInterceptor');
  })

  .factory('authInterceptor', function ($rootScope, $q, $cookieStore, $location) {
    return {
      // Add authorization token to headers
      request: function (config) {
        config.headers = config.headers || {};
        if ($cookieStore.get('token')) {
          config.headers.Authorization = 'Bearer ' + $cookieStore.get('token');
        }
        return config;
      },

      // Intercept 401s and redirect you to schedule (since login is a modal)
      responseError: function(response) {
        if(response.status === 401) {
          $location.path('/');
          // remove any stale tokens
          $cookieStore.remove('token');
          return $q.reject(response);
        }
        else {
          return $q.reject(response);
        }
      }
    };
  })

  .run(function ($rootScope, $state, $window, Auth) {
    $rootScope.$on('$routeChangeSuccess', function(evt, absNewUrl, absOldUrl){
      $window.scrollTo(0,0);    //scroll to top of page after each route change
    })
    // Redirect to login if route requires auth and you're not logged in
    $rootScope.$on('$stateChangeStart', function (event, next) {
      Auth.isLoggedInAsync(function(loggedIn) {
        if (next.authenticate && !loggedIn) {
          event.preventDefault();
          $state.go('main');
        }
      });
      $window.scrollTo(0,0);    //scroll to top of page after each route change
    });
  });
