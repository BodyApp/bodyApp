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
      createIntercomHash: {
        method: 'PUT',
        params: {
          controller:'createIntercomHash'
        }
      },
      addBookedClass: {
        method: 'PUT',
        params: {
          controller:'addBookedClass'
        }
      },
      cancelBookedClass: {
        method: 'PUT',
        params: {
          controller:'cancelBookedClass'
        }
      },
      tourtipShown: {
        method: 'PUT',
        params: {
          controller:'tourtipShown'
        }
      },
      addIntroClass: {
        method: 'PUT',
        params: {
          controller:'addIntroClass'
        }
      },
      cancelIntroClass: {
        method: 'PUT',
        params: {
          controller:'cancelIntroClass'
        }
      },
      takeIntroClass: {
        method: 'PUT',
        params: {
          controller:'takeIntroClass'
        }
      },
      pushTakenClass: {
        method: 'PUT',
        params: {
          controller:'pushTakenClass'
        }
      },
      saveClassTaught: {
        method: 'PUT',
        params: {
          controller:'saveClassTaught'
        }
      },
      addRating: {
        method: 'PUT',
        params: {
          controller:'addRating'
        }
      },
      saveResult: {
        method: 'PUT',
        params: {
          controller:'saveResult'
        }
      },
      saveInjuriesGoalsEmergency: {
        method: 'PUT',
        params: {
          controller:'saveInjuriesGoalsEmergency'
        }
      },
      saveEmergency: {
        method: 'PUT',
        params: {
          controller:'saveEmergency'
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
        method: 'PUT',
        params: {
          controller: 'getUser'
        }
      },
      getInstructorByEmail: {
        method: 'PUT',
        params: {
          controller: 'getInstructorByEmail'
        }
      },
      getMembersOfStudio: {
        method: 'PUT',
        isArray: true,
        params: {
          controller: 'getMembersOfStudio'
        }
      },
      getUserAndInjuries: {
        method: 'PUT',
        params: {
          controller: 'getUserAndInjuries'
        }
      },
      getInjuries: {
        method: 'PUT',
        params: {
          controller: 'getInjuries'
        }
      },
      checkCoupon: {
        method: 'PUT',
        params: {
          controller:'checkCoupon'
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
        method: 'PUT',
        params: {
          controller: 'createTokBoxSession'
        }
      },
      sendWelcomeEmail: {
        method: 'PUT',
        params: {
          controller:'sendWelcomeEmail'
        }
      },
      generateReferralCode: {
        method: 'PUT',
        params: {
          controller:'generateReferralCode'
        }
      },
      generateSingleParentCoupon: {
        method: 'PUT',
        params: {
          controller:'generateSingleParentCoupon'
        }
      },
      createTokBoxToken: {
        method: 'PUT',
        params: {
          controller: 'createTokBoxToken'
        }
      },
      saveTimezone: {
        method: 'PUT',
        params: {
          controller: 'saveTimezone'
        }
      },
      referredBy: {
        method: 'PUT',
        params: {
          controller: 'referredBy'
        }
      },
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
      },
      createFirebaseToken: {
        method: 'PUT',
        params: {
          controller: 'getFirebaseToken'
        }
      }
	  });
  });
