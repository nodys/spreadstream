# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="3.2.0"></a>
# [3.2.0](https://github.com/nodys/spreadstream/compare/v3.1.3...v3.2.0) (2018-04-09)


### Features

* Add experimental transform for output ([39d00e7](https://github.com/nodys/spreadstream/commit/39d00e7))



<a name="3.1.3"></a>
## [3.1.3](https://github.com/nodys/spreadstream/compare/v3.1.2...v3.1.3) (2018-04-03)


### Bug Fixes

* Hnadle properly unformatted values ([9c86c4d](https://github.com/nodys/spreadstream/commit/9c86c4d))


### Features

* **json:** csvFieldToJson can now be configured ([c26753c](https://github.com/nodys/spreadstream/commit/c26753c))



<a name="3.1.2"></a>
## [3.1.2](https://github.com/nodys/spreadstream/compare/v3.1.1...v3.1.2) (2018-03-29)


### Bug Fixes

* **json:** Empty cell should be converted to null ([930fb1a](https://github.com/nodys/spreadstream/commit/930fb1a))



<a name="3.1.1"></a>
## [3.1.1](https://github.com/nodys/spreadstream/compare/v3.1.0...v3.1.1) (2018-03-29)


### Bug Fixes

* **json:** Classic json stream should support empty stream ([8b1afc3](https://github.com/nodys/spreadstream/commit/8b1afc3))



<a name="3.1.0"></a>
# [3.1.0](https://github.com/nodys/spreadstream/compare/v3.0.1...v3.1.0) (2018-03-27)


### Features

* **stream:** Expose internal classic json stream ([7194d90](https://github.com/nodys/spreadstream/commit/7194d90))



<a name="3.0.1"></a>
## [3.0.1](https://github.com/nodys/spreadstream/compare/v3.0.0...v3.0.1) (2018-03-26)


### Bug Fixes

* **json:** Invalid boolean parser ([aaa99bd](https://github.com/nodys/spreadstream/commit/aaa99bd))



<a name="3.0.0"></a>
# [3.0.0](https://github.com/nodys/spreadstream/compare/v2.2.0...v3.0.0) (2018-03-22)


### Bug Fixes

* **option:** Normalize json-classic option ([2784fce](https://github.com/nodys/spreadstream/commit/2784fce))
* **option:** Normalize value render option and value input option names ([995aa69](https://github.com/nodys/spreadstream/commit/995aa69))
* **option:** Read properly valueInputOption ([36591f4](https://github.com/nodys/spreadstream/commit/36591f4))
* **test:** Add the graceful option ([5621a01](https://github.com/nodys/spreadstream/commit/5621a01))


### Features

* **error:** Throw an error if the source sheet does not exists fix [#1](https://github.com/nodys/spreadstream/issues/1) ([5c7e098](https://github.com/nodys/spreadstream/commit/5c7e098))
* **json:** Add value parser for json values for boolean and number ([fab795f](https://github.com/nodys/spreadstream/commit/fab795f))



<a name="2.2.0"></a>
# [2.2.0](https://github.com/nodys/spreadstream/compare/v2.1.0...v2.2.0) (2018-03-22)


### Bug Fixes

* **init:** Fix typo in rc file output ([4730f37](https://github.com/nodys/spreadstream/commit/4730f37))


### Features

* **doc:** Add a notice about the init tool ([459fe50](https://github.com/nodys/spreadstream/commit/459fe50))
* **stream:** Add new stream output --classic-json ([f76aa85](https://github.com/nodys/spreadstream/commit/f76aa85))



<a name="2.1.0"></a>
# [2.1.0](https://github.com/nodys/spreadstream/compare/v2.0.0...v2.1.0) (2018-03-07)


### Bug Fixes

* **standard:** Fix style ([e469b2d](https://github.com/nodys/spreadstream/commit/e469b2d))


### Features

* Add spreadstream init tool ([3287401](https://github.com/nodys/spreadstream/commit/3287401))



<a name="2.0.0"></a>
# [2.0.0](https://github.com/nodys/spreadstream/compare/v1.2.0...v2.0.0) (2018-03-07)


### Features

* **headers:** Add new headers options ([8dc1562](https://github.com/nodys/spreadstream/commit/8dc1562))


### BREAKING CHANGES

* **headers:** the `--headers` option has been removed



<a name="1.2.0"></a>
# [1.2.0](https://github.com/nodys/spreadstream/compare/v1.1.0...v1.2.0) (2018-03-07)


### Features

* Add option to disable csv header output ([91f189b](https://github.com/nodys/spreadstream/commit/91f189b))



<a name="1.1.0"></a>
# [1.1.0](https://github.com/nodys/spreadstream/compare/v1.0.3...v1.1.0) (2018-02-20)


### Bug Fixes

* Major dimension and header filtering missing ([67b43d8](https://github.com/nodys/spreadstream/commit/67b43d8))
* Refactor according to google api changes ([ff69c1d](https://github.com/nodys/spreadstream/commit/ff69c1d))



<a name="1.0.3"></a>
## [1.0.3](https://github.com/nodys/spreadstream/compare/v1.0.2...v1.0.3) (2018-02-20)


### Bug Fixes

* Documentation typos ([b56a814](https://github.com/nodys/spreadstream/commit/b56a814))



<a name="1.0.2"></a>
## [1.0.2](https://github.com/nodys/spreadstream/compare/v1.0.1...v1.0.2) (2018-01-15)



<a name="1.0.1"></a>
## [1.0.1](https://github.com/nodys/spreadstream/compare/v1.0.0...v1.0.1) (2017-12-18)


### Features

* **doc:** Minor fixes ([da3c0bd](https://github.com/nodys/spreadstream/commit/da3c0bd))



<a name="1.0.0"></a>
# [1.0.0](https://github.com/nodys/spreadstream/compare/v0.3.0...v1.0.0) (2017-12-15)


### Bug Fixes

* Max buffer inclusive range ([c8b8196](https://github.com/nodys/spreadstream/commit/c8b8196))
* **doc:** Add missing code syntax highlight ([ec9a102](https://github.com/nodys/spreadstream/commit/ec9a102))


### Features

* Simplify read method, add range option ([8a9a456](https://github.com/nodys/spreadstream/commit/8a9a456))
* **doc:** Cleanup documentation ([b74fcd9](https://github.com/nodys/spreadstream/commit/b74fcd9))



<a name="0.3.0"></a>
# [0.3.0](https://github.com/nodys/spreadstream/compare/v0.2.0...v0.3.0) (2017-12-14)


### Bug Fixes

* **doc:** Add docsify repo ([fb4d067](https://github.com/nodys/spreadstream/commit/fb4d067))
* Spreadsheet returns a Writable ([2e1dc76](https://github.com/nodys/spreadstream/commit/2e1dc76))


### Features

* **doc:** Enhand documentation ([b284488](https://github.com/nodys/spreadstream/commit/b284488))
* Refactor api, normalize command line options ([910c2af](https://github.com/nodys/spreadstream/commit/910c2af))
* **test:** Add some tests ([9c06ead](https://github.com/nodys/spreadstream/commit/9c06ead))



<a name="0.2.0"></a>
# [0.2.0](https://github.com/nodys/spreadstream/compare/v0.1.0...v0.2.0) (2017-12-13)


### Bug Fixes

* Add missing libraries ([953e4cd](https://github.com/nodys/spreadstream/commit/953e4cd))


### Features

* Add a read mode ([8f97c71](https://github.com/nodys/spreadstream/commit/8f97c71))
* Add read and json option ([1a0a0b1](https://github.com/nodys/spreadstream/commit/1a0a0b1))
* Simplify and support for array or object stream ([980f4cb](https://github.com/nodys/spreadstream/commit/980f4cb))



<a name="0.1.0"></a>
# [0.1.0](https://github.com/nodys/spreadstream/compare/v0.0.1...v0.1.0) (2017-12-12)



<a name="0.0.1"></a>
## 0.0.1 (2017-12-12)


### Features

* Fully functionnal version 8d3b9f7
