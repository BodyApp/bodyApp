'use strict';

angular.module('bodyAppApp')
  .controller('NewUserCtrl', function ($scope, $http, $state, User, Auth, $window, DayOfWeekSetter, $firebaseArray, $uibModal, $firebaseObject) {
    $scope.newUserStep = 1;
    $scope.errorDiv = false
    $scope.currentUser = Auth.getCurrentUser();
    var currentUser;
    $scope.upcomingIntros;
    $scope.bookedIntroClass;
    var injuries = "";
    var goals = "";
    var emergencyContact = {};
    $scope.timezone;
    var tzName = jstz().timezone_name;
    var ref = firebase.database().ref()
    var auth = firebase.auth();
    auth.onAuthStateChanged(function(user) {
      if (user) {
      } else {
        if (currentUser.firebaseToken) {
          auth.signInWithCustomToken(currentUser.firebaseToken).then(function(user) {
            if (currentUser.role === "admin") console.log("Firebase user authentication succeeded!", user);
          }); 
        } else {
          console.log("User doesn't have a firebase token saved, should retrieve one.")
        }
      }
    })

    function getUpcomingIntros() {
        $scope.upcomingIntros = $firebaseArray(ref.child('upcomingIntros').orderByKey().limitToFirst(12))
    }

    setTimezone();
    function setTimezone() {
      $scope.timezone = moment().tz(tzName).format('z');
    }

    Auth.getCurrentUser().$promise.then(function(user) {
        currentUser = user

        //Firebase authentication check
          // var ref = new Firebase("https://bodyapp.firebaseio.com/");
          // ref.onAuth(function(authData) {
          //     if (authData) {
          //       getUpcomingIntros()
          //       console.log("User is authenticated with fb ");
          //     } else {
          //       console.log("User is logged out");
          //       if (currentUser.firebaseToken) {
          //         ref.authWithCustomToken(currentUser.firebaseToken, function(error, authData) {
          //           if (error) {
          //             Auth.logout();
          //             $window.location.reload()
          //             console.log("Firebase user authentication failed", error);
          //           } else {
          //             getUpcomingIntros()  
          //             if (user.role === "admin") console.log("Firebase user authentication succeeded!", authData);
          //           }
          //         }); 
          //       } else {
          //         Auth.logout();
          //         $window.location.reload()
          //       }
          //     }
        // })

        // // //Olark Integration
        // if (user.firstName && user.lastName) {
        //     olark('api.visitor.updateFullName', {
        //         fullName: user.firstName + " " + user.lastName.charAt(0)
        //     });
        // }

        // olark('api.visitor.updateCustomFields', {
        //     id: user._id,
        //     fbId: user.facebookId
        // });

        //Intercom integration
        if (user.intercomHash) {
            window.intercomSettings = {
                app_id: "daof2xrs",
                name: user.firstName + " " + user.lastName, // Full name
                email: user.email, // Email address
                user_id: user._id,
                user_hash: user.intercomHash,
                created_at: Math.floor(Date.now() / 1000), // Signup date as a Unix timestamp,
                "bookedIntro": user.bookedIntroClass,
                "introTaken": user.introClassTaken,
                "numFriendsOnPlatform": user.friendList ? user.friendList.length : 0
            };
        } else {
            User.createIntercomHash({id: currentUser._id}, {}, function(user) {
                Auth.updateUser(user);
                window.intercomSettings = {
                    app_id: "daof2xrs",
                    name: user.firstName + " " + user.lastName, // Full name
                    email: user.email, // Email address
                    user_id: user._id,
                    user_hash: user.intercomHash,
                    created_at: Math.floor(Date.now() / 1000), // Signup date as a Unix timestamp,
                    "bookedIntro": user.bookedIntroClass,
                    "introTaken": user.introClassTaken,
                    "numFriendsOnPlatform": user.friendList ? user.friendList.length : 0
                };
            }, function(err) {console.log("Error creating Intercom hash: "+err)}).$promise;
        }

        if (currentUser.timezone != tzName) {
            User.saveTimezone({ id: currentUser._id }, {timezone: tzName}, function(user) {
              console.log("Updated user timezone preference")
              currentUser = user;
              Auth.updateUser(currentUser);
              $scope.currentUser = currentUser;
            }, function(err) {
                console.log("Error saving Timezone: " + err)
            }).$promise;
        }

        if (!$scope.currentUser.referralCode) {
        User.generateReferralCode({id: $scope.currentUser._id}, {}, function(user){
            console.log("Successfully generated referral code " + user.referralCode)
            $scope.currentUser = user;
            Auth.updateUser(user)
            Intercom('update', {
                "referralCode": user.referralCode
            });

            if (!currentUser.welcomeEmailSent) {
                currentUser.welcomeEmailSent = true;
                Auth.updateUser(currentUser);
                User.sendWelcomeEmail({ id: currentUser._id }, {
                    }, function(user) {
                    }, function(err) {
                        console.log("Error: " + err)
                }).$promise;  
            }
        }, function(err){console.log(err)})
      }
    })


    
    // var query = $scope.allIntros.orderByKey().limitToFirst(10);
    // $scope.upcomingIntros = $firebaseArray(ref.child('upcomingIntros'))


	$scope.bookIntroClass = function(classBooked) {
        ref.child("bookings").child(classBooked.$id).once('value', function(snapshot) {
            if (snapshot.numChildren() >= 12) { // Checks if the class is actually full
              return alert("Unfortunately, this class is now full.  Please choose another.")
            } else {
                if (currentUser.facebook && currentUser.facebook.age_range && currentUser.facebook.age_range.max < 18) {
                    return alert("Unfortunately, you currently need to be 18+ to participate in BODY classes.")
                }

        		$scope.newUserStep++;
        		$scope.bookedIntroClass = classBooked

                var classDate = new Date(classBooked.$id*1)
                var todayDate = new Date(classDate);
                var sunDate = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate() - todayDate.getDay(), 11, 0, 0);

                var sunGetDate = sunDate.getDate();
                var sunGetMonth = sunDate.getMonth()+1;
                var sunGetYear = sunDate.getFullYear();
                var weekOf = "weekof"+ sunGetYear + (sunGetMonth<10?"0"+sunGetMonth:sunGetMonth) + (sunGetDate<10?"0"+sunGetDate:sunGetDate);
                var weekOfRef = new Firebase("https://bodyapp.firebaseio.com/classes/" + weekOf)

        		var classToBook = $firebaseObject(
        	      weekOfRef.child(DayOfWeekSetter.setDay(classDate.getDay()))
        	      .child("slots")
        	      .child(classDate.getTime())
            	)

            	classToBook.$loaded(function() {
                    ref.child("bookings").child(classToBook.date).child(currentUser._id).update({firstName: currentUser.firstName, lastName: currentUser.lastName.charAt(0), timeBooked: new Date().getTime(), picture: currentUser.picture ? currentUser.picture : "", facebookId: currentUser.facebookId ? currentUser.facebookId : ""})
                    ref.child("userBookings").child(currentUser._id).child(classToBook.date).update({date: classToBook.date, trainer: classToBook.trainer, level: classToBook.level})
                    $scope.classDetails = classToBook;
            	})
        		
        		User.addIntroClass({ id: $scope.currentUser._id }, {
                    classToAdd: classDate.getTime()
                }, function(user) {
                    Auth.updateUser(user)
                    //Intercom integration
                    Intercom('update', {
                        "bookedIntro": user.bookedIntroClass,
                        "introClassBooked_at": Math.floor(new Date(user.introClassBooked*1) / 1000)
                    });
                }, function(err) {
                    console.log("Error adding class: " + err);
                    ref.child("bookings").child(classToBook.date).child(currentUser._id).remove();
                    ref.child("userBookings").child(currentUser._id).child(classToBook.date).remove();

                    classToBook.$save()
                    alert("sorry, there was an issue booking your class.  Please try reloading the site and booking again.  If that doesn't work, contact the BODY help team at (216) 408-2902 to get this squared away.")    
                }).$promise;
            }
        })
	}

    $scope.incrementStep = function() {
    	$scope.newUserStep++;
    }

    $scope.goToDashboard = function() {
        Intercom('update', {
            "newUserFlowComplete": currentUser.completedNewUserFlow ? currentUser.completedNewUserFlow : false
        });       
    	$state.go('storefront');
    }

    $scope.saveNewEmail = function(emailToSave) {
        User.saveEmailAddress({id: $scope.currentUser._id}, {email: emailToSave}, function(user){
            console.log("Email successfull updated.")
            $scope.currentUser = user;
            Auth.updateUser(user)
            $scope.editingEmail = false;
        }, function(err){console.log('error saving new email: ' + err)})
    }

    $scope.saveInjuriesGoalsEmergency = function(boxChecked, injuryString, goals, emergencyFirst, emergencyLast, emergencyRelationship, emergencyPhone) {
        if (!injuryString || injuryString.length < 2) {return $scope.injuriesNotEntered = true;} else {$scope.injuriesNotEntered = false;}
        if (!goals || goals.length < 2) {return $scope.goalsNotEntered = true;} else {$scope.goalsNotEntered = false;}
        if (!(emergencyFirst && emergencyLast && emergencyPhone)) {return $scope.emergencyContactNotEntered = true;} else {$scope.emergencyContactNotEntered = false;}
        if (!boxChecked) {return $scope.boxNotChecked = true;} else {$scope.boxNotChecked = false;}

        emergencyContact = {firstName: emergencyFirst, lastName: emergencyLast, relationship: emergencyRelationship, phone: emergencyPhone};

    	// if (injuries.length < 2) {
    	// 	$scope.errorDiv = true
    	// 	console.log("Didn't enter any injury information!")
    	// } else {
		User.saveInjuriesGoalsEmergency({id: $scope.currentUser}, {injuryString: injuryString, goals: goals, emergencyContact: emergencyContact})
        .$promise.then(function(user) {
			console.log("Successfully saved injury, goals and emergency contact info.");
			Auth.getUpdatedUser();
            Intercom('update', {
                "goals": user.goals,
                "injuries": user.injuries,
                "emergencyContact": user.emergencyContact
            });
            // $scope.goToDashboard()
            $scope.newUserStep++;   
            // $scope.newUserStep++;
		})
    	// }
    }

    $scope.getDate = function(classSent) {
    	if (classSent) {
	     	var dateToReturn = new Date(classSent.$id*1)
		    return getDayOfWeek(dateToReturn.getDay()) + ", " + getMonth(dateToReturn.getMonth()) + " " + dateToReturn.getDate()
		  }
    }

    $scope.getTime = function(classSent) {
    	if (classSent) {
	    	var dateToReturn = new Date(classSent.$id*1);
	    	var minutes = dateToReturn.getMinutes() < 10 ? "0" + dateToReturn.getMinutes() : dateToReturn.getMinutes();
            if (dateToReturn.getHours() === 12) return "12:" + minutes + "pm";
		    return (dateToReturn.getHours() < 12) ? dateToReturn.getHours() + ":" + minutes + "am" : (dateToReturn.getHours() - 12) + ":" + minutes + "pm"; 
		  }
    }

    function getDayOfWeek(day) {
      switch (day) {
        case 0: return "Sunday"; break;
        case 1: return "Monday"; break;
        case 2: return "Tuesday"; break;
        case 3: return "Wednesday"; break;
        case 4: return "Thursday"; break;
        case 5: return "Friday"; break;
        case 6: return "Saturday"; break;
        default: break;
      }
    }

    function getMonth(day) {
      switch (day) {
        case 0: return "Jan"; break;
        case 1: return "Feb"; break;
        case 2: return "Mar"; break;
        case 3: return "Apr"; break;
        case 4: return "May"; break;
        case 5: return "Jun"; break;
        case 6: return "Jul"; break;
        case 7: return "Aug"; break;
        case 8: return "Sep"; break;
        case 9: return "Oct"; break;
        case 10: return "Nov"; break;
        case 11: return "Dec"; break;
        default: break;
      }
    }

    $scope.calendarDateSetter = function(slot) {
        // var timeOffset = jstz().utc_offset + 60;
        var timeOffset = moment().utcOffset();
        var date = new Date(slot.date - timeOffset*60*1000);
        return date.getFullYear()+""+((date.getMonth()+1 < 10)?"0"+(date.getMonth()+1):(date.getMonth()+1))+""+((date.getDate() < 10)?"0"+date.getDate():date.getDate())+"T"+((date.getHours() < 10)?"0"+date.getHours():date.getHours())+""+((date.getMinutes() < 10)?"0"+date.getMinutes():date.getMinutes())+"00"         
      } 
      $scope.calendarDateSetterEnd = function(slot) {
        // var timeOffset = jstz().utc_offset + 60;
        var timeOffset = moment().utcOffset();
        var date = new Date(slot.date - timeOffset*60*1000);
        return date.getFullYear()+""+((date.getMonth()+1 < 10)?"0"+(date.getMonth()+1):(date.getMonth()+1))+""+((date.getDate() < 10)?"0"+date.getDate():date.getDate())+"T"+((date.getHours() < 10)?"0"+(date.getHours()+1):(date.getHours()+1))+""+((date.getMinutes() < 10)?"0"+date.getMinutes():date.getMinutes())+"00"
      } 
  });
