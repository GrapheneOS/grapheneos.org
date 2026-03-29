# Test Suite

This folder contains:

- unit tests for localization helpers and localized build output
- Playwright end-to-end tests for interactive site elements on all languages

## Install test dependencies

From the repository root:

```bash
pip install -r test/requirements.txt
python -m playwright install chromium
```

If your virtual environment does not already include the project dependencies, install them separately:

```bash
pip install -r requirements.txt
```

## Run tests

```bash
python -m pytest test -q
```

The Playwright tests serve the built site from `static-tmp`, so rebuild the site first if the localized output is outdated.
