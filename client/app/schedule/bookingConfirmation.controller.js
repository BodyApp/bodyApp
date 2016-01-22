'use strict';

angular.module('bodyAppApp')
    .controller('BookingConfirmationCtrl', function ($scope, Auth, Schedule, slot, $uibModalInstance) {
        var currentUser = Auth.getCurrentUser();
        $scope.currentUser = currentUser;
        $scope.bookedClass = slot;
        $scope.showFriendModal = false;
        $scope.friendList;
        $scope.friendsSelected = {
            friends: []
        };
    
        var date = new Date(slot.date)
        // $scope.calendarDateSetter = "20150704T210000"
        // $scope.calendarDateSetterEnd = "20150704T220000"
        //Formatting for calendar appointment setting
        $scope.scheduledClass = slot

        setTimezone()
        function setTimezone() {
          var tzName = jstz().timezone_name;
          $scope.timezone = moment().tz(tzName).format('z');
        }
        
        if (date.getHours() == 12) {
            $scope.classTime = date.getHours() +":"+ ((date.getMinutes() < 10)?"0":"") + date.getMinutes() + "pm"
        } else if (date.getHours() == 24) {
            $scope.classTime = date.getHours()-12 +":"+ ((date.getMinutes() < 10)?"0":"") + date.getMinutes() + "am"
        } else {
            $scope.classTime = ((date.getHours() < 13)? date.getHours() : date.getHours()-12) +":"+ ((date.getMinutes() < 10)?"0":"") + date.getMinutes() + ((date.getHours() < 13)? "am" : "pm")
        } 
        
        $scope.day = date.getDate()
        
        // $scope.dayOfWeek;
        
        switch (date.getDay()) {
            case 0: $scope.dayOfWeek = "Sunday"; break;
            case 1: $scope.dayOfWeek = "Monday"; break;
            case 2: $scope.dayOfWeek = "Tuesday"; break;
            case 3: $scope.dayOfWeek = "Wednesday"; break;
            case 4: $scope.dayOfWeek = "Thursday"; break;
            case 5: $scope.dayOfWeek = "Friday"; break;
            case 6: $scope.dayOfWeek = "Saturday"; break;
            default: break;
        }

        var month = new Array();
        month[1] = "Jan";
        month[2] = "Feb";
        month[3] = "Mar";
        month[4] = "Apr";
        month[5] = "May";
        month[6] = "Jun";
        month[7] = "Jul";
        month[8] = "Aug";
        month[9] = "Sept";
        month[10] = "Oct";
        month[11] = "Nov";
        month[12] = "Dec";

        $scope.month = month[date.getMonth()];

        $scope.inviteFriendsClicked = function() {
            var user = Auth.getCurrentUser();
            $scope.friendList = user.friendList;
            $scope.showFriendModal = true;
            console.log(user.friendList);
        }

        $scope.inviteSelectedFriends = function() {
            console.log($scope.friendsSelected)
            $uibModalInstance.close()
        }

        $scope.closeModal = function() {
            $uibModalInstance.close()   
        }

        $scope.backToMain = function() {
            $scope.showFriendModal = false;
        }

      $scope.calendarDateSetter = function() {
        var localDate = new Date(slot.date);
        var date = new Date(localDate.getTime() - jstz().utc_offset*60*1000);
        return date.getFullYear()+""+((date.getMonth()+1 < 10)?"0"+(date.getMonth()+1):(date.getMonth()+1))+""+((date.getDate() < 10)?"0"+date.getDate():date.getDate())+"T"+((date.getHours() < 10)?"0"+date.getHours():date.getHours())+""+((date.getMinutes() < 10)?"0"+date.getMinutes():date.getMinutes())+"00"
      } 
      $scope.calendarDateSetterEnd = function() {
        var localDate = new Date(slot.date);
        var date = new Date(localDate.getTime() - jstz().utc_offset*60*1000);
        return date.getFullYear()+""+((date.getMonth()+1 < 10)?"0"+(date.getMonth()+1):(date.getMonth()+1))+""+((date.getDate() < 10)?"0"+date.getDate():date.getDate())+"T"+((date.getHours() < 10)?"0"+(date.getHours()+1):(date.getHours()+1))+""+((date.getMinutes() < 10)?"0"+date.getMinutes():date.getMinutes())+"00"
      } 
    })