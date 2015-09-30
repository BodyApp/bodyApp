'use strict';

angular.module('bodyAppApp')
  .controller('AdminCtrl', function ($scope, $http, Auth, User, $firebaseObject) {

    // Use the User $resource to fetch all users
    $scope.users = User.query();
    var todayDate = new Date();
    var todayDayOfWeek = todayDate.getDay();

    $scope.delete = function(user) {
      User.remove({ id: user._id });
      angular.forEach($scope.users, function(u, i) {
        if (u === user) {
          $scope.users.splice(i, 1);
        }
      });
    };
    $scope.seedCalendar = function() {    
      var dd = todayDate.getDate();
      var mm = todayDate.getMonth();
      var yy = todayDate.getFullYear();

      var sunDayWeek = 0;
      var monDayWeek = 1;
      var tuesDayWeek = 2;
      var wedDayWeek = 3;
      var thursDayWeek = 4;
      var friDayWeek = 5;
      var satDayWeek = 6;

      var sunDate = todayDate.getDate() + sunDayWeek - todayDayOfWeek;
      var monDate = todayDate.getDate() + monDayWeek - todayDayOfWeek;
      var tuesDate = todayDate.getDate() + tuesDayWeek - todayDayOfWeek;
      var wedDate = todayDate.getDate() + wedDayWeek - todayDayOfWeek;
      var thursDate = todayDate.getDate() + thursDayWeek - todayDayOfWeek;
      var friDate = todayDate.getDate() + friDayWeek - todayDayOfWeek;
      var satDate = todayDate.getDate() + satDayWeek - todayDayOfWeek;

      var ref = new Firebase("https://bodyapp.firebaseio.com/");  
      var syncObject = $firebaseObject(ref);

      syncObject.weekOf9272015 = {
        a: {
            name: 'Sun',
            dayOfWeek: sunDayWeek,
            // isToday: todayDayOfWeek == sunDayWeek,
            date: sunDate,
            formattedDate: getDayFormatter(sunDayWeek),
            slots: {
              0800: {
                time: '8:00am',
                booked: false,
                trainer: "Mendelson",
                unavailable: false,
                past: false,
                spots: 8,
                spotsTaken: 0,
              },
              1100: {
                time: '11:00am',
                booked: false,
                trainer: "Mendelson",
                unavailable: false,
                past: false,
                spots: 8,
                spotsTaken: 0,
              },
              1600: {
                time: '4:00pm',
                booked: false,
                trainer: "Mendelson",
                unavailable: false,
                past: false,
                spots: 8,
                spotsTaken: 0,
              },
              2000: {
                time: '8:00pm',
                booked: false,
                trainer: "Mendelson",
                unavailable: false,
                past: false,
                spots: 8,
                spotsTaken: 0,
              }
            }
        },

        b: {
            name: 'Mon',
            dayOfWeek: monDayWeek,
            // isToday: todayDayOfWeek == monDayWeek,
            date: monDate,
            formattedDate: getDayFormatter(monDayWeek),
            slots: {
              0800: {
                time: '8:00am',
                booked: false,
                trainer: "Mendelson",
                unavailable: false,
                past: false,
                spots: 8,
                spotsTaken: 0,

              },
              1100: {
                time: '11:00am',
                booked: false,
                trainer: "Mendelson",
                unavailable: false,
                past: false,
                spots: 8,
                spotsTaken: 0,
              },
              1600: {
                time: '4:00pm',
                booked: false,
                trainer: "Mendelson",
                unavailable: false,
                past: false,
                spots: 8,
                spotsTaken: 0,
              },
              2000: {
                time: '8:00pm',
                booked: false,
                trainer: "Mendelson",
                unavailable: false,
                past: false,
                spots: 8,
                spotsTaken: 0,
              }
            }
        },
          
        c: {
            name: 'Tues',
            dayOfWeek: tuesDayWeek,
            // isToday: todayDayOfWeek == tuesDayWeek,
            date: tuesDate,
            formattedDate:  getDayFormatter(tuesDayWeek),
            slots: {
              0800: {
                time: '8:00am',
                booked: false,
                trainer: "Mendelson",
                unavailable: false,
                past: false,
                spots: 8,
                spotsTaken: 0,
              },
              1100: {
                time: '11:00am',
                booked: false,
                trainer: "Mendelson",
                unavailable: false,
                past: false,
                spots: 8,
                spotsTaken: 0,
              },
              1600: {
                time: '4:00pm',
                booked: false,
                trainer: "Mendelson",
                unavailable: false,
                past: false,
                spots: 8,
                spotsTaken: 0,
              },
              2000: {
                time: '8:00pm',
                booked: false,
                trainer: "Mendelson",
                unavailable: false,
                past: false,
                spots: 8,
                spotsTaken: 0,
              }
            }
        },
          
        d: {
            name: 'Wed',
            dayOfWeek: wedDayWeek,
            // isToday: todayDayOfWeek == wedDayWeek,
            date: wedDate,
            formattedDate: getDayFormatter(wedDayWeek),
            slots: {
              0800: {
                time: '8:00am',
                booked: false,
                trainer: "Mendelson",
                unavailable: false,
                past: false,
                spots: 8,
                spotsTaken: 0,
              },
              1100: {
                time: '11:00am',
                booked: false,
                trainer: "Mendelson",
                unavailable: false,
                past: false,
                spots: 8,
                spotsTaken: 0,
              },
              1600: {
                time: '4:00pm',
                booked: false,
                trainer: "Mendelson",
                unavailable: false,
                past: false,
                spots: 8,
                spotsTaken: 0,
              },
              2000: {
                time: '8:00pm',
                booked: false,
                trainer: "Mendelson",
                unavailable: false,
                past: false,
                spots: 8,
                spotsTaken: 0,
              }
            }
        },

        e: {
            name: 'Thurs',
            dayOfWeek: thursDayWeek,
            // isToday: todayDayOfWeek == thursDayWeek,
            date: thursDate,
            formattedDate: getDayFormatter(thursDayWeek),
            slots: {
              0800: {
                time: '8:00am',
                booked: false,
                trainer: "Mendelson",
                unavailable: false,
                past: false,
                spots: 8,
                spotsTaken: 0,
              },
              1100: {
                time: '11:00am',
                booked: false,
                trainer: "Mendelson",
                unavailable: false,
                past: false,
                spots: 8,
                spotsTaken: 0,
              },
              1600: {
                time: '4:00pm',
                booked: false,
                trainer: "Mendelson",
                unavailable: false,
                past: false,
                spots: 8,
                spotsTaken: 0,
              },
              2000: {
                time: '8:00pm',
                booked: false,
                trainer: "Mendelson",
                unavailable: false,
                past: false,
                spots: 8,
                spotsTaken: 0,
              }
            }
        },

        f: {
            name: 'Fri',
            dayOfWeek: friDayWeek,
            // isToday: todayDayOfWeek == friDayWeek,
            date: friDate,
            formattedDate: getDayFormatter(friDayWeek),
            slots: {
              0800: {
                time: '8:00am',
                booked: false,
                trainer: "Mendelson",
                unavailable: false,
                past: false,
                spots: 8,
                spotsTaken: 0,
              },
              1100: {
                time: '11:00am',
                booked: false,
                trainer: "Mendelson",
                unavailable: false,
                past: false,
                spots: 8,
                spotsTaken: 0,
              },
              1600: {
                time: '4:00pm',
                booked: false,
                trainer: "Mendelson",
                unavailable: false,
                past: false,
                spots: 8,
                spotsTaken: 0,
              },
              2000: {
                time: '8:00pm',
                booked: false,
                trainer: "Mendelson",
                unavailable: false,
                past: false,
                spots: 8,
                spotsTaken: 0,
              }
            }
        },
        g: {
            name: 'Sat',
            dayOfWeek: satDayWeek,
            // isToday: todayDayOfWeek == satDayWeek,
            date: satDate,
            formattedDate: getDayFormatter(satDayWeek),
            slots: {
              0800: {
                time: '8:00am',
                booked: false,
                trainer: "Mendelson",
                unavailable: false,
                past: false,
                spots: 8,
                spotsTaken: 0,
              },
              1100: {
                time: '11:00am',
                booked: false,
                trainer: "Mendelson",
                unavailable: false,
                past: false,
                spots: 8,
                spotsTaken: 0,
              },
              1600: {
                time: '4:00pm',
                booked: false,
                trainer: "Mendelson",
                unavailable: false,
                past: false,
                spots: 8,
                spotsTaken: 0,
              },
              2000: {
                time: '8:00pm',
                booked: false,
                trainer: "Mendelson",
                unavailable: false,
                past: false,
                spots: 8,
                spotsTaken: 0,
              }
            }
          }
      }
    syncObject.$save();
    }

    function getDayFormatter(day) {
      var newDate = new Date();
      newDate.setDate(todayDate.getDate() + day - todayDayOfWeek);
      return newDate.getMonth() + 1 + "/" + newDate.getDate();
    }
  });
