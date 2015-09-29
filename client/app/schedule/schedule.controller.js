'use strict';

angular.module('bodyAppApp')
  .controller('ScheduleCtrl', function ($scope, $http, socket, $firebaseArray) {
    // connect to firebase 
    var ref = new Firebase("https://bodyapp.firebaseio.com/days");  
    var syncObject = $firebaseArray(ref);

    // three way data binding
    // syncObject.$bindTo($scope, 'days');
      
    $scope.days = {
        monday: {
            name: 'Mon',
            slots: {
              0800: {
                time: '8:00am',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: true
              },
              1100: {
                time: '11:00am',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: false
              },
              1600: {
                time: '4:00pm',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: false
              },
                2000: {
                time: '8:00pm',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: false
              }
            }
        },
          
        tuesday: {
            name: 'Tues',
            slots: {
              0800: {
                time: '8:00am',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: false
              },
              1100: {
                time: '11:00am',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: false
              },
              1600: {
                time: '4:00pm',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: false
              },
                2000: {
                time: '8:00pm',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: false
              }
            }
        },
          
        wednesday: {
            name: 'Wed',
            slots: {
              0800: {
                time: '8:00am',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: false
              },
              1100: {
                time: '11:00am',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: false
              },
              1600: {
                time: '4:00pm',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: false
              },
                2000: {
                time: '8:00pm',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: false
              }
            }
        },

        thursday: {
            name: 'Thurs',
            slots: {
              0800: {
                time: '8:00am',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: false
              },
              1100: {
                time: '11:00am',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: false
              },
              1600: {
                time: '4:00pm',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: false
              },
                2000: {
                time: '8:00pm',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: false
              }
            }
        },

        friday: {
            name: 'Fri',
            slots: {
              0800: {
                time: '8:00am',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: false
              },
              1100: {
                time: '11:00am',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: false
              },
              1600: {
                time: '4:00pm',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: false
              },
                2000: {
                time: '8:00pm',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: false
              }
            }
        },
        saturday: {
            name: 'Sat',
            slots: {
              0800: {
                time: '8:00am',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: false
              },
              1100: {
                time: '11:00am',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: false
              },
              1600: {
                time: '4:00pm',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: false
              },
                2000: {
                time: '8:00pm',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: false
              }
            }
        },

        sunday: {
            name: 'Sun',
            slots: {
              0800: {
                time: '8:00am',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: false
              },
              1100: {
                time: '11:00am',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: false
              },
              1600: {
                time: '4:00pm',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: false
              },
                2000: {
                time: '8:00pm',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: false
              }
            }
        }
    }

    // function to set the default data
    $scope.reset = function() {    
        syncObject.$add({
          monday: {
            name: 'Monday',
            slots: {
              0900: {
                time: '9:00am',
                booked: false
              },
              1100: {
                time: '11:00am',
                booked: false
              }
            }
          },
          tuesday: {
            name: 'Tuesday',
            slots: {
              0900: {
                time: '9:00am',
                booked: false
              },
              1100: {
                time: '11:00am',
                booked: false
              }
            }
          }
        });    
    };

        // $scope.awesomeThings = [];

        // $http.get('/api/things').success(function(awesomeThings) {
        //   $scope.awesomeThings = awesomeThings;
        //   socket.syncUpdates('thing', $scope.awesomeThings);
        // });
  });
