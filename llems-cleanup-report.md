# LLEMS Development Kit — Dependency & Cleanup Report

> **No files were deleted.** This report only lists what *can* be safely removed
> based on a static dependency analysis. Review before acting.

Analysis method:

- Parsed every entry template (`templates/*.json` / `*.liquid`) and the two
  section groups (`sections/header-group.json`, `sections/footer-group.json`)
  for referenced **section types**.
- Traced `{% section %}` / `{% sections %}` render tags.
- Traced dynamic loads via the **Section Rendering API** (`?section_id=...`)
  inside `assets/*.js`.
- Traced `{% render %}` / `{% include %}` for **snippets**.
- Traced `| asset_url` and raw filename references for **assets**.

---

## 1. Current active homepage

`templates/index.json` now loads a single section:

- `llems-home` (renders `snippets/llems-product-card`)

`llems-home` encapsulates the primary navigation, secondary navigation,
4-column product grid, and minimal footer. The global Dawn footer group is
no longer required for the homepage but remains available to other routes.
The legacy `llems-home-product-listing` section is preserved as a thinner,
standalone grid option for other pages or themes.

---

## 2. LLEMS files (the reusable kit — keep)

| File | Purpose |
|------|---------|
| `sections/llems-home.liquid` | Complete homepage section: nav, hero, grid, footer |
| `sections/llems-home-product-listing.liquid` | Thin section: resolves settings, renders the grid |
| `snippets/llems-product-card.liquid` | Reusable, dependency-free product card with add-to-cart |
| `assets/llems-home.css` | Component styles (CSS-variable driven) |
| `assets/llems-home.js` | Progressive enhancement: reveal animations + AJAX add-to-cart |

These five files are the portable kit — copy them together into any theme.

---

## 3. Sections NOT referenced by any template (safe to remove)

These are Dawn **Theme-Editor preset** sections. They are not used by any
current template, section group, `{% section %}` tag, or the Section Rendering
API. Removing them only removes them as options a merchant could add in the
editor.

- `sections/apps.liquid`
- `sections/collage.liquid`
- `sections/collapsible-content.liquid`
- `sections/custom-liquid.liquid`
- `sections/featured-blog.liquid`
- `sections/featured-collection.liquid`
- `sections/featured-product.liquid`
- `sections/image-banner.liquid`
- `sections/image-with-text.liquid`
- `sections/multicolumn.liquid`
- `sections/multirow.liquid`
- `sections/newsletter.liquid`
- `sections/page.liquid`
- `sections/rich-text.liquid`
- `sections/slideshow.liquid`
- `sections/video.liquid`

> Note: `sections/page.liquid` is an editor preset and is distinct from the
> route section `sections/main-page.liquid` (used by `templates/page.json`),
> which must be kept.

---

## 4. Sections that LOOK unused but MUST be kept

These have zero static template references but are loaded **dynamically** and
must **not** be removed:

| Section | Why it is required |
|---------|--------------------|
| `sections/cart-drawer.liquid` | Rendered in `layout/theme.liquid` + Section Rendering API (`assets/cart-drawer.js`) |
| `sections/cart-icon-bubble.liquid` | Section Rendering API (`cart-drawer.js`, `cart-notification.js`) |
| `sections/cart-notification-button.liquid` | Section Rendering API (`cart-notification.js`) |
| `sections/cart-notification-product.liquid` | Section Rendering API (`cart-notification.js`) |
| `sections/cart-live-region-text.liquid` | Section Rendering API (`assets/cart.js`) |
| `sections/pickup-availability.liquid` | Section Rendering API (`assets/pickup-availability.js`) |
| `sections/predictive-search.liquid` | Section Rendering API (`assets/predictive-search.js`) |
| `sections/main-password-header.liquid` | `{% section %}` in `layout/password.liquid` |
| `sections/main-password-footer.liquid` | `{% section %}` in `layout/password.liquid` |

All `sections/main-*.liquid` route sections are bound to their templates and
are required unless the corresponding template is also removed.

---

## 5. Snippets

**No orphaned snippets found.** Every snippet is rendered by at least one file.

Snippets that are ONLY reachable through the preset sections listed in §3
would become removable *if and only if* those sections are removed first.
Because most snippets (e.g. `card-product`, `card-collection`, `price`,
`article-card`, icon snippets) are shared with active route sections
(`main-collection-product-grid`, `main-product`, `main-blog`, etc.), do not
remove any snippet without re-running the analysis after removing sections.

---

## 6. Assets

**No orphaned assets found.** Every file in `assets/` is referenced.

If the §3 preset sections are removed, re-check these component stylesheets,
which are predominantly loaded by those sections (verify they are not also used
by an active route section before deleting):

- `assets/section-image-banner.css`
- `assets/collage.css`
- `assets/section-multicolumn.css`
- `assets/component-slideshow.css`
- `assets/component-slider.css` (also used by active sliders — verify)

---

## 7. Templates

Every template maps to a live storefront route (product, collection, cart,
search, customers, etc.), so none are technically "orphaned".

For a minimal **dev kit** you *may* remove templates for routes you will not
demo. If you do, also remove their exclusive `main-*` route section. Keep at
minimum:

- `templates/index.json`
- `layout/theme.liquid` + `sections/header-group.json` + `sections/footer-group.json`

---

## 8. Locales

`locales/*.json` (storefront strings) and `locales/*.schema.json` (Theme Editor
labels) are consumed dynamically by Shopify per shopper locale and by the
editor. **Unused individual keys cannot be determined reliably by static
analysis**, and removing whole locale files degrades multi-language support.

**Recommendation: keep all locale files.** If you only need English, you may
optionally keep `en.default.json` + `en.default.schema.json` and remove the
other language files — but only if the store will never serve those locales.

---

## 9. Remaining Dawn dependencies of the LLEMS kit

The LLEMS section/snippet themselves depend on Dawn only for:

- **Color scheme classes** — `color-{scheme}` + `gradient` classes on the
  wrapper (from Dawn's `base.css`). Optional; the component still renders
  without them. Driven by the `color_scheme` schema setting.
- **Translation keys** —
  `products.product.sold_out`, `products.product.on_sale`,
  `products.product.price.from_price_html`, `products.product.add_to_cart`,
  `products.product.choose_options`, `sections.collection_template.empty`.
  These exist in standard Dawn locales; provide equivalents when porting to a
  non-Dawn theme.
- **Plain-text labels** — "Primary navigation", "Secondary navigation" and
  "Cart" are used as hard-coded labels for the editorial navigation. Replace
  with translation keys if the host theme requires full localization.
- **`money` filter & standard product objects** — native Shopify, portable
  everywhere.

No dependency on Dawn's `card-product.liquid`, `price.liquid`, `global.js`,
`component-card.css`, or slider components.
