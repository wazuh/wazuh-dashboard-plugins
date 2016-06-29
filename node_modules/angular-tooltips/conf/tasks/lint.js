/*global require*/
(function lintTask(require) {
  'use strict';

  var gulp = require('gulp')
    , jshint = require('gulp-jshint')
    , eslint = require('gulp-eslint')
    , jscs = require('gulp-jscs')
    , sassLint = require('gulp-sass-lint')
    , stylish = require('jshint-stylish')
    , runSequence = require('run-sequence')
    , paths = require('../paths');

  gulp.task('scss-lint', function onScssLint() {

    return gulp.src(paths.scss.files)
    .pipe(sassLint())
    .pipe(sassLint.format())
    .pipe(sassLint.failOnError());
  });

  gulp.task('js-lint', function onJsLint() {

    return gulp.src(paths.lib + paths.files.unminified.js)
      .pipe(jshint())
      .pipe(jshint.reporter(stylish))
      .pipe(eslint())
      .pipe(eslint.format())
      .pipe(eslint.failOnError())
      .pipe(jscs())
      .pipe(jscs.reporter())
      .pipe(jscs.reporter('fail'));
  });

  gulp.task('lint', function onLint(done) {

    return runSequence(['scss-lint', 'js-lint'], done);
  });
}(require));
