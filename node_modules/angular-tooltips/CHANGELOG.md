# Change Log
This project adheres to [Semantic Versioning](http://semver.org/).

Actual status from last release: [Unreleased]

## [1.0.7] - 2016-01-26
### Added
- this CHANGELOG.

### Fixed
- main in `package.json` was pointing `src/index.js`, changed to `index.js` ([#138]).

## [1.0.6] - 2015-12-09
### Added
- `tooltip-append-to-body` attribute that clones the tooltip and append this directly on body. This enables the tooltip position also, for instance, if you have an scrolling area. **This option does heavy javascript calculation**.

## [1.0.5] - 2015-10-06
### Fixed
- Fixed [#125].
- Fixed [#126].

[Unreleased]: https://github.com/720kb/angular-tooltips/compare/v1.0.7...HEAD
[1.0.7]: https://github.com/720kb/angular-tooltips/compare/v1.0.6...v1.0.7
[1.0.6]: https://github.com/720kb/angular-tooltips/compare/v1.0.5...v1.0.6
[1.0.5]: https://github.com/720kb/angular-tooltips/compare/v1.0.4...v1.0.5

[#138]: https://github.com/720kb/angular-tooltips/issues/138
[#126]: https://github.com/720kb/angular-tooltips/issues/126
[#125]: https://github.com/720kb/angular-tooltips/issues/125
