# Framework theme-build integration test

A generated, minimal UI5 application project that depends on **all** SAPUI5
framework libraries, so that `ui5 build` (via `@ui5/builder` → `less-openui5`)
can build every framework theme. Build the themes twice — once with a baseline
`less-openui5` and once with a candidate — and structurally compare the output
to catch regressions in `less-openui5`'s generated CSS before publishing.

Nothing about the harness is checked in. `npm run theme-build:prepare`
regenerates it into `test/integration/tmp/` (gitignored) on demand, so there is
no harness `package.json` and **no separate lockfile** to maintain.

## Prerequisites

- **`ui5` (`@ui5/cli`) on your `PATH`** — install it globally
  (`npm i -g @ui5/cli`) or link it from a local `UI5/cli` checkout. This harness
  does not depend on it.
- **`postcss`** — used by the compare script; it's a `devDependency` of this
  repo, so a plain `npm install` at the repo root provides it.

## Choosing which `less-openui5` each build uses — your job

`@ui5/builder` does `import less from "less-openui5"`, which Node resolves to the
copy nested inside your `@ui5/cli` installation. To build with an in-development
`less-openui5`, `npm link` this checkout into that installation between the two
build steps; to build with the released copy, restore it (unlink / reinstall).
The harness deliberately does **not** manage this for you — it only runs the two
builds and compares them.

## Compare loop

Run all commands from the **repo root**.

```sh
npm install                       # provides postcss (repo devDependency)
npm run theme-build:prepare       # generate the harness into test/integration/tmp/

# 1) Baseline: build with your baseline less-openui5 (e.g. the released copy)
npm run theme-build:baseline      # -> test/integration/tmp/framework-theme-build/dist-baseline/

# 2) Candidate: link your local less-openui5 into @ui5/cli, then build
npm run theme-build:compare-build # -> test/integration/tmp/framework-theme-build/dist-compare/

# 3) Compare
npm run theme-build:compare       # exits 1 if there are real (structural) differences
```

With no source changes between the two builds, step 3 reports **"No structural
differences"**. After editing `lib/`, re-run steps 2 and 3 to see the impact.

`theme-build:prepare` takes an optional `@sapui5/distribution-metadata` version
(default `latest`), which fixes the framework version and library list:

```sh
npm run theme-build:prepare -- 1.150.0
```

## Layout (checked in)

- `scripts/prepare.js` — installs `@sapui5/distribution-metadata` into an
  isolated tmp project (via the npm CLI, no lockfile) and generates the harness
  (`ui5.yaml`, `package.json`, `webapp/manifest.json`) into
  `test/integration/tmp/framework-theme-build/`.
- `scripts/compare-themes.mjs` — structural (postcss-AST) diff of the two build
  outputs; reports only **semantic** differences, ignoring whitespace and
  comment formatting.

## Notes

> The build scripts pass `--cache Off`. This is required — otherwise `ui5 build`
> serves the project from its build cache and does **not** notice that the
> `less-openui5` source changed, so your local edits would be silently ignored.

> The first full build takes a while — it builds the themes of every SAPUI5
> library.
