'use strict';

angular.module('bodyAppApp')
  .controller('ConsumerScheduleCtrl', function ($scope, $http, socket, $location, $firebaseObject, Auth, Schedule) {
    var todayDate = new Date();
    var todayDayOfWeek = todayDate.getDay();

    var currentUser = Auth.getCurrentUser();
    var currentUserEmail = currentUser.email
    console.log(currentUser)
    $scope.currentUser = currentUser;
    // if (currentUser.role == null) {
    //     $location.path('/login');
    // }
    
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

    function getDayFormatter(day) {
        var newDate = new Date();
        newDate.setDate(todayDate.getDate() + day - todayDayOfWeek);
        return newDate.getMonth() + 1 + "/" + newDate.getDate();
    }

    // // connect to firebase 
    // var ref = new Firebase("https://bodyapp.firebaseio.com/weekOf9272015");  
    // var syncObject = $firebaseObject(ref);

    // $scope.days

    // three way data binding
    Schedule("weekOf9272015").$bindTo($scope, 'days')

    // $scope.bookClass = function(day, slot) {
    //   // if (syncObject[day].slots[slot].bookedUsers == nil) {
    //     syncObject[day].slots[slot].bookedUsers = currentUser.email;
    //   // } else {
    //     // syncObject[day].slots[slot].bookedUsers.append(currentUser.email);
    //   // }
    //   syncObject.save();
    // }





    // $scope.days = {
    //     a: {
    //         name: 'Sun',
    //         dayOfWeek: sunDayWeek,
    //         isToday: todayDayOfWeek == sunDayWeek,
    //         date: sunDate,
    //         formattedDate: getDayFormatter(sunDayWeek),
    //         slots: {
    //           0800: {
    //             time: '8:00am',
    //             booked: false,
    //             trainer: "Mendelson",
    //             unavailable: false,
    //             spots: 8,
    //             spotsTaken: 0,
    //           },
    //           1100: {
    //             time: '11:00am',
    //             booked: false,
    //             trainer: "Mendelson",
    //             unavailable: false,
    //             spots: 8,
    //             spotsTaken: 0,
    //           },
    //           1600: {
    //             time: '4:00pm',
    //             booked: false,
    //             trainer: "Mendelson",
    //             unavailable: false,
    //             spots: 8,
    //             spotsTaken: 0,
    //           },
    //           2000: {
    //             time: '8:00pm',
    //             booked: false,
    //             trainer: "Mendelson",
    //             unavailable: false,
    //             spots: 8,
    //             spotsTaken: 0,
    //           }
    //         }
    //     },

    //     b: {
    //         name: 'Mon',
    //         dayOfWeek: monDayWeek,
    //         isToday: todayDayOfWeek == monDayWeek,
    //         date: monDate,
    //         formattedDate: getDayFormatter(monDayWeek),
    //         slots: {
    //           0800: {
    //             time: '8:00am',
    //             booked: false,
    //             trainer: "Mendelson",
    //             unavailable: false,
    //             spots: 8,
    //             spotsTaken: 0,

    //           },
    //           1100: {
    //             time: '11:00am',
    //             booked: false,
    //             trainer: "Mendelson",
    //             unavailable: false,
    //             spots: 8,
    //             spotsTaken: 0,
    //           },
    //           1600: {
    //             time: '4:00pm',
    //             booked: false,
    //             trainer: "Mendelson",
    //             unavailable: false,
    //             spots: 8,
    //             spotsTaken: 0,
    //           },
    //           2000: {
    //             time: '8:00pm',
    //             booked: false,
    //             trainer: "Mendelson",
    //             unavailable: false,
    //             spots: 8,
    //             spotsTaken: 0,
    //           }
    //         }
    //     },
          
    //     c: {
    //         name: 'Tues',
    //         dayOfWeek: tuesDayWeek,
    //         isToday: todayDayOfWeek == tuesDayWeek,
    //         date: tuesDate,
    //         formattedDate:  getDayFormatter(tuesDayWeek),
    //         slots: {
    //           0800: {
    //             time: '8:00am',
    //             booked: false,
    //             trainer: "Mendelson",
    //             unavailable: false,
    //             spots: 8,
    //             spotsTaken: 0,
    //           },
    //           1100: {
    //             time: '11:00am',
    //             booked: false,
    //             trainer: "Mendelson",
    //             unavailable: false,
    //             spots: 8,
    //             spotsTaken: 0,
    //           },
    //           1600: {
    //             time: '4:00pm',
    //             booked: false,
    //             trainer: "Mendelson",
    //             unavailable: false,
    //             spots: 8,
    //             spotsTaken: 0,
    //           },
    //           2000: {
    //             time: '8:00pm',
    //             booked: false,
    //             trainer: "Mendelson",
    //             unavailable: false,
    //             spots: 8,
    //             spotsTaken: 0,
    //           }
    //         }
    //     },
          
    //     d: {
    //         name: 'Wed',
    //         dayOfWeek: wedDayWeek,
    //         isToday: todayDayOfWeek == wedDayWeek,
    //         date: wedDate,
    //         formattedDate: getDayFormatter(wedDayWeek),
    //         slots: {
    //           0800: {
    //             time: '8:00am',
    //             booked: false,
    //             trainer: "Mendelson",
    //             unavailable: false,
    //             spots: 8,
    //             spotsTaken: 0,
    //           },
    //           1100: {
    //             time: '11:00am',
    //             booked: false,
    //             trainer: "Mendelson",
    //             unavailable: false,
    //             spots: 8,
    //             spotsTaken: 0,
    //           },
    //           1600: {
    //             time: '4:00pm',
    //             booked: false,
    //             trainer: "Mendelson",
    //             unavailable: false,
    //             spots: 8,
    //             spotsTaken: 0,
    //           },
    //           2000: {
    //             time: '8:00pm',
    //             booked: false,
    //             trainer: "Mendelson",
    //             unavailable: false,
    //             spots: 8,
    //             spotsTaken: 0,
    //           }
    //         }
    //     },

    //     e: {
    //         name: 'Thurs',
    //         dayOfWeek: thursDayWeek,
    //         isToday: todayDayOfWeek == thursDayWeek,
    //         date: thursDate,
    //         formattedDate: getDayFormatter(thursDayWeek),
    //         slots: {
    //           0800: {
    //             time: '8:00am',
    //             booked: false,
    //             trainer: "Mendelson",
    //             unavailable: false,
    //             spots: 8,
    //             spotsTaken: 0,
    //           },
    //           1100: {
    //             time: '11:00am',
    //             booked: false,
    //             trainer: "Mendelson",
    //             unavailable: false,
    //             spots: 8,
    //             spotsTaken: 0,
    //           },
    //           1600: {
    //             time: '4:00pm',
    //             booked: false,
    //             trainer: "Mendelson",
    //             unavailable: false,
    //             spots: 8,
    //             spotsTaken: 0,
    //           },
    //           2000: {
    //             time: '8:00pm',
    //             booked: false,
    //             trainer: "Mendelson",
    //             unavailable: false,
    //             spots: 8,
    //             spotsTaken: 0,
    //           }
    //         }
    //     },

    //     f: {
    //         name: 'Fri',
    //         dayOfWeek: friDayWeek,
    //         isToday: todayDayOfWeek == friDayWeek,
    //         date: friDate,
    //         formattedDate: getDayFormatter(friDayWeek),
    //         slots: {
    //           0800: {
    //             time: '8:00am',
    //             booked: false,
    //             trainer: "Mendelson",
    //             unavailable: false,
    //             spots: 8,
    //             spotsTaken: 0,
    //           },
    //           1100: {
    //             time: '11:00am',
    //             booked: false,
    //             trainer: "Mendelson",
    //             unavailable: false,
    //             spots: 8,
    //             spotsTaken: 0,
    //           },
    //           1600: {
    //             time: '4:00pm',
    //             booked: false,
    //             trainer: "Mendelson",
    //             unavailable: false,
    //             spots: 8,
    //             spotsTaken: 0,
    //           },
    //           2000: {
    //             time: '8:00pm',
    //             booked: false,
    //             trainer: "Mendelson",
    //             unavailable: false,
    //             spots: 8,
    //             spotsTaken: 0,
    //           }
    //         }
    //     },
    //     g: {
    //         name: 'Sat',
    //         dayOfWeek: satDayWeek,
    //         isToday: todayDayOfWeek == satDayWeek,
    //         date: satDate,
    //         formattedDate: getDayFormatter(satDayWeek),
    //         slots: {
    //           0800: {
    //             time: '8:00am',
    //             booked: false,
    //             trainer: "Mendelson",
    //             unavailable: false,
    //             spots: 8,
    //             spotsTaken: 0,
    //           },
    //           1100: {
    //             time: '11:00am',
    //             booked: false,
    //             trainer: "Mendelson",
    //             unavailable: false,
    //             spots: 8,
    //             spotsTaken: 0,
    //           },
    //           1600: {
    //             time: '4:00pm',
    //             booked: false,
    //             trainer: "Mendelson",
    //             unavailable: false,
    //             spots: 8,
    //             spotsTaken: 0,
    //           },
    //           2000: {
    //             time: '8:00pm',
    //             booked: false,
    //             trainer: "Mendelson",
    //             unavailable: false,
    //             spots: 8,
    //             spotsTaken: 0,
    //           }
    //         }
    //       }
    // }



    // syncObject.weekOf9272015 = $scope.days
    // syncObject.$save();

    // function to set the default data
  //   $scope.reset = function() {    
  //       syncObject.$add({
  //         monday: {
  //           name: 'Monday',
  //           slots: {
  //             0900: {
  //               time: '9:00am',
  //               booked: false
  //             },
  //             1100: {
  //               time: '11:00am',
  //               booked: false
  //             }
  //           }
  //         },
  //         tuesday: {
  //           name: 'Tuesday',
  //           slots: {
  //             0900: {
  //               time: '9:00am',
  //               booked: false
  //             },
  //             1100: {
  //               time: '11:00am',
  //               booked: false
  //             }
  //           }
  //         }
  //       });    
  //   };
  // })
});

