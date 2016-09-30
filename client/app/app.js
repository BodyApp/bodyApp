'use strict';

angular.module('bodyAppApp', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  // 'btford.socket-io',
  'ui.router',
  'ui.bootstrap',
  'firebase',
  'jshor.angular-addtocalendar',
  'SoundCloud',
  'timer',
  // "checklist-model",
  // "angularScreenfull",
  // 'angular-tour',
  // 'duScroll',
  // 'ngclipboard',
  // 'ngTagsInput',
  'ngMaterial',
  'ngMaterialDatePicker',
  'lfNgMdFileInput',
  // 'ngMessages',
  'ae-datetimepicker',
  'updateMeta',
  'angular-svg-round-progressbar',
  // 'djds4rce.angular-socialshare',
  // 'ezfb',
  '720kb.socialshare',
  'vjs.video'
  // 'ngRoute'
])
  .config(function ($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider) {
    $locationProvider.html5Mode(true);
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

    
    // $locationProvider.hashPrefix('#!');
    $httpProvider.interceptors.push('authInterceptor');
  })

  // .config(['socialshareConfProvider', function configApp(socialshareConfProvider) {

    // socialshareConfProvider.configure([
    //   {
    //     'provider': 'twitter',
    //     'conf': {
    //       'url': 'https://www.getbodyapp.com',
    //       'text': '720kb is enough',
    //       'via': 'npm',
    //       'hashtags': 'angularjs,socialshare,angular-socialshare',
    //       'trigger': 'click',
    //       'popupHeight': 800,
    //       'popupWidth' : 400
    //     }
    //   },
    //   {
    //     'provider': 'facebook',
    //     'conf': {
    //       'url': 'https://www.getbodyapp.com',
    //       'via': '501927126632986',
    //       'trigger': 'click',
    //       'popupHeight': 600,
    //       'popupWidth' : 600
    //     }
    //   }
    // //and so on ...
    // ]);
  // }])

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

  .run(function ($rootScope, $state, $window, $location, Auth) {
    $rootScope.$on('$routeChangeSuccess', function(evt, absNewUrl, absOldUrl, fromState, fromParams){
      $window.scrollTo(0,0);    //scroll to top of page after each route change

      var path = $location.path();
      var querystring = '';
      var referrer = '';

      if (path.indexOf('?') !== 1) {
        querystring = path.substring(path.indexOf('?'), path.length);
      }

      if (fromState.name) {
        referrer = $location.protocol() + '://' + $location.host() + '/#' + fromState.url;
      }

      analytics.page({
        path: path,
        referrer: referrer,
        search: querystring,
        url: $location.absUrl()
      })
    })
    // Redirect to login if route requires auth and you're not logged in
    $rootScope.$on('$stateChangeStart', function (event, next) {
      Auth.isLoggedInAsync(function(loggedIn) {
        if (next.authenticate && !loggedIn) {
          event.preventDefault();
          $state.go('main');
        } else if (loggedIn) {
          analytics.identify(Auth.getCurrentUser()._id, {
            firstName: Auth.getCurrentUser().firstName,
            lastName: Auth.getCurrentUser().lastName,
            email: Auth.getCurrentUser().email,
            facebookId: Auth.getCurrentUser().facebookId,
            gender: Auth.getCurrentUser().gender,
            referredBy: Auth.getCurrentUser().referredBy
          })
          console.log("Booting Intercom")
          if (Auth.getCurrentUser().intercomHash) {
            Intercom("boot", {
              app_id: "daof2xrs",
              email: Auth.getCurrentUser().email,
              name: Auth.getCurrentUser().firstName + " " + Auth.getCurrentUser().lastName,
              user_id: Auth.getCurrentUser()._id,
              user_hash: Auth.getCurrentUser().intercomHash,
              widget: {
                activator: "#IntercomDefaultWidget"
              }
            });
          } else {
            User.createIntercomHash({id: user._id}, {}, function(user) {
              Intercom("boot", {
                app_id: "daof2xrs",
                email: user.email,
                name: user.firstName + " " + user.lastName,
                user_id: user._id,
                user_hash: user.intercomHash,
                widget: {
                  activator: "#IntercomDefaultWidget"
                }
              });
            })
          }
          Intercom('update');
        }
      });
      $window.scrollTo(0,0);    //scroll to top of page after each route change
    });
    // $FB.init('501927126632986')
    // ezfbProvider.setInitParams({
    //   appId: '501927126632986',
    // });  
  });
