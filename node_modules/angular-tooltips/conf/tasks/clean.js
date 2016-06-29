/*global require*/
(function buildTask(require) {
  'use strict';

  var gulp = require('gulp')
    , del = require('del')
    , vinylPaths = require('vinyl-paths')
    , paths = require('../paths');

  gulp.task('clean', function onClean() {
    return gulp.src(paths.output)
      .pipe(vinylPaths(del));
  });
}(require));
