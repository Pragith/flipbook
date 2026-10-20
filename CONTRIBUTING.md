# Contributing

Thanks for helping improve flipbook. Small, focused changes are easiest to review.

## Setup

Use Node 22.18+ and npm. Fork/clone the repository, run `npm ci`, then `npm run dev`. Start with the original `assets/sample.pdf`; keep private test files outside the repository.

Before opening a pull request:

```sh
npm test
npm run build
```

For viewer changes, also check the real browser: cover, interior spread, final spread, page selection, text copying, stacks, thumbnails, search, resizing and reduced motion. For entry changes, check file opening, URL validation, loading/error states and the welcome page at small window sizes. Include a screenshot or short recording for visible changes.

## Pull requests

Explain the problem, the resulting behavior and how you tested it. Keep unrelated refactoring separate. Add meaningful regression tests for navigation or URL-handling changes. Do not commit generated assets, dependencies, private PDFs or credentials. Treat dependency and license changes explicitly.

## Bugs and ideas

Include browser/OS versions, reproduction steps, expected/actual behavior and relevant console errors. Share an original or openly licensed minimal PDF when possible. Say whether a URL is publicly accessible and whether the host allows cross-origin reads. Never paste signed URLs, private documents or credentials into public issues.

Contributions are accepted under the MIT license. By submitting original code or artwork, you confirm that you may contribute it under that license.
