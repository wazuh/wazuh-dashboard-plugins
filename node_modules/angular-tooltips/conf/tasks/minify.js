/*global require*/
(function buildTask(require) {
  'use strict';

  var gulp = require('gulp')
    , plumber = require('gulp-plumber')
    , sourcemaps = require('gulp-sourcemaps')
    , paths = require('../paths')
    , header = require('gulp-header')
    , uglify = require('gulp-uglify')
    , cssmin = require('gulp-cssmin')
    , rename = require('gulp-rename')
    , runSequence = require('run-sequence');

  gulp.task('minify', ['build'], function onMinify(done) {

    return runSequence([
      'minify-js',
      'minify-css'
    ], done);
  });

  gulp.task('minify-js', function onMinifyJs() {

    return gulp.src(paths.output + paths.files.unminified.js)
      .pipe(plumber())
      .pipe(sourcemaps.init({
        'loadMaps': true,
        'debug': true
      }))
      .pipe(uglify())
      .pipe(header(paths.banner))
      .pipe(sourcemaps.write('.', {
        'includeContent': false,
        'sourceRoot': '../lib'
      }))
      .pipe(rename(function onFileRename(path) {
        if (path.extname !== '.map') {
          path.basename += '.min';
        }

        return path;
      }))
      .pipe(gulp.dest(paths.output));
  });

  gulp.task('minify-css', function onMinifyCss() {

    return gulp.src(paths.output + paths.files.unminified.css)
      .pipe(plumber())
      .pipe(sourcemaps.init({
        'loadMaps': true,
        'debug': true
      }))
      .pipe(cssmin())
      .pipe(header(paths.banner))
      .pipe(sourcemaps.write('.', {
        'includeContent': false,
        'sourceRoot': '../lib'
      }))
      .pipe(rename(function onFileRename(path) {

        if (path.extname !== '.map') {
          path.basename += '.min';
        }
        return path;
      }))
      .pipe(gulp.dest(paths.output));
  });

}(require));
