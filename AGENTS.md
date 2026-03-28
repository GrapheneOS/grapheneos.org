Вот обновленный `AGENTS.md` с учетом всех изменений:

```markdown
# AGENTS.md - Instructions for AI Assistant

## Project Overview

This is the GrapheneOS website repository. It generates a multilingual static site with i18n support, Atom feeds, and sitemaps.

## Running the Project on Windows

The project uses bash scripts and GNU utilities. For Windows, use **Docker**:

### Docker (recommended)

1. Ensure Docker Desktop is running

2. Build and run:
```powershell
docker build -t grapheneos-website .
docker run -d -p 80:80 --name grapheneos grapheneos-website
```

The site will be available at http://localhost

### Adding to hosts (for testing)

Add to `C:\Windows\System32\drivers\etc\hosts`:
```
127.0.0.1 grapheneostest.org
```

### WSL2 (alternative)

```bash
wsl --install
# In WSL Ubuntu:
sudo apt update && sudo apt install -y python3-venv python3-pip nodejs npm openjdk-17-jre parallel moreutils rsync brotli zopfli libxml2-utils gixy qrencode graphicsmagick
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
npm ci
./process-static
```

## Project Structure

```
grapheneos.org/
├── .github/workflows/     # GitHub Actions CI
│   └── static.yml        # CI pipeline (pytest + Playwright + lint)
├── templates/            # Jinja2 templates
│   ├── header.html       # Header with language switcher
│   ├── footer.html       # Footer
│   └── i18n.html         # i18n macros
├── static/               # Source static files
│   ├── *.html           # HTML templates with Jinja2
│   └── donate-*.png     # Donation QR codes (generated)
├── i18n/                 # Translations (JSON for content)
│   ├── en/              # English translations
│   ├── ru/              # Russian translations
│   ├── de/              # German translations
│   ├── fr/              # French translations
│   └── es/              # Spanish translations
├── locale/              # gettext translations (.po/.mo files)
├── nginx/               # nginx configuration
│   └── nginx-dev.conf   # Dev config with language routing
├── scripts/
│   ├── process-static   # Main build script
│   ├── process-templates # Jinja2 template processor
│   ├── generate-feed    # Generates Atom feeds for each language
│   ├── generate-sitemap # Generates multilingual sitemap with hreflang
│   ├── generate-donate-qr-codes # Generates donation QR codes
│   └── dev-deploy-static # Local development deploy (build + sitemap)
└── static-tmp/          # Built files (created automatically)
    ├── en/              # English version
    ├── ru/              # Russian version
    ├── de/              # German version
    ├── fr/              # French version
    └── es/              # Spanish version
```

## Build Process

### Local Development Build

```bash
# Full build with QR codes and sitemap
./dev-deploy-static

# Or step by step:
./generate-donate-qr-codes  # Generate donation QR codes
./process-static            # Build static files
./generate-sitemap          # Generate sitemap (requires static-production symlink)
```

### What Each Script Does

#### `generate-donate-qr-codes`
- Generates PNG QR codes for cryptocurrency donation addresses
- Requires: `qrencode`, `graphicsmagick` or `imagemagick`
- Output: `static/donate-*.png`

#### `process-static`
1. Copies `static/` to `static-tmp/`
2. Runs `process-templates` to create language subdirectories
3. Replaces build numbers in `releases.html`
4. Processes CSS/JS (lint, minify)
5. Adds content hashes to asset filenames
6. Minifies HTML
7. Creates compressed versions (.br, .gz)

#### `process-templates`
- Processes Jinja2 templates with i18n support
- Creates `static-tmp/{en,ru,de,fr,es}/` directories
- Copies all non-HTML assets to each language directory
- Provides i18n functions: `_()`, `format_date()`, `format_number()`, `format_currency()`, etc.

#### `generate-feed`
- Generates Atom feeds for each language from `releases.html`
- Output: `static-tmp/{lang}/releases.atom`

#### `generate-sitemap`
- Generates multilingual sitemap with hreflang attributes
- Requires `static-production` symlink (created by `dev-deploy-static`)
- Output: `static-tmp/sitemap.xml`

#### `dev-deploy-static`
- Local development deploy script
- Runs: QR generation → build → sitemap generation
- Creates temporary symlink `static-production` → `static-tmp` for sitemap

## i18n (Internationalization)

### Supported Languages
- English (en) - default
- Deutsch (de)
- Français (fr)
- Español (es)
- Русский (ru)

### i18n Functions Available in Templates

```jinja2
<!-- Translation -->
{{ _("text") }}

<!-- Date formatting -->
{{ format_date(date, format='medium') }}
{{ format_time(time, format='medium') }}
{{ format_datetime(dt, format='full') }}
{{ format_relative_date(date) }}

<!-- Number formatting -->
{{ format_number(1234567.89) }}
{{ format_currency(1234.56, 'USD') }}
{{ format_percent(0.15) }}
{{ format_size(1024*1024) }}

