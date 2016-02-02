angular.module('bodyAppApp')
  .factory('Video', function() {
  	
  	var service = {};
    var videoInputDevice;
    var audioInputDevice;
    var devices;

    service.hardwareSetup = function(element) {
      devices = createOpentokHardwareSetupComponent(element, {
        insertMode: 'append'
      }, function(error, hardwareSetup) {
        if (!error) {
          return devices
          // service.setVideoInput(devices.videoSource());
          // service.setAudioInput(devices.audioSource());
          // setVideoInput(component.videoSource());
          // setAudioInput(component.audioSource());
        }
        if (error) {
          console.error('Error: ', error);
          document.querySelector('#audioVideoSetup').innerHTML = '<strong>Error getting ' +
            'devices</strong>: ' + error.message;
          return;
        }
      })
    }

    service.destroyHardwareSetup = function() {
      console.log("Destroying hardware setup");
      devices.destroy();
    }

  	// service.setVideoInput = function(videoInput) {
  	// 	videoInputDevice = videoInput;
   //    console.log("Video device set to " + videoInputDevice.label)
  	// }

  	// service.setAudioInput = function(audioInput){
  	// 	audioInputDevice = audioInput;
   //    console.log("Audio device set to " + audioInputDevice.label)
  	// }

    service.getVideoInput = function() {
      console.log(devices.videoSource())
      return devices.videoSource();
    }

    service.getAudioInput = function() {
      console.log(devices.audioSource())
      return devices.audioSource();
    }

  	return service
  })