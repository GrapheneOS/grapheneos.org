# AGENTS.md - Instructions for AI Assistant

## Project Overview

This is the GrapheneOS website repository. It generates a multilingual static site with i18n support, Atom feeds, and sitemaps.

## Running the Project on Windows

The project uses bash scripts and GNU utilities. For Windows, prefer Docker or WSL2.

### Docker

1. Ensure Docker Desktop is running.
2. Build and run:

```powershell
docker build -t grapheneos-website .
docker run -d -p 80:80 --name grapheneos grapheneos-website
```

The site will be available at [http://localhost](http://localhost).

### Hosts file for testing

Add to `C:\Windows\System32\drivers\etc\hosts`:

```text
127.0.0.1 grapheneostest.org
```

### WSL2

```bash
wsl --install
# In WSL Ubuntu:
sudo apt update
sudo apt install -y python3-venv python3-pip nodejs npm openjdk-17-jre parallel moreutils rsync brotli zopfli libxml2-utils gixy qrencode graphicsmagick
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
npm ci
./process-static
```

## Project Structure

```text
grapheneos.org/
+-- .github/workflows/         # GitHub Actions CI
¦   L-- static.yml             # Build / validation pipeline
+-- templates/                 # Jinja2 templates
¦   +-- header.html
¦   +-- footer.html
¦   +-- i18n.html
¦   L-- seo_meta.html
+-- static/                    # Source static files
¦   +-- *.html
¦   L-- js/
+-- locale/                    # gettext translations (.po/.mo) and translator tooling
¦   +-- de/LC_MESSAGES/
¦   +-- es/LC_MESSAGES/
¦   +-- fr/LC_MESSAGES/
¦   +-- ru/LC_MESSAGES/
¦   +-- report_untranslated.py
¦   L-- FOR-TRANSLATORS.MD
+-- i18n/                      # Additional translation artifacts / reports
+-- nginx/
¦   L-- nginx-dev.conf
+-- test/                      # pytest + Playwright localization / interaction tests
¦   +-- conftest.py
¦   +-- test_localization_unit.py
¦   +-- test_site_interactions.py
¦   +-- requirements.txt
¦   L-- README.md
+-- process-static
+-- generate-feed
+-- generate-sitemap
+-- generate-donate-qr-codes
+-- dev-deploy-static
L-- static-tmp/                # Built files
```

## Build Process

### Main scripts

- `./process-static`
  - Copies `static/` to `static-tmp/`
  - Processes Jinja2 templates into language subdirectories
  - Rewrites release/build data where needed
  - Processes CSS/JS
  - Adds asset hashes
  - Minifies HTML
  - Creates compressed assets

- `./generate-feed`
  - Generates per-language Atom feeds

- `./generate-sitemap`
  - Generates multilingual sitemap

- `./generate-donate-qr-codes`
  - Generates donation QR PNG assets

- `./dev-deploy-static`
  - Runs QR generation, static processing, and sitemap generation

## i18n

### Supported languages

- `en` - default
- `de`
- `fr`
- `es`
- `ru`

### Template translation functions

```jinja2
{{ _("text") }}
{{ ngettext("{0} download", "{0} downloads", count).format(count) }}
{{ format_date(date, format='medium') }}
{{ format_number(1234567.89) }}
{{ format_currency(1234.56, 'USD') }}
{{ format_percent(0.15) }}
{{ format_size(1024*1024) }}
```

### Translation workflow notes

- Template strings are extracted from Jinja templates and HTML pages.
- JavaScript UI strings for the web installer are exposed through `static/install/web.html` so they can be translated through gettext too.
- Translator comments use the `Translators:` prefix and are extracted by Babel.

### Translator tooling

- `locale/report_untranslated.py`
  - Reports untranslated entries by language and source file based on empty `msgstr`

- `locale/FOR-TRANSLATORS.MD`
  - Explains how translators should work with `.po` files and the reporting script

## Testing

### Python / unit tests

From the repo root:

```bash
pip install -r test/requirements.txt
python -m pytest test -q
```

### Playwright interaction tests

```bash
pip install -r test/requirements.txt
python -m playwright install chromium
python -m pytest test -q
```

Notes:

- The tests in `test/` serve the built site directly from `static-tmp` via a local Python HTTP server.
- Docker is not required for these tests.
- Build the site first if `static-tmp` is outdated or missing.

## Common Issues

### Missing `static-tmp`

If tests skip because localized output is missing, rebuild:

```bash
./process-static
```

### Playwright not installed

Install both Python package and browser runtime:

```bash
pip install -r test/requirements.txt
python -m playwright install chromium
```

### Translation progress tracking

Use:

```bash
python locale/report_untranslated.py
```

## Important Notes

- All main build scripts are bash-based.
- On Windows, do not assume native PowerShell can replace the Unix toolchain.
- Prefer Docker or WSL2 for actual builds.
- `static-tmp` is generated output, not source.
- Translation files may already contain user changes; do not blindly overwrite unrelated `.po` content.

## Contributing

1. Make changes.
2. Rebuild static output if needed.
3. Run relevant tests from `test/`.
4. Update translations when adding user-facing strings.
