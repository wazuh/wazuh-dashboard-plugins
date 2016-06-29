/*global require,module*/
(function pathConfiguration(require, module) {
  'use strict';

  var infos = require('../package.json')
    , today = new Date()
    , banner = ['/*',
      ' * ' + infos.name,
      ' * ' + infos.version,
      ' * ',
      ' * ' + infos.description,
      ' * ' + infos.homepage,
      ' * ',
      ' * ' + infos.license + ' license',
      ' * ' + today.toDateString('yyyy-MM-dd'),
      ' */',
      ''].join('\n')
    , paths = {
      'banner': banner,
      'lib': 'lib/',
      'output': 'dist/',
      'files': {
        'unminified': {
          'js': 'angular-tooltips.js',
          'css': 'angular-tooltips.css'
        },
        'minified': {
          'js': 'angular-tooltips.min.js',
          'css': 'angular-tooltips.min.css'
        }
      },
      'scss': {
        'files': [
          'lib/**/*.scss'
        ],
        'options': {}
      },
      'assets': [
        'lib/**/*.json',
        'lib/**/*.svg',
        'lib/**/*.woff',
        'lib/**/*.ttf',
        'lib/**/*.png',
        'lib/**/*.ico',
        'lib/**/*.jpg',
        'lib/**/*.gif',
        'lib/**/*.eot'
      ]
    };

  module.exports = paths;
}(require, module));
