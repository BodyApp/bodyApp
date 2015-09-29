'use strict';

angular.module('bodyAppApp')
  .controller('ScheduleCtrl', function ($scope, $http, socket, $firebaseArray) {
    var todayDate = new Date()
    console.log(todayDate)
    var todayDayOfWeek = todayDate.getDay()
    
    var dd = todayDate.getDate()
    var mm = todayDate.getMonth()
    var yy = todayDate.getFullYear()

    function getDayFormatter(day) {
        var sunDate = new Date()
        sunDate.setDate(todayDate.getDate() + day - todayDayOfWeek)
        return sunDate.getMonth() + 1 + "/" + sunDate.getDate()
    }

    // connect to firebase 
    var ref = new Firebase("https://bodyapp.firebaseio.com/days");  
    var syncObject = $firebaseArray(ref);

    // three way data binding
    // syncObject.$bindTo($scope, 'days');
      
    $scope.days = {
        sunday: {
            name: 'Sun',
            date: getDayFormatter(0),
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

        monday: {
            name: 'Mon',
            date: getDayFormatter(1),
            slots: {
              0800: {
                time: '8:00am',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: true,

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
            date:  getDayFormatter(2),
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
            date: getDayFormatter(3),
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
            date: getDayFormatter(4),
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
            date: getDayFormatter(5),
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
            date: getDayFormatter(6),
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
