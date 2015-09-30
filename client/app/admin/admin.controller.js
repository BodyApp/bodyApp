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
      console.log("Seeding calendar");    
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

      var ref = new Firebase("https://bodyapp.firebaseio.com/weekof9272015");  
      var syncObject = $firebaseObject(ref);

      var sunDate = new Date();
      sunDate.setDate(todayDate.getDate() + sunDayWeek - todayDayOfWeek);
      console.log(sunDate.toJSON())
      var monDate = new Date();
      monDate.setDate(todayDate.getDate() + monDayWeek - todayDayOfWeek);
      var tuesDate = new Date();
      tuesDate.setDate(todayDate.getDate() + tuesDayWeek - todayDayOfWeek);
      var wedDate = new Date();
      wedDate.setDate(todayDate.getDate() + wedDayWeek - todayDayOfWeek);
      var thursDate = new Date();
      thursDate.setDate(todayDate.getDate() + thursDayWeek - todayDayOfWeek);
      var friDate = new Date();
      friDate.setDate(todayDate.getDate() + friDayWeek - todayDayOfWeek);
      var satDate = new Date();
      satDate.setDate(todayDate.getDate() + satDayWeek - todayDayOfWeek); 

      var a = 
      {
        name: 'Sun',
        dayOfWeek: sunDayWeek,
        // isToday: todayDayOfWeek == sunDayWeek,
        // date: sunDate.getTime(),
        formattedDate: getDayFormatter(sunDayWeek),
        slots: {
          0800: {
            time: '8:00am',
            booked: false,
            trainer: "Mendelson",
            classFull: false,
            past: true,
            spots: 8,
            spotsTaken: 0,
          },
          1100: {
            time: '11:00am',
            booked: false,
            trainer: "Mendelson",
            classFull: false,
            past: false,
            spots: 8,
            spotsTaken: 0,
          },
          1600: {
            time: '4:00pm',
            booked: false,
            trainer: "Mendelson",
            classFull: false,
            past: true,
            spots: 8,
            spotsTaken: 0,
          },
          2000: {
            time: '8:00pm',
            booked: false,
            trainer: "Mendelson",
            classFull: false,
            past: true,
            spots: 8,
            spotsTaken: 0,
          }
        }
      };
      
      var b = 
      {
        name: 'Mon',
        dayOfWeek: monDayWeek,
        // isToday: todayDayOfWeek == monDayWeek,
        // date: monDate.getTime(),
        formattedDate: getDayFormatter(monDayWeek),
        slots: {
          0800: {
            time: '8:00am',
            booked: false,
            trainer: "Mendelson",
            classFull: false,
            past: true,
            spots: 8,
            spotsTaken: 0,

          },
          1100: {
            time: '11:00am',
            booked: false,
            trainer: "Mendelson",
            classFull: false,
            past: true,
            spots: 8,
            spotsTaken: 0,
          },
          1600: {
            time: '4:00pm',
            booked: false,
            trainer: "Mendelson",
            classFull: false,
            past: true,
            spots: 8,
            spotsTaken: 0,
          },
          2000: {
            time: '8:00pm',
            booked: false,
            trainer: "Mendelson",
            classFull: false,
            past: true,
            spots: 8,
            spotsTaken: 0,
          }
        }
      };

      var c = 
      {
        name: 'Tues',
        dayOfWeek: tuesDayWeek,
        // isToday: todayDayOfWeek == tuesDayWeek,
        // date: tuesDate.getTime(),
        formattedDate:  getDayFormatter(tuesDayWeek),
        slots: {
          0800: {
            time: '8:00am',
            booked: false,
            trainer: "Mendelson",
            classFull: false,
            past: true,
            spots: 8,
            spotsTaken: 0,
          },
          1100: {
            time: '11:00am',
            booked: false,
            trainer: "Mendelson",
            classFull: false,
            past: true,
            spots: 8,
            spotsTaken: 0,
          },
          1600: {
            time: '4:00pm',
            booked: false,
            trainer: "Mendelson",
            classFull: false,
            past: true,
            spots: 8,
            spotsTaken: 0,
          },
          2000: {
            time: '8:00pm',
            booked: false,
            trainer: "Mendelson",
            classFull: false,
            past: true,
            spots: 8,
            spotsTaken: 0,
          }
        }
      };

      var d =
      {
        name: 'Wed',
        dayOfWeek: wedDayWeek,
        // isToday: todayDayOfWeek == wedDayWeek,
        // date: wedDate.getTime(),
        formattedDate: getDayFormatter(wedDayWeek),
        slots: {
          0800: {
            time: '8:00am',
            booked: false,
            trainer: "Mendelson",
            classFull: false,
            past: true,
            spots: 8,
            spotsTaken: 0,
          },
          1100: {
            time: '11:00am',
            booked: false,
            trainer: "Mendelson",
            classFull: false,
            past: true,
            spots: 8,
            spotsTaken: 0,
          },
          1600: {
            time: '4:00pm',
            booked: false,
            trainer: "Mendelson",
            classFull: false,
            past: false,
            spots: 8,
            spotsTaken: 0,
          },
          1725: {
            time: '5:25pm',
            booked: false,
            trainer: "Mendelson",
            classFull: false,
            past: false,
            spots: 8,
            spotsTaken: 0,
          }
        }
      };

      var e = 
      {
        name: 'Thurs',
        dayOfWeek: thursDayWeek,
        // isToday: todayDayOfWeek == thursDayWeek,
        // date: thursDate.getTime(),
        formattedDate: getDayFormatter(thursDayWeek),
        slots: {
          0800: {
            time: '8:00am',
            booked: false,
            trainer: "Mendelson",
            classFull: false,
            past: false,
            spots: 8,
            spotsTaken: 0,
          },
          1100: {
            time: '11:00am',
            booked: false,
            trainer: "Mendelson",
            classFull: false,
            past: false,
            spots: 8,
            spotsTaken: 0,
          },
          1600: {
            time: '4:00pm',
            booked: false,
            trainer: "Mendelson",
            classFull: false,
            past: false,
            spots: 8,
            spotsTaken: 0,
          },
          2000: {
            time: '8:00pm',
            booked: false,
            trainer: "Mendelson",
            classFull: false,
            past: false,
            spots: 8,
            spotsTaken: 0,
          }
        }
      };

      var f = 
      {
        name: 'Fri',
        dayOfWeek: friDayWeek,
        // isToday: todayDayOfWeek == friDayWeek,
        // date: friDate.getTime(),
        formattedDate: getDayFormatter(friDayWeek),
        slots: {
          0800: {
            time: '8:00am',
            booked: false,
            trainer: "Mendelson",
            classFull: false,
            past: false,
            spots: 8,
            spotsTaken: 0,
          },
          1100: {
            time: '11:00am',
            booked: false,
            trainer: "Mendelson",
            classFull: false,
            past: false,
            spots: 8,
            spotsTaken: 0,
          },
          1600: {
            time: '4:00pm',
            booked: false,
            trainer: "Mendelson",
            classFull: false,
            past: false,
            spots: 8,
            spotsTaken: 0,
          },
          2000: {
            time: '8:00pm',
            booked: false,
            trainer: "Mendelson",
            classFull: false,
            past: false,
            spots: 8,
            spotsTaken: 0,
          }
        }
      }

      var g =
      {
        name: 'Sat',
        dayOfWeek: satDayWeek,
        // isToday: todayDayOfWeek == satDayWeek,
        // date: satDate.getTime(),
        formattedDate: getDayFormatter(satDayWeek),
        slots: {
          0800: {
            time: '8:00am',
            booked: false,
            trainer: "Mendelson",
            classFull: false,
            past: false,
            spots: 8,
            spotsTaken: 0,
          },
          1100: {
            time: '11:00am',
            booked: false,
            trainer: "Mendelson",
            classFull: false,
            past: false,
            spots: 8,
            spotsTaken: 0,
          },
          1600: {
            time: '4:00pm',
            booked: false,
            trainer: "Mendelson",
            classFull: false,
            past: false,
            spots: 8,
            spotsTaken: 0,
          },
          2000: {
            time: '8:00pm',
            booked: false,
            trainer: "Mendelson",
            classFull: false,
            past: false,
            spots: 8,
            spotsTaken: 0,
          }
        }
      }

      syncObject[sunDate.getTime()] = a
      syncObject[monDate.getTime()] = b
      syncObject[tuesDate.getTime()] = c
      syncObject[wedDate.getTime()] = d
      syncObject[thursDate.getTime()] = e
      syncObject[friDate.getTime()] = f
      syncObject[satDate.getTime()] = g

      syncObject.$save();
    }

    function getDayFormatter(day) {
      var newDate = new Date();
      newDate.setDate(todayDate.getDate() + day - todayDayOfWeek);
      return newDate.getMonth() + 1 + "/" + newDate.getDate();
    }
  });
