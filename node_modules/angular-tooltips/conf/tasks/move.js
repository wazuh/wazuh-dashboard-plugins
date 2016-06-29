/*global require*/
(function buildTask(require) {
  'use strict';

  var gulp = require('gulp')
    , paths = require('../paths');

  gulp.task('move', function onMove() {

    return gulp.src(paths.assets)
      .pipe(gulp.dest(paths.output));
  });
}(require));
