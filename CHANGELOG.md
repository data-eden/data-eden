# Changelog






## v0.16.4 (2023-07-20)

#### :rocket: Enhancement
* `network`
  * [#176](https://github.com/data-eden/data-eden/pull/176) Support manipulating the promise returned by fetch ([@larry-x-yu](https://github.com/larry-x-yu))

#### Committers: 1
- Larry Yu ([@larry-x-yu](https://github.com/larry-x-yu))
- David J. Hamilton ([@hjdivad](https://github.com/hjdivad))


## v0.16.3 (2023-07-19)

#### :rocket: Enhancement
* `mocker`
  * [#174](https://github.com/data-eden/data-eden/pull/174) feat: inlines fragments to simplify use cases and fixes DeepPartial type ([@gabrielcsapo](https://github.com/gabrielcsapo))

#### :bug: Bug Fix
* `mocker`
  * [#174](https://github.com/data-eden/data-eden/pull/174) feat: inlines fragments to simplify use cases and fixes DeepPartial type ([@gabrielcsapo](https://github.com/gabrielcsapo))

#### Committers: 1
- Gabriel Csapo ([@gabrielcsapo](https://github.com/gabrielcsapo))

## v0.16.2 (2023-07-10)

#### :rocket: Enhancement
* `athena`, `mocker`
  * [#172](https://github.com/data-eden/data-eden/pull/172) feat: make mocker.mock synchronous ([@gabrielcsapo](https://github.com/gabrielcsapo))
* `mocker`
  * [#171](https://github.com/data-eden/data-eden/pull/171) feat: thread types through to get autcomplete for mockData ([@gabrielcsapo](https://github.com/gabrielcsapo))

#### :bug: Bug Fix
* `codegen`
  * [#173](https://github.com/data-eden/data-eden/pull/173) bug: fix missing fragment docs for gql tags in codegen ([@gabrielcsapo](https://github.com/gabrielcsapo))

#### Committers: 1
- Gabriel Csapo ([@gabrielcsapo](https://github.com/gabrielcsapo))


## v0.16.1 (2023-06-29)

#### :bug: Bug Fix
* [#170](https://github.com/data-eden/data-eden/pull/170) bug: ensure we build @data-eden/mocker before publishing ([@gabrielcsapo](https://github.com/gabrielcsapo))

#### Committers: 1
- Gabriel Csapo ([@gabrielcsapo](https://github.com/gabrielcsapo))


## v0.16.0 (2023-06-29)

#### :rocket: Enhancement
* `mocker`
  * [#169](https://github.com/data-eden/data-eden/pull/169) feat: support union fragments mocking top level ([@gabrielcsapo](https://github.com/gabrielcsapo))

#### :bug: Bug Fix
* `mocker`
  * [#169](https://github.com/data-eden/data-eden/pull/169) feat: support union fragments mocking top level ([@gabrielcsapo](https://github.com/gabrielcsapo))

#### :house: Internal
* [#168](https://github.com/data-eden/data-eden/pull/168) chore: cleans up design and moves data around ([@gabrielcsapo](https://github.com/gabrielcsapo))

#### Committers: 1
- Gabriel Csapo ([@gabrielcsapo](https://github.com/gabrielcsapo))


## v0.15.0 (2023-06-27)

#### :rocket: Enhancement

- `athena`
  - [#167](https://github.com/data-eden/data-eden/pull/167) feat: handle unmanaged objects with synthetic keys ([@cafreeman](https://github.com/cafreeman), [@gabrielcsapo](https://github.com/gabrielcsapo))

#### :bug: Bug Fix

- `athena`
  - [#167](https://github.com/data-eden/data-eden/pull/167) feat: handle unmanaged objects with synthetic keys ([@cafreeman](https://github.com/cafreeman), [@gabrielcsapo](https://github.com/gabrielcsapo))

#### Committers: 1

- Chris Freeman ([@cafreeman](https://github.com/cafreeman))
- Gabriel Csapo ([@gabrielcsapo](https://github.com/gabrielcsapo))

## v0.14.0 (2023-06-23)

#### :rocket: Enhancement
* `athena`
  * [#164](https://github.com/data-eden/data-eden/pull/164) feat: support non-managed entities ([@gabrielcsapo](https://github.com/gabrielcsapo))

#### Committers: 1
- Gabriel Csapo ([@gabrielcsapo](https://github.com/gabrielcsapo))

## v0.13.2 (2023-06-23)

#### :bug: Bug Fix
* `cache`, `codegen`
  * [#166](https://github.com/data-eden/data-eden/pull/166) bug: fixing live-transaction in implementation ([@gabrielcsapo](https://github.com/gabrielcsapo))

#### Committers: 1
- Gabriel Csapo ([@gabrielcsapo](https://github.com/gabrielcsapo))

## v0.13.1 (2023-06-23)

#### :rocket: Enhancement
* `codegen`
  * [#163](https://github.com/data-eden/data-eden/pull/163) feat: adds __typename to all projections ([@gabrielcsapo](https://github.com/gabrielcsapo))

#### :bug: Bug Fix
* `cache`
  * [#165](https://github.com/data-eden/data-eden/pull/165) bug: integration into downstreams exposes type issue in cache ([@gabrielcsapo](https://github.com/gabrielcsapo))

#### Committers: 1
- Gabriel Csapo ([@gabrielcsapo](https://github.com/gabrielcsapo))

## v0.13.0 (2023-06-22)

#### :rocket: Enhancement
* `athena`, `cache`, `codegen`, `ember`, `mocker`, `network`, `react`
  * [#162](https://github.com/data-eden/data-eden/pull/162) feat: migrate to typescript@5 ([@gabrielcsapo](https://github.com/gabrielcsapo))

#### Committers: 1
- Gabriel Csapo ([@gabrielcsapo](https://github.com/gabrielcsapo))

## v0.12.2 (2023-06-21)

#### :rocket: Enhancement
* `athena`, `cache`, `react`
  * [#161](https://github.com/data-eden/data-eden/pull/161) feat: adds mergeResolvers to handle fetchMore data ([@gabrielcsapo](https://github.com/gabrielcsapo))

#### Committers: 1
- Gabriel Csapo ([@gabrielcsapo](https://github.com/gabrielcsapo))

## v0.12.1 (2023-06-16)

#### :bug: Bug Fix
* `react`
  * [#160](https://github.com/data-eden/data-eden/pull/160) bug: ensure that we retrigger dependency setup when calling refetch ([@gabrielcsapo](https://github.com/gabrielcsapo))
  * [#159](https://github.com/data-eden/data-eden/pull/159) bug: fix findMore when data at certain levels is undefined when merging ([@gabrielcsapo](https://github.com/gabrielcsapo))

#### Committers: 1
- Gabriel Csapo ([@gabrielcsapo](https://github.com/gabrielcsapo))

## v0.12.0 (2023-06-16)

#### :rocket: Enhancement
* `codegen`, `react`
  * [#155](https://github.com/data-eden/data-eden/pull/155) feat: adds fetchMore to deep merge results ontop of existing results ([@gabrielcsapo](https://github.com/gabrielcsapo))

#### :house: Internal
* [#157](https://github.com/data-eden/data-eden/pull/157) chore: fix demo app to make sure it loads ([@gabrielcsapo](https://github.com/gabrielcsapo))

#### Committers: 1
- Gabriel Csapo ([@gabrielcsapo](https://github.com/gabrielcsapo))

## v0.11.0 (2023-06-15)

#### :rocket: Enhancement
* `codegen`, `mocker`
  * [#154](https://github.com/data-eden/data-eden/pull/154) feat: enable mocker to properly return typed data ([@gabrielcsapo](https://github.com/gabrielcsapo))
* `athena`, `react`
  * [#153](https://github.com/data-eden/data-eden/pull/153) Add query response caching to Athena ([@cafreeman](https://github.com/cafreeman))

#### :house: Internal
* `codegen`
  * [#156](https://github.com/data-eden/data-eden/pull/156) chore: adds clean before build ([@gabrielcsapo](https://github.com/gabrielcsapo))

#### Committers: 2
- Chris Freeman ([@cafreeman](https://github.com/cafreeman))
- Gabriel Csapo ([@gabrielcsapo](https://github.com/gabrielcsapo))

## v0.10.0 (2023-06-13)

#### :rocket: Enhancement
* `network`
  * [#152](https://github.com/data-eden/data-eden/pull/152) fix: clean up globaThis typing ([@hjdivad](https://github.com/hjdivad))
* `codegen`, `mocker`
  * [#149](https://github.com/data-eden/data-eden/pull/149) feat: utilize rollup plugin to build and test mocker ([@gabrielcsapo](https://github.com/gabrielcsapo))
* `mocker`
  * [#147](https://github.com/data-eden/data-eden/pull/147) feat: create mocker with basic support for fragments, queries and mutations ([@gabrielcsapo](https://github.com/gabrielcsapo))

#### Committers: 2
- David J. Hamilton ([@hjdivad](https://github.com/hjdivad))
- Gabriel Csapo ([@gabrielcsapo](https://github.com/gabrielcsapo))

## v0.9.0 (2023-06-07)


## v0.8.2 (2023-06-05)

#### :rocket: Enhancement
* `athena`, `cache`, `codegen`, `network`, `react`
  * [#143](https://github.com/data-eden/data-eden/pull/143) build esm and cjs bundles ([@cafreeman](https://github.com/cafreeman))

#### Committers: 1
- Chris Freeman ([@cafreeman](https://github.com/cafreeman))

## v0.8.1 (2023-06-02)

#### :bug: Bug Fix
* `athena`
  * [#142](https://github.com/data-eden/data-eden/pull/142) [athena] remove duplicate visited check in resolve ([@cafreeman](https://github.com/cafreeman))

#### Committers: 1
- Chris Freeman ([@cafreeman](https://github.com/cafreeman))


## v0.8.0 (2023-06-02)

#### :rocket: Enhancement
* `athena`, `ember`, `react`
  * [#141](https://github.com/data-eden/data-eden/pull/141) [athena] Fix bug in cycle detection and a few minor tweaks ([@cafreeman](https://github.com/cafreeman))

#### :bug: Bug Fix
* `athena`, `ember`, `react`
  * [#141](https://github.com/data-eden/data-eden/pull/141) [athena] Fix bug in cycle detection and a few minor tweaks ([@cafreeman](https://github.com/cafreeman))

#### Committers: 3
- Chris Freeman ([@cafreeman](https://github.com/cafreeman))
- Gabriel Csapo ([@gabrielcsapo](https://github.com/gabrielcsapo))
- ska3862 ([@shuba3862](https://github.com/shuba3862))


## v0.7.2 (2023-05-26)

#### :rocket: Enhancement
* `network`
  * [#138](https://github.com/data-eden/data-eden/pull/138) Add a `$debug` property to the `buildFetch` result. ([@rwjblue](https://github.com/rwjblue))

#### Committers: 1
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))


## v0.7.1 (2023-05-26)

#### :bug: Bug Fix
* `network`
  * [#137](https://github.com/data-eden/data-eden/pull/137) Ensure that TrackingInfoPerFetch is always shared across all versions. ([@rwjblue](https://github.com/rwjblue))

#### Committers: 1
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))


## v0.7.0 (2023-05-24)

#### :rocket: Enhancement
* `codegen`
  * [#136](https://github.com/data-eden/data-eden/pull/136) [codegen] support primary key aliasing ([@gabrielcsapo](https://github.com/gabrielcsapo))
  * [#135](https://github.com/data-eden/data-eden/pull/135) [codgen] support a config file for easier setup ([@gabrielcsapo](https://github.com/gabrielcsapo))

#### :bug: Bug Fix
* `codegen`
  * [#130](https://github.com/data-eden/data-eden/pull/130) [codegen] fragment replacement results in warnings in build ([@gabrielcsapo](https://github.com/gabrielcsapo))
  * [#127](https://github.com/data-eden/data-eden/pull/127) [codegen] remove @data-eden/codegen/gql when running babel transform ([@gabrielcsapo](https://github.com/gabrielcsapo))

#### :house: Internal
* `athena`, `cache`, `codegen`, `network`
  * [#131](https://github.com/data-eden/data-eden/pull/131) chore: make it possible to have tests update on src file changes ([@gabrielcsapo](https://github.com/gabrielcsapo))

#### Committers: 1
- Gabriel Csapo ([@gabrielcsapo](https://github.com/gabrielcsapo))

## v0.6.0 (2023-05-18)

#### :boom: Breaking Change
* `athena`, `codegen`, `react`
  * [#115](https://github.com/data-eden/data-eden/pull/115) [codegen] export gql from codegen not @data-eden/react ([@gabrielcsapo](https://github.com/gabrielcsapo))

#### :rocket: Enhancement
* `codegen`
  * [#123](https://github.com/data-eden/data-eden/pull/123) [codegen] be able to configure file resolver ([@gabrielcsapo](https://github.com/gabrielcsapo))
  * [#121](https://github.com/data-eden/data-eden/pull/121) feat: add --disable-schema-types-generation ([@hjdivad](https://github.com/hjdivad))
  * [#119](https://github.com/data-eden/data-eden/pull/119) feat: add --debug ([@hjdivad](https://github.com/hjdivad))
  * [#117](https://github.com/data-eden/data-eden/pull/117) chore: Improve errors ([@hjdivad](https://github.com/hjdivad))
* `athena`, `codegen`
  * [#106](https://github.com/data-eden/data-eden/pull/106) feat: adds ability to share fragments across components ([@gabrielcsapo](https://github.com/gabrielcsapo))
* `athena`, `codegen`, `react`
  * [#115](https://github.com/data-eden/data-eden/pull/115) [codegen] export gql from codegen not @data-eden/react ([@gabrielcsapo](https://github.com/gabrielcsapo))

#### :bug: Bug Fix
* `codegen`
  * [#125](https://github.com/data-eden/data-eden/pull/125) chore: multiple fixes to integrate into next application ([@gabrielcsapo](https://github.com/gabrielcsapo))
  * [#116](https://github.com/data-eden/data-eden/pull/116) [codegen] ensure we check the import for gql ([@gabrielcsapo](https://github.com/gabrielcsapo))
* `cache`
  * [#122](https://github.com/data-eden/data-eden/pull/122)  [cache] restructure tx.commit with cache locking ([@shuba3862](https://github.com/shuba3862))

#### :house: Internal
* `codegen`
  * [#118](https://github.com/data-eden/data-eden/pull/118) tests: add tests ([@hjdivad](https://github.com/hjdivad))
* `cache`
  * [#104](https://github.com/data-eden/data-eden/pull/104) refactor delete, merge and tx iterators ([@shuba3862](https://github.com/shuba3862))
  * [#103](https://github.com/data-eden/data-eden/pull/103) [Cache] refactor tx architecture ([@shuba3862](https://github.com/shuba3862))
* `cache`, `ember`
  * [#102](https://github.com/data-eden/data-eden/pull/102) Make cache.commitTransaction private ([@shuba3862](https://github.com/shuba3862))

#### Committers: 3
- David J. Hamilton ([@hjdivad](https://github.com/hjdivad))
- Gabriel Csapo ([@gabrielcsapo](https://github.com/gabrielcsapo))
- ska3862 ([@shuba3862](https://github.com/shuba3862))

## v0.5.0 (2023-05-12)

#### :boom: Breaking Change
* Other
  * [#98](https://github.com/data-eden/data-eden/pull/98) Drop support for Node 14 ([@cafreeman](https://github.com/cafreeman))
* `athena`, `codegen`
  * [#96](https://github.com/data-eden/data-eden/pull/96) @data-eden/codegen ([@cafreeman](https://github.com/cafreeman))

#### :rocket: Enhancement
* `athena`, `codegen`, `react`
  * [#97](https://github.com/data-eden/data-eden/pull/97) Support `gql` tags in `@data-eden/codegen` ([@cafreeman](https://github.com/cafreeman))
* `athena`, `codegen`
  * [#96](https://github.com/data-eden/data-eden/pull/96) @data-eden/codegen ([@cafreeman](https://github.com/cafreeman))
* `athena`, `cache`, `ember`, `network`, `react`
  * [#83](https://github.com/data-eden/data-eden/pull/83) Initial implementation of Athena runtime ([@cafreeman](https://github.com/cafreeman))
* `ember`, `network`
  * [#86](https://github.com/data-eden/data-eden/pull/86) Exported 2 more types for down stream repos to consume. ([@larry-x-yu](https://github.com/larry-x-yu))
* `ember`, `react`
  * [#85](https://github.com/data-eden/data-eden/pull/85) Add shells for all the incoming packages ([@cafreeman](https://github.com/cafreeman))

#### :bug: Bug Fix
* `athena`
  * [#94](https://github.com/data-eden/data-eden/pull/94) Handle persisted queries and expand configuration options ([@cafreeman](https://github.com/cafreeman))

#### :memo: Documentation
* `athena`
  * [#95](https://github.com/data-eden/data-eden/pull/95) Doc updates ([@abhijeetbabar](https://github.com/abhijeetbabar))

#### :house: Internal
* `cache`, `network`
  * [#93](https://github.com/data-eden/data-eden/pull/93) enforce consistent type imports ([@cafreeman](https://github.com/cafreeman))
* `network`
  * [#92](https://github.com/data-eden/data-eden/pull/92) chore: remove Fetch type export ([@hjdivad](https://github.com/hjdivad))
  * [#89](https://github.com/data-eden/data-eden/pull/89) Add test showing how to return a cached response ([@rwjblue](https://github.com/rwjblue))
* `cache`
  * [#91](https://github.com/data-eden/data-eden/pull/91) test: add a types test ([@hjdivad](https://github.com/hjdivad))
* `cache`, `ember`
  * [#90](https://github.com/data-eden/data-eden/pull/90) [Cache] Decouple Public API and impl details ([@shuba3862](https://github.com/shuba3862))
* Other
  * [#67](https://github.com/data-eden/data-eden/pull/67) Ensure top level `build:watch` runs `tsc --build --watch` ([@rwjblue](https://github.com/rwjblue))
  * [#88](https://github.com/data-eden/data-eden/pull/88) Remove yarn.lock ([@rwjblue](https://github.com/rwjblue))

#### Committers: 6
- Abhijeet P. Babar ([@abhijeetbabar](https://github.com/abhijeetbabar))
- Chris Freeman ([@cafreeman](https://github.com/cafreeman))
- David J. Hamilton ([@hjdivad](https://github.com/hjdivad))
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))
- [@larry-x-yu](https://github.com/larry-x-yu)
- ska3862 ([@shuba3862](https://github.com/shuba3862))

## v0.4.0 (2023-02-01)

#### :boom: Breaking Change
* `cache`
  * [#82](https://github.com/data-eden/data-eden/pull/82) Remove rollback ([@hjdivad](https://github.com/hjdivad))

#### :rocket: Enhancement
* `network`
  * [#53](https://github.com/data-eden/data-eden/pull/53) Create `settled-tracking-middleware` ([@rwjblue](https://github.com/rwjblue))
  * [#69](https://github.com/data-eden/data-eden/pull/69) Expose metadata to middlewares ([@rwjblue](https://github.com/rwjblue))

#### :house: Internal
* [#68](https://github.com/data-eden/data-eden/pull/68) Add script to easily step through `buildFetch` usage. ([@rwjblue](https://github.com/rwjblue))

#### Committers: 2
- David J. Hamilton ([@hjdivad](https://github.com/hjdivad))
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))


## v0.3.2 (2023-01-18)

#### :bug: Bug Fix
* `network`
  * [#66](https://github.com/data-eden/data-eden/pull/66) Ensure that `fetch` is only accessed lazily (allow mocking) ([@rwjblue](https://github.com/rwjblue))

#### Committers: 1
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))


## v0.3.1 (2023-01-17)

#### :house: Internal
* [#65](https://github.com/data-eden/data-eden/pull/65) Run `npm install` after the versions are bumped ([@rwjblue](https://github.com/rwjblue))

#### Committers: 1
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))


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