<!-- Pluralization -->
{{ ngettext("{0} download", "{0} downloads", count).format(count) }}

<!-- Language info -->
{{ get_language_name('ru') }}
{{ get_language_flag('ru') }}
{{ is_rtl(lang) }}
{{ get_dir(lang) }}
```

### Available Filters

```jinja2
{{ date|date('short') }}
{{ number|number(2) }}
{{ amount|currency('USD') }}
{{ size|size }}
```

### Nginx Language Routing
- Checks `lang` cookie (priority)
- Checks `Accept-Language` header
- Redirects to `/de/`, `/fr/`, `/es/`, `/ru/` as needed
- Sets cookie to remember language choice

## GitHub Actions CI

`.github/workflows/static.yml` includes:
```yaml
jobs:
  static:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
      - uses: actions/setup-python@v6
      - run: sudo apt-get install libxml2-utils yajl-tools moreutils zopfli
      - run: npm ci
      - run: pip install -r requirements.txt
      - name: process static
        run: ./process-static
```

## Docker Build

The Dockerfile builds the site with all features:

```dockerfile
FROM ubuntu:22.04 AS builder
# Install dependencies including qrencode and graphicsmagick
# Run ./dev-deploy-static (build + QR codes + sitemap)
FROM nginx:alpine
COPY --from=builder /app/static-tmp /usr/share/nginx/html
```

### Docker Build Command
```bash
docker build -t grapheneos-website .
docker run -d -p 80:80 --name grapheneos grapheneos-website
```

## Quality Checks

The build process automatically runs:
- `eslint` for JavaScript
- `stylelint` for CSS
- `xmllint` for XML validation
- `html-minifier-terser` for minification
- `gixy` for nginx config validation

## Testing

### Python tests (pytest)
```bash
pip install pytest cssselect
python -m pytest tests/ -v
```

### Functional tests (Playwright)
```bash
npm install -D @playwright/test
npx playwright install chromium
docker run -d -p 80:80 --name grapheneos grapheneos-website
npx playwright test tests/functional.spec.cjs --reporter=list
```

## Common Issues and Solutions

### 1. QR codes not displaying in Docker
**Problem**: QR code images are corrupted or missing in Docker container.
**Solution**: Ensure `qrencode` and `graphicsmagick` are installed in Dockerfile and `generate-donate-qr-codes` runs during build.

### 2. Sitemap not generated
**Problem**: `generate-sitemap` fails because `static-production` doesn't exist.
**Solution**: Use `./dev-deploy-static` which creates a symlink `static-production` → `static-tmp`.

### 3. Static assets not loading in language subdirectories
**Problem**: CSS/JS files return 404 in language-specific pages.
**Solution**: Nginx config should have fallback rules:
```nginx
location ~* ^/(.+\.(css|js|svg|png))$ {
    try_files $uri /en/$uri /ru/$uri =404;
}
```

### 4. SSH key exchange error when deploying
**Problem**: `deploy-static` fails with "no matching key exchange method found".
**Solution**: Use `dev-deploy-static` for local development, or update SSH config:
```
Host yto.grapheneos.org
    KexAlgorithms curve25519-sha256,curve25519-sha256@libssh.org
```

## Important Notes

- All bash scripts use `#!/bin/bash` (requires bash, not sh)
- For Windows without WSL/Docker, scripts need porting to Python
- The project uses GNU parallel, sponge (moreutils), brotli, zopfli
- QR codes are generated at build time, not committed to repository
- Sitemap is generated during `dev-deploy-static`, not in `process-static` alone

## Adding New Pages

1. Create HTML file in `static/` with Jinja2 syntax
2. Add translations in `i18n/{lang}/` JSON files
3. Add page to `pages` list in `generate-sitemap.py`
4. Run `./dev-deploy-static` to rebuild

## Current Translation Status

| Page | en | de | fr | es | ru |
|------|----|----|----|----|-----|
| index | ✅ | ✅ | ✅ | ✅ | ✅ |
| features | ✅ | ⚠️ | ⚠️ | ⚠️ | ⚠️ |
| build | ✅ | ⚠️ | ⚠️ | ⚠️ | ⚠️ |
| usage | ✅ | ⚠️ | ⚠️ | ⚠️ | ⚠️ |
| faq | ✅ | ⚠️ | ⚠️ | ⚠️ | ⚠️ |
| releases | ✅ | ⚠️ | ⚠️ | ⚠️ | ⚠️ |
| donate | ✅ | ⚠️ | ⚠️ | ⚠️ | ⚠️ |

✅ Fully translated  
⚠️ Partially translated (content only, structure complete)

## Contributing

1. Fork the repository
2. Make changes
3. Run `./dev-deploy-static` to test locally
4. Submit a pull request

For questions, join the community chat: https://discord.com/invite/grapheneos
```