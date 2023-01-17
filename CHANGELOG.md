# Changelog

## v0.3.0 (2023-01-17)

#### :boom: Breaking Change
* `network`
  * [#45](https://github.com/data-eden/data-eden/pull/45) Require "host" environment to include a `fetch` API ([@rwjblue](https://github.com/rwjblue))

#### :rocket: Enhancement

- `cache`
  - [#40](https://github.com/data-eden/data-eden/pull/40) Initial implementation ([@shuba3862](https://github.com/shuba3862))

#### Committers: 2
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))
- ([@shuba3862](https://github.com/shuba3862))


## v0.2.2-beta.2 (2023-01-17)

#### :boom: Breaking Change
* `network`
  * [#45](https://github.com/data-eden/data-eden/pull/45) Require "host" environment to include a `fetch` API ([@rwjblue](https://github.com/rwjblue))

#### :house: Internal
* Other
  * [#62](https://github.com/data-eden/data-eden/pull/62) Update vitest + patch-package to latest ([@rwjblue](https://github.com/rwjblue))
  * [#61](https://github.com/data-eden/data-eden/pull/61) Update release-it dependencies ([@rwjblue](https://github.com/rwjblue))
  * [#60](https://github.com/data-eden/data-eden/pull/60) Improve test performance: Don't wait on `server.close()` ([@rwjblue](https://github.com/rwjblue))
  * [#57](https://github.com/data-eden/data-eden/pull/57) Update linting related packages ([@rwjblue](https://github.com/rwjblue))
  * [#56](https://github.com/data-eden/data-eden/pull/56) Update typescript related packages to latest. ([@rwjblue](https://github.com/rwjblue))
  * [#54](https://github.com/data-eden/data-eden/pull/54) Update `vite` and `vitest` to latest ([@rwjblue](https://github.com/rwjblue))
  * [#52](https://github.com/data-eden/data-eden/pull/52) Remove `yarn.lock` ([@rwjblue](https://github.com/rwjblue))
* `network`
  * [#59](https://github.com/data-eden/data-eden/pull/59) Extract simple test server implementation ([@rwjblue](https://github.com/rwjblue))
  * [#55](https://github.com/data-eden/data-eden/pull/55) Replace `msw` with `http` server ([@rwjblue](https://github.com/rwjblue))
  * [#50](https://github.com/data-eden/data-eden/pull/50) Update msw to latest ([@rwjblue](https://github.com/rwjblue))
  * [#51](https://github.com/data-eden/data-eden/pull/51) Add test for middleware ordering (including results) ([@rwjblue](https://github.com/rwjblue))

#### Committers: 1
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))

## v0.2.2-beta.1 (2022-12-21)

#### :house: Internal
* [#49](https://github.com/data-eden/data-eden/pull/49) Update linting related devDependencies. ([@rwjblue](https://github.com/rwjblue))

#### Committers: 2
- David J. Hamilton ([@hjdivad](https://github.com/hjdivad))
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))

## v0.2.1 (2022-08-11)

#### :bug: Bug Fix
* `athena`, `cache`, `network`
  * [#44](https://github.com/data-eden/data-eden/pull/44) Add `main` and `typings` to packages ([@rwjblue](https://github.com/rwjblue))

#### Committers: 2
- Gabriel Csapo ([@gabrielcsapo](https://github.com/gabrielcsapo))
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))


## v0.2.0 (2022-08-11)


## v0.1.4 (2022-08-08)

#### :house: Internal
* [#38](https://github.com/data-eden/data-eden/pull/38) Update typescript related dependencies to latest ([@rwjblue](https://github.com/rwjblue))
* [#37](https://github.com/data-eden/data-eden/pull/37) Update vite and vitest to latest ([@rwjblue](https://github.com/rwjblue))

#### Committers: 2
- Gabriel Csapo ([@gabrielcsapo](https://github.com/gabrielcsapo))
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))


## v0.1.3 (2022-08-04)

#### :bug: Bug Fix
* `network`
  * [#34](https://github.com/data-eden/data-eden/pull/34) feat: export types from fetch to utilize in external middlewares ([@gabrielcsapo](https://github.com/gabrielcsapo))

#### Committers: 2
- Gabriel Csapo ([@gabrielcsapo](https://github.com/gabrielcsapo))
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))


## v0.1.2 (2022-08-04)

#### :memo: Documentation
* `athena`, `cache`, `network`
  * [#33](https://github.com/data-eden/data-eden/pull/33) Add license field to published package.json's ([@rwjblue](https://github.com/rwjblue))

#### Committers: 1
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))


## v0.1.1 (2022-08-04)

#### :bug: Bug Fix
* [#31](https://github.com/data-eden/data-eden/pull/31) bug: adds prepublish to make sure published packages have dist and d.ts file ([@gabrielcsapo](https://github.com/gabrielcsapo))

#### :house: Internal
* [#32](https://github.com/data-eden/data-eden/pull/32) Add `CHANGELOG.md` to `.prettierignore` ([@rwjblue](https://github.com/rwjblue))

#### Committers: 2
- Gabriel Csapo ([@gabrielcsapo](https://github.com/gabrielcsapo))
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))


## v0.1.0 (2022-08-01)

#### :rocket: Enhancement

- `network`
  - [#12](https://github.com/data-eden/data-eden/pull/12) feat: adds buildFetch functionality to network ([@gabrielcsapo](https://github.com/gabrielcsapo))

#### :memo: Documentation

- `network`
  - [#29](https://github.com/data-eden/data-eden/pull/29) hjdivad/middlewares with header api ([@hjdivad](https://github.com/hjdivad))
  - [#7](https://github.com/data-eden/data-eden/pull/7) ReadMe Driven Development ([@hjdivad](https://github.com/hjdivad))
- Other
  - [#23](https://github.com/data-eden/data-eden/pull/23) Setup basic CONTRIBUTING.md. ([@rwjblue](https://github.com/rwjblue))
  - [#20](https://github.com/data-eden/data-eden/pull/20) feat: adds lint staged and contributing docs on how to install the git hook ([@gabrielcsapo](https://github.com/gabrielcsapo))

#### :house: Internal

- `athena`, `cache`, `network`
  - [#25](https://github.com/data-eden/data-eden/pull/25) Add simple package.json linting setup ([@rwjblue](https://github.com/rwjblue))
  - [#19](https://github.com/data-eden/data-eden/pull/19) Add eslint <-> TypeScript integration ([@rwjblue](https://github.com/rwjblue))
  - [#18](https://github.com/data-eden/data-eden/pull/18) Add prettier setup to CI ([@rwjblue](https://github.com/rwjblue))
  - [#14](https://github.com/data-eden/data-eden/pull/14) Add basic vitest test harness ([@rwjblue](https://github.com/rwjblue))
  - [#10](https://github.com/data-eden/data-eden/pull/10) Only allow importing from the entry point of each package ([@rwjblue](https://github.com/rwjblue))
  - [#9](https://github.com/data-eden/data-eden/pull/9) Add TypeScript build infrastructure ([@rwjblue](https://github.com/rwjblue))
- Other
  - [#23](https://github.com/data-eden/data-eden/pull/23) Setup basic CONTRIBUTING.md. ([@rwjblue](https://github.com/rwjblue))
  - [#24](https://github.com/data-eden/data-eden/pull/24) Remove `prettier` integration from eslint setup. ([@rwjblue](https://github.com/rwjblue))
  - [#22](https://github.com/data-eden/data-eden/pull/22) Add `npm run lint:fix` setup ([@rwjblue](https://github.com/rwjblue))
  - [#20](https://github.com/data-eden/data-eden/pull/20) feat: adds lint staged and contributing docs on how to install the git hook ([@gabrielcsapo](https://github.com/gabrielcsapo))
  - [#17](https://github.com/data-eden/data-eden/pull/17) Ensure we ignore /packages/\*/dist when linting ([@rwjblue](https://github.com/rwjblue))

#### Committers: 3

- David J. Hamilton ([@hjdivad](https://github.com/hjdivad))
- Gabriel Csapo ([@gabrielcsapo](https://github.com/gabrielcsapo))
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))

# Changelog
