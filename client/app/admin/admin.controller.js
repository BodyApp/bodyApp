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

      var dateSetter = new Date(monDate.getFullYear(), monDate.getMonth(), monDate.getDate(), 23, 15, 0).getTime()
      b.slots[dateSetter] = 
      {
        time: '11:15pm',
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
      
      var dateSetter = new Date(tuesDate.getFullYear(), tuesDate.getMonth(), tuesDate.getDate(), 11, 0, 0).getTime()
      c.slots[dateSetter] = 
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
