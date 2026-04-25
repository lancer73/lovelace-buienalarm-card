# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.1] - 2026-04-25

First public release as a standalone HACS-distributable card. Previously
distributed informally as a `www/buienalarm-card.js` snippet alongside the
[`ha-buienalarm`](https://github.com/lancer73/ha-buienalarm) integration;
now lives in its own repository for proper HACS support and versioning.

### Added

- **HACS frontend plugin packaging**: `hacs.json` at the repository root
  declaring the card as a Lovelace plugin so HACS can install it directly.
- **`README.md`** documenting installation (HACS and manual), the visual
  editor, every YAML option, the entity-or-number flexibility, privacy
  notes, and troubleshooting.
- **`CHANGES.md`** (this file).
- **`LICENSE`** (MIT).
- **Repository screenshot** under `images/screenshot.png` for use in the
  README and HACS store listing.

### Changed

- The card source is unchanged from the v1.1.1 build that shipped under
  the integration's `lovelace/` folder. No behavioural changes; only the
  packaging is new.

## Card behaviour history

The history below tracks the card source itself (the `buienalarm-card.js`
file), regardless of how it was distributed.

### Card 1.1.1 — visual editor reliability

- Rebuilt the visual editor on top of `<ha-form>` instead of building
  individual controls (`ha-entity-picker`, `ha-checkbox`, …) by hand.
  HA's lazy loader does not register those custom elements until something
  on the page references them, which left manually-created pickers
  unrendered. Using `ha-form` with a schema lets HA load the right
  sub-elements automatically.

### Card 1.1.0 — visual editor

- Added a visual editor exposing the most-used options:
  - Title (text)
  - Next shower sensor (entity picker, sensor domain, required)
  - Show headline + Color bars (two checkboxes side by side)
  - Light / Moderate / Heavy thresholds (three entity pickers in one row)
- Numeric thresholds are still configurable via YAML (e.g. `light: 0.1`)
  and are preserved across visual-editor sessions as long as the user
  doesn't pick an entity in that slot.

### Card 1.0.0 — initial card

- Headline showing the next-shower sensor's state plus a sub-line derived
  from the `period_type` attribute.
- Bar chart driven by the `rain_forecast` attribute, with x-axis time
  labels every quarter of the forecast window.
- Three dashed threshold lines (`L` / `M` / `H`) with a colour-band legend.
- Bars colour-coded by intensity band (trace / light / moderate / heavy).
- Y-axis auto-scales to `max(heavy × 1.2, observed peak, 0.5 mm/h)`.
- Each of `light`, `moderate`, `heavy` accepts either an entity ID or a
  fixed numeric value.
- Standard `customCards` registration so the card appears in the Lovelace
  card picker with name and description.
- HA theme variables used throughout for native look and dark/light mode
  support.
- Vanilla JavaScript — no external dependencies, no CDN imports.

[1.1.1]: https://github.com/lancer73/lovelace-buienalarm-card/releases/tag/v1.1.1
