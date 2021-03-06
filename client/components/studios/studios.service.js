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
        isArray: true,
        params: {
          controller: 'listSubscriptionPlans'
        }
      },
      listCustomers: {
        method: 'PUT',
        isArray: true,
        params: {
          controller: 'listCustomers'
        }
      },
      listCoupons: {
        method: 'PUT',
        isArray: true,
        params: {
          controller: 'listCoupons'
        }
      },
      createCoupon: {
        method: 'PUT',
        params: {
          controller: 'createCoupon'
        }
      },
      deleteCoupon: {
        method: 'PUT',
        params: {
          controller: 'deleteCoupon'
        }
      },
      checkCoupon: {
        method: 'PUT',
        params: {
          controller: 'checkCoupon'
        }
      },
      getUserRevenue: {
        method: 'GET',
        params: {
          controller: "getUserRevenue"
        }
      },
      sendCreatedStudioEmail: {
        method: 'PUT',
        params: {
          controller: 'sendCreatedStudioEmail'
        }
      }
	  });
  });