/*global console,__dirname,require*/
(function serveTask(console, __dirname, require) {
  'use strict';

  var gulp = require('gulp')
    , browserSync = require('browser-sync')
    , historyApiFallback = require('connect-history-api-fallback');

  gulp.task('serve', ['watch'], function runBrowserSync(done) {

    browserSync({
      'open': true,
      'ui': false,
      'port': 8100,
      'server': {
        'baseDir': ['.'],
        'middleware': [
          historyApiFallback()
        ]
      }
    }, done);
  });
}(console, __dirname, require));
