/*global angular*/
(function withAngular(angular) {
  'use strict';

  angular.module('720kb', [
    '720kb.tooltips'
  ])
  .controller('DemoCtrl', [
    '$timeout',
    function controllerCtrl($timeout) {
      var that = this;

      that.isHidden = true;
      that.tooltipContentText = 'I\'m a content text from module controller';
      that.tooltipText = 'I\'m a text from module controller';
      that.class = 'a-class';
      that.closeFromModel = false;
      that.sizeFromModel = 'small';
      that.speedFromModel = 'fast';
      $timeout(function changeTooltipText() {

        that.tooltipText = 'C, C, C, Changed....';
      }, 5000);
      $timeout(function changeTooltipText() {

        that.tooltipContentText = 'Content C, C, C, Changed....';
      }, 6000);
      $timeout(function changeTooltipText() {

        that.closeFromModel = true;
      }, 7000);
      $timeout(function changeTooltipText() {

        that.class = 'another-class';
      }, 8000);
      $timeout(function changeSize() {

        that.sizeFromModel = 'large';
      }, 9000);
      $timeout(function changeSpeed() {

        that.speedFromModel = 'slow';
      }, 10000);
      $timeout(function changeIsHidden() {

        that.isHidden = false;
      }, 11000);

      that.generateHTMLextra = function generateHTMLextra(item) {

        return '<i>hello tooltip content' + item + '</i>';
      };
    }
  ])
  .controller('Ctrl', [function controller() {
    var that = this;

    that.items = [1, 2, 3, 4, 5];
  }]);
}(angular));
