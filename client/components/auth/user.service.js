'use strict';

angular.module('bodyAppApp')
  .factory('User', function ($resource) {
    return $resource('/api/users/:id/:controller', {
      id: '@_id'
    },
    {
      changePassword: {
        method: 'PUT',
        params: {
          controller:'password'
        }
      },
      get: {
        method: 'GET',
        params: {
          id:'me'
        }
      },
      addBookedClass: {
        method: 'PUT',
        params: {
          controller:'addBookedClass'
        }
      },
      saveClassTaught: {
        method: 'PUT',
        params: {
          controller:'saveClassTaught'
        }
      },
      getInstructors: {
        method: 'GET',
        isArray: true,
        params: {
          id:'instructors'
        }
      },
      getAdmins: {
        method: 'GET',
        isArray: true,
        params: {
          id:'admins'
        }
      },
      getUser: {
        method: 'GET',
        params: {
          id: 'getUser'
        }
      },
      getSubscription: {
        method: 'GET',
        params: {
          controller: 'getSubscription'
        }
      },
      saveEmailAddress: {
        method: 'PUT',
        params: {
          controller:'saveEmail'
        }
      },
      createTokBoxSession: {
        method: 'GET',
        params: {
          controller: 'createTokBoxSession'
        }
      },
      createTokBoxToken: {
        method: 'PUT',
        params: {
          controller: 'createTokBoxToken'
        }
      }
	  });
  });
