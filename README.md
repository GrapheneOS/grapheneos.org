<div style="text-align: center">
    <picture>
        <source srcset="https://raw.githubusercontent.com/GrapheneOS/branding-extra/main/logo-transparent-background-light.png" media="(prefers-color-scheme: dark)" />
        <img src="https://raw.githubusercontent.com/GrapheneOS/branding-extra/main/logo-transparent-background.png" height="128" alt="" />
    </picture>
</div>

## Structure

* `nginx/` – configuration for the nginx web server
* `process-static` – to process the files for the website
* `setup` – to set up the processing environment
* `static/` – contains all files for the website
* `templates/` – contains template files that are merged into the files for the website

## Documentation style guide

Generally follow the [Google developer documentation style guide](https://developers.google.com/style).

Wrap the HTML textwidth at 100 characters.

If you're using vim:

```
:set tw=100
```

To select, unwrap and rewrap a paragraph: `vipJgq`.
Trim additional indents to align a paragraph in one vertical line.

## Development

Dependencies:

* Java
* Python 3
* brotli
* find
* nodejs
* parallel
* sed
* shell
* xmllint
* zopfli

Set up the processing environment:

```
./setup
```

To process the files for the website:

```
./process-static
```

The processed static files will be in `static-tmp/`.
