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
  'angular-tour'
])
  .config(function ($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider) {
    $urlRouterProvider
      .otherwise('/');

    $locationProvider.html5Mode(true);
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

      // Intercept 401s and redirect you to login
      responseError: function(response) {
        if(response.status === 401) {
          $location.path('/login');
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

  .run(function ($rootScope, $state, Auth) {
    // Stops the webRTC connection when not in video mode
    $rootScope.$on("$locationChangeStart",function(event, next, current){
      if (easyrtc.webSocket) {
        easyrtc.disconnect()
        easyrtc.webSocket.disconnect() 
        easyrtc.hangupAll()
      }
    });

    $rootScope.$on("$destroy",function(event, next, current){
      // if (easyrtc.webSocket) {
        easyrtc.disconnect()
        easyrtc.webSocket.disconnect() 
        easyrtc.hangupAll()
      // }
    });

    // Redirect to login if route requires auth and you're not logged in
    $rootScope.$on('$stateChangeStart', function (event, next) {
      Auth.isLoggedInAsync(function(loggedIn) {
        if (next.authenticate && !loggedIn) {
          event.preventDefault();
          $state.go('login');
        }
      });
    });
  });
