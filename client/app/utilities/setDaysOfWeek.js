angular.module('bodyAppApp')
   .factory('DayOfWeekSetter', function() {
   	return {
   		setDay: function(dayOfWeek) {
	       switch (dayOfWeek) {
          case 0: return "0Sun"; break;
          case 1: return "1Mon"; break;
          case 2: return "2Tue"; break;
          case 3: return "3Wed"; break;
          case 4: return "4Thu"; break;
          case 5: return "5Fri"; break;
          case 6: return "6Sat"; break;
          default: break;
	      }
   		}
   	}
  })
