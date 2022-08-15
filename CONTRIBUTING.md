# How To Contribute

## Installation

- `git clone git@github.com:data-eden/data-eden.git`
- `cd data-eden`
- `npm ci`

## Linting

- `npm run lint`
- `npm run lint:fix`

If you would like to automatically run `lint:fix` style fixers before
commiting, you can setup a local pre-commit hook with `git`.

To do that, you would create a `.git/hooks/pre-commit` file that looks like:

```sh
#!/bin/sh

npx lint-staged
```

Here is a quick "one-liner" that you can use to set this up:

```bash
printf '#!'"/bin/sh\n\nnpx lint-staged\n" > .git/hooks/pre-commit
```

## Running tests

- `npm test` – Runs the test suite for each workspace package
- `npm test --workspace @data-eden/<workspace name>` – Runs the test suite for a specific workspace

### Node < 18

In order to run tests locally on Node versions older you must ensure that
`fetch` & `Request` are present on the global context (e.g. `globalThis`). The simplest way to do that is:

```sh
NODE_OPTIONS="--require=cross-fetch/polyfill" volta run --node=16 --npm=bundled npm test
```

This ensures that the cross-fetch/polyfill runs first (and therefore sets up the required globals).
