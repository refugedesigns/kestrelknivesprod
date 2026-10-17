# Kestrel Knives theme

Custom [Shopify Online Store 2.0](https://shopify.dev/docs/storefronts/themes) theme for [Kestrel Knives](https://kestrelknives.com) — ultralight knives, apparel, and accessories.

This repo is the live storefront theme. It started from a Tailwind-based OS 2.0 starter and has been rebuilt for the Kestrel catalog, merchandising, and signup flows.

## Stack

- Liquid sections, templates, and snippets
- [Tailwind CSS v4](https://tailwindcss.com/) compiled to `assets/application.css`
- Alpine.js (`assets/alpine.min.js`) for collection filters and interactive UI
- Shopify customer forms for newsletter signup (footer + subscribe overlay)
- Storefront discount handling in the cart drawer (Klaviyo unique codes and collection-origin / Eastmans codes)

## Local development

Install [Shopify CLI](https://shopify.dev/docs/api/shopify-cli) and Node.js, then from this directory:

```sh
npm install
npm run build:css
```

CSS watch compiles `src/tailwind.css` → `assets/application.css`. For a one-off production build:

```sh
npm run build:css:prod
```

Preview against the store:

```sh
shopify theme dev
```

Push a theme (only when you intend to update Shopify):

```sh
shopify theme push
```

## Git remotes

`origin` fetches from the development GitHub account and **pushes to both** remotes:

| Role | Repository |
| --- | --- |
| Fetch + push | `https://github.com/refugedesigns/kestrelknivesprod.git` |
| Push | `https://github.com/kestrelknives26/kestrelknives_shopify.git` |

```sh
git push origin main
```

The second account must be signed in on this machine (`git credential-manager github login --username kestrelknives26 --device`) or `refugedesigns` needs write access on the kestrelknives26 repo.

## Theme notes

- **Collections** — Filters are grouped Ultralight Knives → Apparel → Accessories. Group tags (ending in ` Group`) drive subfilters. Collection grids load remaining pages in place so category products stay on one page.
- **Apparel cards** — Color swatches are sampled from the variant image. The selected variant image stays on the card; hover shows the first media image.
- **Subscribe overlay** — Static `{% section "subscribe-overlay" %}` in `layout/theme.liquid` (after the footer). Heading and dismiss timing are section settings in the theme editor, not hardcoded. Overlay copy currently defaults to “Win Free Knives & Gear!”.
- **Cart drawer** — Opens below the header. Applies the storefront `discount_code` cookie (including Klaviyo Welcome Family unique codes) via `/cart/update.js` so the discount shows in the drawer, not only at checkout. Eastmans gated cleanup only removes the Eastmans origin code.
- **Klaviyo onsite embed** is disabled in `config/settings_data.json` so it does not stack on the Shopify overlay.

## Project layout

```
assets/      Compiled CSS, theme JS, and static images
config/      Theme settings schema and data
layout/      theme.liquid (and customer / auth layouts)
locales/     Translations
sections/    Section files (header, footer, templates, overlay)
snippets/    Cards, filters, cart drawer, icons
src/         Tailwind source (`tailwind.css`)
templates/   JSON templates and alternate templates
```

`package.json`, `node_modules`, and `css/` are listed in `.shopifyignore` and are not uploaded with the theme.
