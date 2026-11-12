# Contributing

Issues and pull requests are welcome. This guide describes how to report a
problem, propose a change, and run the project's development checks locally.

## Issues

Before opening an issue, search existing open and closed issues to avoid
duplicates. Use an issue to report a reproducible bug, suggest an improvement,
or ask a focused question about the project.

When reporting a bug, include:

* What you expected to happen and what actually happened.
* Minimal steps or code to reproduce it, with sensitive data removed.
* The relevant environment details, such as Node.js version and whether the
  problem occurs in Google Apps Script, the Memory Driver, or both.
* Any useful error message or test output.

For feature requests, describe the use case and the behavior you would expect.
For larger or behavior-changing proposals, open an issue first so the approach
can be discussed before implementation.

## Development workflow

1. Fork the repository and clone your fork.
2. Create a branch for your change.
3. Install dependencies:

   ```sh
   npm ci
   ```

4. Make a focused change. Add or update tests for behavior changes and update
   the documentation or examples when relevant.
5. Run the checks before submitting:

   ```sh
   npm run verify
   ```

   This runs the test suite with coverage, type-checks the test sources, builds
   the library, and runs a smoke test against the generated distribution.
6. Open a pull request against `main`. Summarize the change, link the related
   issue (for example, `Closes #123`), and include the verification you ran.
   If the change is not yet complete, mark the pull request as a draft.

Keep pull requests scoped to one issue or closely related change where
possible. Do not include generated `dist/` output; the build recreates it.

## Useful commands

Run the test suite without coverage:

```sh
npm test
```

Type-check the tests:

```sh
npm run typecheck:test
```

Run the local Memory Driver CRUD example:

```sh
npm run example:memory
```

The Google Apps Script example and its setup instructions are in
[`examples/README.md`](examples/README.md). Local development and pull request
verification do not require access to a Google account or spreadsheet.
