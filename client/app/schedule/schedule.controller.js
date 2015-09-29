'use strict';

angular.module('bodyAppApp')
  .controller('ScheduleCtrl', function ($scope, $http, socket, $firebaseArray) {
    var todayDate = new Date()
    var todayDayOfWeek = todayDate.getDay()
    
    var dd = todayDate.getDate()
    var mm = todayDate.getMonth()
    var yy = todayDate.getFullYear()

    var sunDayWeek = 0
    var monDayWeek = 1
    var tuesDayWeek = 2
    var wedDayWeek = 3
    var thursDayWeek = 4
    var friDayWeek = 5
    var satDayWeek = 6

    var sunDate = todayDate.getDate() + sunDayWeek - todayDayOfWeek
    var monDate = todayDate.getDate() + monDayWeek - todayDayOfWeek
    var tuesDate = todayDate.getDate() + tuesDayWeek - todayDayOfWeek
    var wedDate = todayDate.getDate() + wedDayWeek - todayDayOfWeek
    var thursDate = todayDate.getDate() + thursDayWeek - todayDayOfWeek
    var friDate = todayDate.getDate() + friDayWeek - todayDayOfWeek
    var satDate = todayDate.getDate() + satDayWeek - todayDayOfWeek

    function getDayFormatter(day) {
        var newDate = new Date()
        newDate.setDate(todayDate.getDate() + day - todayDayOfWeek)
        return newDate.getMonth() + 1 + "/" + newDate.getDate()
    }

    // connect to firebase 
    var ref = new Firebase("https://bodyapp.firebaseio.com/days");  
    var syncObject = $firebaseArray(ref);

    // three way data binding
    // syncObject.$bindTo($scope, 'days');

    $scope.days = {
        sunday: {
            name: 'Sun',
            dayOfWeek: sunDayWeek,
            isToday: todayDayOfWeek == sunDayWeek,
            date: sunDate,
            formattedDate: getDayFormatter(sunDayWeek),
            slots: {
              0800: {
                time: '8:00am',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: false,
                spots: 8,
                spotsTaken: 0,
              },
              1100: {
                time: '11:00am',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: false,
                spots: 8,
                spotsTaken: 0,
              },
              1600: {
                time: '4:00pm',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: false,
                spots: 8,
                spotsTaken: 0,
              },
              2000: {
                time: '8:00pm',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: false,
                spots: 8,
                spotsTaken: 0,
              }
            }
        },

        monday: {
            name: 'Mon',
            dayOfWeek: monDayWeek,
            isToday: todayDayOfWeek == monDayWeek,
            date: monDate,
            formattedDate: getDayFormatter(monDayWeek),
            slots: {
              0800: {
                time: '8:00am',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: false,
                spots: 8,
                spotsTaken: 0,

              },
              1100: {
                time: '11:00am',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: false,
                spots: 8,
                spotsTaken: 0,
              },
              1600: {
                time: '4:00pm',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: false,
                spots: 8,
                spotsTaken: 0,
              },
              2000: {
                time: '8:00pm',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: false,
                spots: 8,
                spotsTaken: 0,
              }
            }
        },
          
        tuesday: {
            name: 'Tues',
            dayOfWeek: tuesDayWeek,
            isToday: todayDayOfWeek == tuesDayWeek,
            date: tuesDate,
            formattedDate:  getDayFormatter(tuesDayWeek),
            slots: {
              0800: {
                time: '8:00am',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: false,
                spots: 8,
                spotsTaken: 0,
              },
              1100: {
                time: '11:00am',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: false,
                spots: 8,
                spotsTaken: 0,
              },
              1600: {
                time: '4:00pm',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: false,
                spots: 8,
                spotsTaken: 0,
              },
              2000: {
                time: '8:00pm',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: false,
                spots: 8,
                spotsTaken: 0,
              }
            }
        },
          
        wednesday: {
            name: 'Wed',
            dayOfWeek: wedDayWeek,
            isToday: todayDayOfWeek == wedDayWeek,
            date: wedDate,
            formattedDate: getDayFormatter(wedDayWeek),
            slots: {
              0800: {
                time: '8:00am',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: false,
                spots: 8,
                spotsTaken: 0,
              },
              1100: {
                time: '11:00am',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: false,
                spots: 8,
                spotsTaken: 0,
              },
              1600: {
                time: '4:00pm',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: false,
                spots: 8,
                spotsTaken: 0,
              },
              2000: {
                time: '8:00pm',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: false,
                spots: 8,
                spotsTaken: 0,
              }
            }
        },

        thursday: {
            name: 'Thurs',
            dayOfWeek: thursDayWeek,
            isToday: todayDayOfWeek == thursDayWeek,
            date: thursDate,
            formattedDate: getDayFormatter(thursDayWeek),
            slots: {
              0800: {
                time: '8:00am',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: false,
                spots: 8,
                spotsTaken: 0,
              },
              1100: {
                time: '11:00am',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: false,
                spots: 8,
                spotsTaken: 0,
              },
              1600: {
                time: '4:00pm',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: false,
                spots: 8,
                spotsTaken: 0,
              },
              2000: {
                time: '8:00pm',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: false,
                spots: 8,
                spotsTaken: 0,
              }
            }
        },

        friday: {
            name: 'Fri',
            dayOfWeek: friDayWeek,
            isToday: todayDayOfWeek == friDayWeek,
            date: friDate,
            formattedDate: getDayFormatter(friDayWeek),
            slots: {
              0800: {
                time: '8:00am',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: false,
                spots: 8,
                spotsTaken: 0,
              },
              1100: {
                time: '11:00am',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: false,
                spots: 8,
                spotsTaken: 0,
              },
              1600: {
                time: '4:00pm',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: false,
                spots: 8,
                spotsTaken: 0,
              },
              2000: {
                time: '8:00pm',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: false,
                spots: 8,
                spotsTaken: 0,
              }
            }
        },
        saturday: {
            name: 'Sat',
            dayOfWeek: satDayWeek,
            isToday: todayDayOfWeek == satDayWeek,
            date: satDate,
            formattedDate: getDayFormatter(satDayWeek),
            slots: {
              0800: {
                time: '8:00am',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: false,
                spots: 8,
                spotsTaken: 0,
              },
              1100: {
                time: '11:00am',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: false,
                spots: 8,
                spotsTaken: 0,
              },
              1600: {
                time: '4:00pm',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: false,
                spots: 8,
                spotsTaken: 0,
              },
              2000: {
                time: '8:00pm',
                booked: false,
                trainer: "J. Mendelson",
                unavailable: false,
                spots: 8,
                spotsTaken: 0,
              }
            }
          }
    }

    //Makes slots in the past unavailable
    for (var day in $scope.days) {
      if ($scope.days[day].dayOfWeek < todayDayOfWeek) {
        for (var slot in $scope.days[day].slots) {
          $scope.days[day].slots[slot].unavailable = true;
        }
      }
      //Makes slots earlier today unavailable
      if ($scope.days[day].dayOfWeek == todayDayOfWeek) {
        for (var slot in $scope.days[day].slots) {
          if (slot < todayDate.getHours()*100) {
            $scope.days[day].slots[slot].unavailable = true;
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
