# Contributing to PanelProbe

Thanks for helping improve PanelProbe. This guide covers how to report
problems, propose tests, and send pull requests.

## Reporting bugs

Open an [issue](https://github.com/csharikrishna/dispdoc/issues/new/choose) and include:

- Browser and version, operating system, and device or monitor model
- Display scaling (e.g. 125%) and refresh rate
- Steps to reproduce, and what you expected to happen
- A screenshot or a photo of the screen, if relevant

For display artifacts, a photo of the screen taken with a phone is usually more
useful than a screenshot, because screenshots capture the signal rather than
what the panel shows.

## Proposing a new test

Open a feature request describing:

- **What defect it reveals**, and on which panel types
- **How a user judges the result**: what "good" and "bad" look like
- Whether it **flashes**. Flashing tests need `autoStop` and must stay out of Test All.

## Development

Requirements: Node.js 22.12+ (dev tooling only) and a local Chrome or Chromium
for the smoke test.

```bash
npm install
npm start          # http://localhost:8080/dispdoc/
npm run verify     # lint + static checks + browser smoke test
```

The site has no build step: edit a file and reload. Read
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) before making structural changes.
It explains the module layout and walks through adding a test.

## Code style

- Plain, dependency-free browser JavaScript. Classic scripts attach to the
  `window.DD` namespace; don't introduce a bundler or a framework.
- Four-space indentation, single quotes, semicolons (see `.editorconfig`).
  ESLint enforces the rest.
- Keep modules focused: patterns in `studio/js/tests/`, UI in `studio/js/ui/`,
  cross-page helpers in `assets/js/shared/`.
- Use design tokens from `assets/css/base.css`; don't hard-code UI colors.
  (Test patterns themselves use exact colors on purpose.)
- Keep user-facing copy honest. Don't claim hardware measurements a browser
  cannot make.
- Interactive elements must be keyboard operable and labeled.

## Pull requests

1. Fork, then create a branch from `main` (`fix/…`, `feat/…`, `docs/…`).
2. Make focused commits with clear messages, e.g. `fix(gamma): correct patch level at γ 2.4`.
3. Run `npm run verify` and make sure it passes.
4. For visual changes, add before/after screenshots to the PR.
5. Update `README.md`, `index.html`, and `CHANGELOG.md` when behavior changes.

By contributing, you agree that your contributions are licensed under the
[MIT License](LICENSE).
