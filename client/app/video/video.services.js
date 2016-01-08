angular.module('bodyAppApp')
  .factory('Video', function() {
  	
  	var service = {};
    var videoInputDevice;
    var audioInputDevice;

  	service.setVideoInput = function(videoInput) {
  		videoInputDevice = videoInput;
      console.log("Video device set to " + videoInputDevice.label)
  	}

  	service.setAudioInput = function(audioInput){
  		audioInputDevice = audioInput;
      console.log("Audio device set to " + audioInputDevice.label)
  	}

    service.getVideoInput = function() {
      return videoInputDevice;
    }

    service.getAudioInput = function() {
      return audioInputDevice;
    }

  	return service
  })