'use strict';

angular.module('bodyAppApp')
.directive('autoScrollTo', function () {
  return function(scope, element, attrs) {
    scope.$watch(attrs.autoScrollTo, function(value) {
      if (value) {
        var pos = $("#scrollPosition").position().top + $(element).scrollTop() - $(element).position().top;
        $(element).animate({
            scrollTop : pos
        }, 1000);
      }
    });
  }
})