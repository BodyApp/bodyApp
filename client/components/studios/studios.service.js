'use strict';

angular.module('bodyAppApp')
  .factory('Studio', function ($resource) {
    return $resource('/api/studios/:id/:controller', {
      id: '@_id'
    },
    {
      createSubscriptionPlan: {
        method: 'PUT',
        params: {
          controller: 'createSubscriptionPlan'
        }
      },
      deleteSubscriptionPlan: {
        method: 'PUT',
        params: {
          controller: 'deleteSubscriptionPlan'
        }
      },
      listSubscriptionPlans: {
        method: 'PUT',
        params: {
          controller: 'listSubscriptionPlans'
        }
      },
      listActiveSubscriptions: {
        method: 'PUT',
        params: {
          controller: 'listActiveSubscriptions'
        }
      },
      listCoupons: {
        method: 'PUT',
        params: {
          controller: 'listCoupons'
        }
      }
	  });
  });