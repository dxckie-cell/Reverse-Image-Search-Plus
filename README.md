# Reverse Image Search Plus

A [Revenge](https://github.com/revenge-mod/revenge-bundle) plugin that adds a **Reverse Image Search** button to the long-press menu of any message with an image. One tap opens the picture in Google Lens (or Yandex / TinEye / Bing) - no more copying the image link and typing `/reverse-image-search`.

Based on [Reverse Image Search](https://github.com/everestmcarthur/revenge-plugins/tree/main/plugins/reverse-image-search) by Rosie.

## Install

In Discord: **Settings → Plugins → `+`**, then paste:

```
https://dxckie-cell.github.io/Reverse-Image-Search-Plus/
```

(Requires GitHub Pages to be set to **GitHub Actions** under repo Settings → Pages - see below.)

## Use

Long-press a message that has an image (attachment, image embed, or GIF) → tap **Reverse Image Search**.

- Several images on one message → one button per image (`1/3`, `2/3`, ...).
- **Settings → Default engine** picks Google Lens, Yandex, TinEye or Bing.
- **Settings → Show every engine** adds one button per engine instead.
- The original `/reverse-image-search <image-url> [engine]` command still works.

Discord attachment links are signed and expire after a while, so search right away rather than from an old copied link.

## Build / deploy

`npm install && npm run build` writes `dist/manifest.json` and `dist/index.js`. The workflow in `.github/workflows/deploy.yml` builds and publishes `dist/` to GitHub Pages on every push to `main`. One-time setup: repo **Settings → Pages → Source: GitHub Actions**.

This version does not include the remote blacklist check that the original repo's plugins ship with.
