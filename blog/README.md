# GrapheneOS Blog

This blog is made with [Zola](https://www.getzola.org/).

## Adding a new post

Adding a post is simple. I've chosen to have the created date in the filename so they're sorted in file managers. Filenames use `YYYY-MM-DD-post-slug.md`.

Zola uses `+++` before and after the frontmatter, which is TOML. This site is set up to require two fields there, for example:

```
+++
title = "Post title"
description = "Post description (used in meta tags for description and og:description)"
+++
```

- `updated` can be added if a post is updated.
- `authors` accepts an array of authors. Authors do not show up on the main site, but are included in `atom.xml`. The default author is set in `zola.toml`.
- `extra.category` / `extra.categories`, see next section.

## Categories

The main site doesn't feature categories to keep things simple. However, if categories are added, they show up in the `atom.xml` feed.

`extra.category` takes a string value. `extra.categories` takes an array.

## Attaching images

There are multiple suggested ways to add images to pages in Zola. To keep things more organized, I've chosen to use this structure:

```
.
├── content
│   ├── 2025-02-01-article-with-pictures.md
│   └── _index.md
├── static
│   └── article-with-pictures
│       ├── image1.jpeg
│       └── image2.jpeg
```

After building, this is the result:

```
.
├── article-with-pictures
│   ├── image1.jpeg
│   ├── image2.jpeg
│   └── index.html
```

So to add an image in the `.md` file, just add `![alt text](filename.ext)`.

Images have to be one of the following: `gif`, `jpg`, `jpeg`, `png`, or `webp`.

Also note that if an image is replaced, it's best to use a new filename because images are cached for a year.

## Building

The blog is set up to be part of the GrapheneOS site, so use `process-static` to build the blog along with the whole site. Building it with `zola build` can still be done, but resulting files are still incomplete.