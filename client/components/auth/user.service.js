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
      getInstructors: {
        method: 'GET',
        isArray: true,
        params: {
          id:'instructors'
        }
      },
      getTwilioAccessToken: {
        method: 'GET',
        params: {
          controller:'twilioAccessToken'
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
      saveEmailAddress: {
        method: 'PUT',
        params: {
          controller:'saveEmail'
        }
      },
	  });
  });
