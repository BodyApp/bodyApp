'use strict';

angular.module('bodyAppApp')
  .controller('AdminCtrl', function ($scope, $http, Auth, User, $firebaseObject) {

    // Use the User $resource to fetch all users
    $scope.users = User.query();
    var todayDate = new Date();
    $scope.todayDate = todayDate
    var todayDayOfWeek = todayDate.getDay();

    var sunDate = new Date();
    sunDate.setDate(todayDate.getDate() - todayDate.getDay());
    var weekOf = "weekof"+(sunDate.getMonth()+1)+sunDate.getDate()+sunDate.getFullYear()

    var ref = new Firebase("https://bodyapp.firebaseio.com/"+weekOf);  
    var syncObject = $firebaseObject(ref);

    var wodRef = new Firebase("https://bodyapp.firebaseio.com/WOD");
    $scope.wod = $firebaseObject(wodRef);

    $scope.createWorkout = function(workoutToCreate) {
      console.log(workoutToCreate);
      var date = workoutToCreate.date
      syncObject[date.getDay()].slots[date.getTime()] = {
        time: timeFormatter(date),
        date: date,
        booked: false,
        trainer: workoutToCreate.trainer,
        classFull: false,
        past: false,
        spots: 8,
        spotsTaken: 0
      }

      syncObject.$save().then(function() {
        console.log("new workout saved")
      }).catch(function(err) {
        console.log("error saving new workout: " + err)
      })
    }

    function timeFormatter(date) {
      var formatted;
      if (date.getHours() == 12) {
          formatted = date.getHours() +":"+ ((date.getMinutes() < 10)?"0":"") + date.getMinutes() + "pm"
      } else if (date.getHours() == 24) {
          formatted = date.getHours()-12 +":"+ ((date.getMinutes() < 10)?"0":"") + date.getMinutes() + "am"
      } else {
          formatted = ((date.getHours() < 13)? date.getHours() : date.getHours()-12) +":"+ ((date.getMinutes() < 10)?"0":"") + date.getMinutes() + ((date.getHours() < 13)? "am" : "pm")
      } 
      return formatted
    }

    // $scope.delete = function(user) {
    //   User.remove({ id: user._id });
    //   angular.forEach($scope.users, function(u, i) {
    //     if (u === user) {
    //       $scope.users.splice(i, 1);
    //     }
    //   });
    // };

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

      var sunDate = new Date();
      sunDate.setDate(todayDate.getDate() + sunDayWeek - todayDayOfWeek);
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

    var a = {
        name: 'Sun',
        dayOfWeek: sunDayWeek,
        // isToday: todayDayOfWeek == satDayWeek,
        // date: satDate.getTime(),
        formattedDate: getDayFormatter(sunDayWeek),
        slots: {}
      }

      var dateSetter = new Date(sunDate.getFullYear(), sunDate.getMonth(), sunDate.getDate(), 8, 0, 0).getTime()
      a.slots[dateSetter] = 
      {
        time: '8:00am',
        date: dateSetter,
        booked: false,
        trainer: "Mendelson",
        classFull: false,
        past: false,
        spots: 8,
        spotsTaken: 0,
      }
      
      var dateSetter = new Date(sunDate.getFullYear(), sunDate.getMonth(), sunDate.getDate(), 11, 0, 0).getTime()
      a.slots[dateSetter] = 
      {
        time: '11:00am',
        date: dateSetter,
        booked: false,
        trainer: "Mendelson",
        classFull: false,
        past: false,
        spots: 8,
        spotsTaken: 0,
      }

      var dateSetter = new Date(sunDate.getFullYear(), sunDate.getMonth(), sunDate.getDate(), 16, 0, 0).getTime()
      a.slots[dateSetter] = 
      {
        time: '4:00pm',
        date: dateSetter,
        booked: false,
        trainer: "Mendelson",
        classFull: false,
        past: false,
        spots: 8,
        spotsTaken: 0,
      }

      var dateSetter = new Date(sunDate.getFullYear(), sunDate.getMonth(), sunDate.getDate(), 20, 0, 0).getTime()
      a.slots[dateSetter] = 
      {
        time: '8:00pm',
        date: dateSetter,
        booked: false,
        trainer: "Mendelson",
        classFull: false,
        past: false,
        spots: 8,
        spotsTaken: 0,
      }
      
      var b = {
        name: 'Mon',
        dayOfWeek: monDayWeek,
        formattedDate: getDayFormatter(monDayWeek),
        slots: {}
      }

      var dateSetter = new Date(monDate.getFullYear(), monDate.getMonth(), monDate.getDate(), 8, 0, 0).getTime()
      b.slots[dateSetter] = 
      {
        time: '8:00am',
        date: dateSetter,
        booked: false,
        trainer: "Mendelson",
        classFull: false,
        past: false,
        spots: 8,
        spotsTaken: 0,
      }
      
      var dateSetter = new Date(monDate.getFullYear(), monDate.getMonth(), monDate.getDate(), 11, 0, 0).getTime()
      b.slots[dateSetter] = 
      {
        time: '11:00am',
        date: dateSetter,
        booked: false,
        trainer: "Mendelson",
        classFull: false,
        past: false,
        spots: 8,
        spotsTaken: 0,
      }

      var dateSetter = new Date(monDate.getFullYear(), monDate.getMonth(), monDate.getDate(), 17, 30, 0).getTime()
      b.slots[dateSetter] = 
      {
        time: '5:30pm',
        date: dateSetter,
        booked: false,
        trainer: "Mendelson",
        classFull: false,
        past: false,
        spots: 8,
        spotsTaken: 0,
      }

      var dateSetter = new Date(monDate.getFullYear(), monDate.getMonth(), monDate.getDate(), 22, 10, 0).getTime()
      b.slots[dateSetter] = 
      {
        time: '10:10pm',
        date: dateSetter,
        booked: false,
        trainer: "Mendelson",
        classFull: false,
        past: false,
        spots: 8,
        spotsTaken: 0,
      }

      var c = {
        name: 'Tue',
        dayOfWeek: tuesDayWeek,
        formattedDate: getDayFormatter(tuesDayWeek),
        slots: {}
      }

      var dateSetter = new Date(tuesDate.getFullYear(), tuesDate.getMonth(), tuesDate.getDate(), 8, 0, 0).getTime()
      c.slots[dateSetter] = 
      {
        time: '8:00am',
        date: dateSetter,
        booked: false,
        trainer: "Mendelson",
        classFull: false,
        past: false,
        spots: 8,
        spotsTaken: 0,
      }
      
      var dateSetter = new Date(tuesDate.getFullYear(), tuesDate.getMonth(), tuesDate.getDate(), 12, 55, 0).getTime()
      c.slots[dateSetter] = 
      {
        time: '12:55pm',
        date: dateSetter,
        booked: false,
        trainer: "Mendelson",
        classFull: false,
        past: false,
        spots: 8,
        spotsTaken: 0,
      }

      var dateSetter = new Date(tuesDate.getFullYear(), tuesDate.getMonth(), tuesDate.getDate(), 16, 0, 0).getTime()
      c.slots[dateSetter] = 
      {
        time: '4:00pm',
        date: dateSetter,
        booked: false,
        trainer: "Mendelson",
        classFull: false,
        past: false,
        spots: 8,
        spotsTaken: 0,
      }

      var dateSetter = new Date(tuesDate.getFullYear(), tuesDate.getMonth(), tuesDate.getDate(), 20, 0, 0).getTime()
      c.slots[dateSetter] = 
      {
        time: '8:00pm',
        date: dateSetter,
        booked: false,
        trainer: "Mendelson",
        classFull: false,
        past: false,
        spots: 8,
        spotsTaken: 0,
      }

      var d = {
        name: 'Wed',
        dayOfWeek: wedDayWeek,
        // isToday: todayDayOfWeek == satDayWeek,
        // date: satDate.getTime(),
        formattedDate: getDayFormatter(wedDayWeek),
        slots: {}
      }

      var dateSetter = new Date(wedDate.getFullYear(), wedDate.getMonth(), wedDate.getDate(), 8, 0, 0).getTime()
      d.slots[dateSetter] = 
      {
        time: '8:00am',
        date: dateSetter,
        booked: false,
        trainer: "Mendelson",
        classFull: false,
        past: false,
        spots: 8,
        spotsTaken: 0,
      }
      
      var dateSetter = new Date(wedDate.getFullYear(), wedDate.getMonth(), wedDate.getDate(), 11, 0, 0).getTime()
      d.slots[dateSetter] = 
      {
        time: '11:00am',
        date: dateSetter,
        booked: false,
        trainer: "Mendelson",
        classFull: false,
        past: false,
        spots: 8,
        spotsTaken: 0,
      }

      var dateSetter = new Date(wedDate.getFullYear(), wedDate.getMonth(), wedDate.getDate(), 16, 0, 0).getTime()
      d.slots[dateSetter] = 
      {
        time: '4:00pm',
        date: dateSetter,
        booked: false,
        trainer: "Mendelson",
        classFull: false,
        past: false,
        spots: 8,
        spotsTaken: 0,
      }

      var dateSetter = new Date(wedDate.getFullYear(), wedDate.getMonth(), wedDate.getDate(), 20, 0, 0).getTime()
      d.slots[dateSetter] = 
      {
        time: '8:00pm',
        date: dateSetter,
        booked: false,
        trainer: "Mendelson",
        classFull: false,
        past: false,
        spots: 8,
        spotsTaken: 0,
      }

      var e = {
        name: 'Thu',
        dayOfWeek: thursDayWeek,
        formattedDate: getDayFormatter(thursDayWeek),
        slots: {}
      }

      var dateSetter = new Date(thursDate.getFullYear(), thursDate.getMonth(), thursDate.getDate(), 8, 0, 0).getTime()
      e.slots[dateSetter] = 
      {
        time: '8:00am',
        date: dateSetter,
        booked: false,
        trainer: "Mendelson",
        classFull: false,
        past: false,
        spots: 8,
        spotsTaken: 0,
      }
      
      var dateSetter = new Date(thursDate.getFullYear(), thursDate.getMonth(), thursDate.getDate(), 11, 0, 0).getTime()
      e.slots[dateSetter] = 
      {
        time: '11:00am',
        date: dateSetter,
        booked: false,
        trainer: "Mendelson",
        classFull: false,
        past: false,
        spots: 8,
        spotsTaken: 0,
      }

      var dateSetter = new Date(thursDate.getFullYear(), thursDate.getMonth(), thursDate.getDate(), 16, 0, 0).getTime()
      e.slots[dateSetter] = 
      {
        time: '4:00pm',
        date: dateSetter,
        booked: false,
        trainer: "Mendelson",
        classFull: false,
        past: false,
        spots: 8,
        spotsTaken: 0,
      }

      var dateSetter = new Date(thursDate.getFullYear(), thursDate.getMonth(), thursDate.getDate(), 20, 0, 0).getTime()
      e.slots[dateSetter] = 
      {
        time: '8:00pm',
        date: dateSetter,
        booked: false,
        trainer: "Mendelson",
        classFull: false,
        past: false,
        spots: 8,
        spotsTaken: 0,
      }

      var f = {
        name: 'Fri',
        dayOfWeek: friDayWeek,
        formattedDate: getDayFormatter(friDayWeek),
        slots: {}
      }

      var dateSetter = new Date(friDate.getFullYear(), friDate.getMonth(), friDate.getDate(), 8, 0, 0).getTime()
      f.slots[dateSetter] = 
      {
        time: '8:00am',
        date: dateSetter,
        booked: false,
        trainer: "Mendelson",
        classFull: false,
        past: false,
        spots: 8,
        spotsTaken: 0,
      }
      
      var dateSetter = new Date(friDate.getFullYear(), friDate.getMonth(), friDate.getDate(), 11, 0, 0).getTime()
      f.slots[dateSetter] = 
      {
        time: '11:00am',
        date: dateSetter,
        booked: false,
        trainer: "Mendelson",
        classFull: false,
        past: false,
        spots: 8,
        spotsTaken: 0,
      }

      var dateSetter = new Date(friDate.getFullYear(), friDate.getMonth(), friDate.getDate(), 16, 0, 0).getTime()
      f.slots[dateSetter] = 
      {
        time: '4:00pm',
        date: dateSetter,
        booked: false,
        trainer: "Mendelson",
        classFull: false,
        past: false,
        spots: 8,
        spotsTaken: 0,
      }

      var dateSetter = new Date(friDate.getFullYear(), friDate.getMonth(), friDate.getDate(), 20, 0, 0).getTime()
      f.slots[dateSetter] = 
      {
        time: '8:00pm',
        date: dateSetter,
        booked: false,
        trainer: "Mendelson",
        classFull: false,
        past: false,
        spots: 8,
        spotsTaken: 0,
      }

      var g = {
        name: 'Sat',
        dayOfWeek: satDayWeek,
        // isToday: todayDayOfWeek == satDayWeek,
        // date: satDate.getTime(),
        formattedDate: getDayFormatter(satDayWeek),
        slots: {}
      }

      var dateSetter = new Date(satDate.getFullYear(), satDate.getMonth(), satDate.getDate(), 8, 0, 0).getTime()
      g.slots[dateSetter] = 
      {
        time: '8:00am',
        date: dateSetter,
        booked: false,
        trainer: "Mendelson",
        classFull: false,
        past: false,
        spots: 8,
        spotsTaken: 0,
      }
      
      var dateSetter = new Date(satDate.getFullYear(), satDate.getMonth(), satDate.getDate(), 11, 0, 0).getTime()
      g.slots[dateSetter] = 
      {
        time: '11:00am',
        date: dateSetter,
        booked: false,
        trainer: "Mendelson",
        classFull: false,
        past: false,
        spots: 8,
        spotsTaken: 0,
      }

      var dateSetter = new Date(satDate.getFullYear(), satDate.getMonth(), satDate.getDate(), 16, 0, 0).getTime()
      g.slots[dateSetter] = 
      {
        time: '4:00pm',
        date: dateSetter,
        booked: false,
        trainer: "Mendelson",
        classFull: false,
        past: false,
        spots: 8,
        spotsTaken: 0,
      }

      var dateSetter = new Date(satDate.getFullYear(), satDate.getMonth(), satDate.getDate(), 20, 0, 0).getTime()
      g.slots[dateSetter] = 
      {
        time: '8:00pm',
        date: dateSetter,
        booked: false,
        trainer: "Mendelson",
        classFull: false,
        past: false,
        spots: 8,
        spotsTaken: 0,
      }

      syncObject[0] = a
      syncObject[1] = b
      syncObject[2] = c
      syncObject[3] = d
      syncObject[4] = e
      syncObject[5] = f
      syncObject[6] = g

      syncObject.$save();
    }

    function getDayFormatter(day) {
      var newDate = new Date();
      newDate.setDate(todayDate.getDate() + day - todayDayOfWeek);
      return newDate.getMonth() + 1 + "/" + newDate.getDate();
    }
  });
