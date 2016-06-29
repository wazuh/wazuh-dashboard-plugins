/*global require*/
(function buildTask(require) {
  'use strict';

  var gulp = require('gulp')
    , runSequence = require('run-sequence');

  gulp.task('build', function onBuild(done) {

    return runSequence('clean', [
      'scss',
      'annotate',
      'move'
    ],
    done);
  });
}(require));
