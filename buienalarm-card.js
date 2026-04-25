/**
 * BuienAlarm Card — companion Lovelace card for the ha-buienalarm integration.
 *
 * Configuration:
 *   type: custom:buienalarm-card
 *   next_shower_sensor: sensor.buienalarm_next_shower   # required
 *   light: sensor.buienalarm_light_threshold            # entity OR number
 *   moderate: sensor.buienalarm_moderate_threshold      # entity OR number
 *   heavy: sensor.buienalarm_heavy_threshold            # entity OR number
 *   title: "Rain forecast"                              # optional
 *   show_headline: true                                 # optional, default true
 *   color_bars: true                                    # optional, default true
 *
 * The light/moderate/heavy fields accept either an entity_id (string starting
 * with a domain prefix) or a plain number. If a number is given the
 * threshold is fixed at that value; if an entity is given the value is read
 * from the entity's state on every update.
 *
 * No external dependencies — vanilla custom element.
 *
 * License: MIT
 */

const CARD_VERSION = "1.1.1";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Detect whether a configuration value looks like an entity_id rather than
 * a numeric threshold.
 */
function isEntityId(value) {
  return typeof value === "string" && /^[a-z_]+\.[A-Za-z0-9_]+$/.test(value);
}

/**
 * Resolve a "entity_id or number" config value to a finite Number, or NaN
 * if it cannot be resolved (entity missing, state unavailable, NaN string).
 */
function resolveThreshold(value, hass) {
  if (value === undefined || value === null) return NaN;
  if (typeof value === "number") return Number.isFinite(value) ? value : NaN;
  if (isEntityId(value)) {
    const stateObj = hass && hass.states && hass.states[value];
    if (!stateObj) return NaN;
    const state = stateObj.state;
    if (state === "unavailable" || state === "unknown") return NaN;
    const n = Number(state);
    return Number.isFinite(n) ? n : NaN;
  }
  // Bare numeric strings like "1.5" — accept them.
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

/**
 * Pick the colour band for a precipitation value.
 * Bands are defined in mm/h. Anything below `light` is "dry".
 */
function bandForValue(value, light, moderate, heavy) {
  if (!Number.isFinite(value) || value <= 0) return "dry";
  if (Number.isFinite(heavy) && value >= heavy) return "heavy";
  if (Number.isFinite(moderate) && value >= moderate) return "moderate";
  if (Number.isFinite(light) && value >= light) return "light";
  return "trace";
}

const BAND_COLORS = {
  dry: "rgba(120, 144, 156, 0.25)",
  trace: "#90caf9",   // very light blue
  light: "#42a5f5",   // light blue
  moderate: "#fb8c00", // orange
  heavy: "#e53935",    // red
};

/**
 * SVG escape for any text we inject directly into innerHTML.
 */
function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ---------------------------------------------------------------------------
// Card element
// ---------------------------------------------------------------------------

class BuienalarmCard extends HTMLElement {
  // Lifecycle ---------------------------------------------------------------

  constructor() {
    super();
    this._hass = null;
    this._config = null;
    // Detached DOM — built once, then updated on each hass change.
    this._root = null;
    this._headlineEl = null;
    this._chartEl = null;
    this._titleEl = null;
  }

  /**
   * Lovelace calls setConfig synchronously during card creation; throwing
   * here renders an error card with the message.
   */
  setConfig(config) {
    if (!config || typeof config !== "object") {
      throw new Error("Invalid configuration");
    }
    if (!config.next_shower_sensor || !isEntityId(config.next_shower_sensor)) {
      throw new Error(
        "next_shower_sensor must be an entity_id (e.g. sensor.buienalarm_next_shower)"
      );
    }
    // The threshold fields are optional; we still validate they are either
    // an entity_id-shaped string OR a number.
    for (const key of ["light", "moderate", "heavy"]) {
      const v = config[key];
      if (v === undefined || v === null) continue;
      if (typeof v === "number") continue;
      if (typeof v === "string" && (isEntityId(v) || Number.isFinite(Number(v)))) continue;
      throw new Error(
        `${key} must be an entity_id or a number (got: ${JSON.stringify(v)})`
      );
    }

    this._config = {
      title: config.title ?? "Rain forecast",
      show_headline: config.show_headline !== false,
      color_bars: config.color_bars !== false,
      next_shower_sensor: config.next_shower_sensor,
      light: config.light,
      moderate: config.moderate,
      heavy: config.heavy,
    };

    if (this._root) this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._root) this._build();
    this._render();
  }

  /**
   * Estimated card height in Lovelace grid units. 3 ≈ 168 px which is about
   * right for headline + 120 px chart.
   */
  getCardSize() {
    return 3;
  }

  /**
   * Default config used when the user adds the card via the picker.
   */
  static getStubConfig() {
    return {
      next_shower_sensor: "sensor.buienalarm_next_shower",
      light: "sensor.buienalarm_light_threshold",
      moderate: "sensor.buienalarm_moderate_threshold",
      heavy: "sensor.buienalarm_heavy_threshold",
    };
  }

  /**
   * Tells Lovelace which custom element to use as the GUI editor.
   */
  static getConfigElement() {
    return document.createElement("buienalarm-card-editor");
  }

  // DOM --------------------------------------------------------------------

  _build() {
    this.innerHTML = "";
    const card = document.createElement("ha-card");
    // ha-card is a real HA element when available; degrade gracefully if not
    // (e.g. when developing in the browser without HA).
    if (!customElements.get("ha-card")) {
      card.style.display = "block";
      card.style.background = "var(--ha-card-background, var(--card-background-color, #fff))";
      card.style.border = "1px solid var(--divider-color, #ccc)";
      card.style.borderRadius = "var(--ha-card-border-radius, 12px)";
      card.style.padding = "0";
    }

    const style = document.createElement("style");
    style.textContent = `
      .ba-wrap { padding: 12px 16px 16px; }
      .ba-title {
        font-size: var(--ha-card-header-font-size, 1.2em);
        font-weight: 500;
        margin: 0 0 6px;
        color: var(--primary-text-color);
      }
      .ba-headline {
        display: flex;
        align-items: baseline;
        gap: 8px;
        margin: 0 0 10px;
        color: var(--primary-text-color);
      }
      .ba-headline .ba-state {
        font-size: 1.4em;
        font-weight: 500;
      }
      .ba-headline .ba-sub {
        font-size: 0.9em;
        color: var(--secondary-text-color);
      }
      .ba-error {
        color: var(--error-color, #b00020);
        padding: 8px 0;
        font-size: 0.95em;
      }
      .ba-chart {
        width: 100%;
        height: 140px;
        display: block;
      }
      .ba-legend {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        font-size: 0.8em;
        color: var(--secondary-text-color);
        margin-top: 6px;
      }
      .ba-legend span.swatch {
        display: inline-block;
        width: 10px;
        height: 10px;
        border-radius: 2px;
        margin-right: 4px;
        vertical-align: middle;
      }
    `;

    const wrap = document.createElement("div");
    wrap.className = "ba-wrap";

    const titleEl = document.createElement("div");
    titleEl.className = "ba-title";

    const headlineEl = document.createElement("div");
    headlineEl.className = "ba-headline";

    const chartEl = document.createElement("div");
    chartEl.className = "ba-chart-container";

    wrap.appendChild(titleEl);
    wrap.appendChild(headlineEl);
    wrap.appendChild(chartEl);

    card.appendChild(style);
    card.appendChild(wrap);
    this.appendChild(card);

    this._root = card;
    this._titleEl = titleEl;
    this._headlineEl = headlineEl;
    this._chartEl = chartEl;
  }

  _render() {
    if (!this._root || !this._config || !this._hass) return;
    const cfg = this._config;
    const hass = this._hass;

    // Title
    this._titleEl.textContent = cfg.title || "";
    this._titleEl.style.display = cfg.title ? "" : "none";

    const stateObj = hass.states[cfg.next_shower_sensor];
    if (!stateObj) {
      this._headlineEl.innerHTML =
        `<div class="ba-error">Entity not found: ${esc(cfg.next_shower_sensor)}</div>`;
      this._chartEl.innerHTML = "";
      return;
    }

    // Resolve thresholds
    const light = resolveThreshold(cfg.light, hass);
    const moderate = resolveThreshold(cfg.moderate, hass);
    const heavy = resolveThreshold(cfg.heavy, hass);

    // Headline
    if (cfg.show_headline) {
      const state = stateObj.state;
      const sub = stateObj.attributes && stateObj.attributes.period_type
        ? this._subForPeriod(stateObj.attributes.period_type)
        : "";
      this._headlineEl.innerHTML = `
        <span class="ba-state">${esc(state || "unknown")}</span>
        ${sub ? `<span class="ba-sub">${esc(sub)}</span>` : ""}
      `;
      this._headlineEl.style.display = "";
    } else {
      this._headlineEl.style.display = "none";
    }

    // Chart
    const forecast = (stateObj.attributes && stateObj.attributes.rain_forecast) || [];
    if (!Array.isArray(forecast) || forecast.length === 0) {
      this._chartEl.innerHTML =
        `<div class="ba-error">No forecast data available yet.</div>`;
      return;
    }

    this._chartEl.innerHTML = this._renderChart(forecast, light, moderate, heavy);
  }

  _subForPeriod(period) {
    switch (period) {
      case "wet": return "shower expected";
      case "dry": return "current shower will end";
      case "nan": return "no transition in window";
      default: return "";
    }
  }

  /**
   * Render the SVG chart. Built as a string and assigned via innerHTML —
   * cheaper than the DOM API and trivially garbage-collected on re-render.
   */
  _renderChart(forecast, light, moderate, heavy) {
    const cfg = this._config;

    // Geometry
    const W = 600;       // viewBox width — scales via preserveAspectRatio
    const H = 140;
    const padL = 36, padR = 12, padT = 14, padB = 22;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    const values = forecast
      .map((p) => Number(p.precip))
      .filter((v) => Number.isFinite(v));

    // Y-scale: top of chart is the heavy threshold + 20 %, with a sensible
    // floor so it's still readable when there's no rain at all.
    let yMax = 1.0;
    if (Number.isFinite(heavy)) yMax = Math.max(yMax, heavy * 1.2);
    if (values.length) yMax = Math.max(yMax, ...values, 0.5);
    if (yMax <= 0 || !Number.isFinite(yMax)) yMax = 1.0;

    const xStep = forecast.length > 0 ? plotW / forecast.length : 0;
    const barGap = Math.min(2, xStep * 0.15);
    const barW = Math.max(1, xStep - barGap);

    const yToPx = (v) => padT + plotH - (v / yMax) * plotH;

    // Bars
    let bars = "";
    forecast.forEach((p, i) => {
      const v = Number(p.precip);
      const safe = Number.isFinite(v) ? Math.max(0, v) : 0;
      const x = padL + i * xStep;
      const y = yToPx(safe);
      const h = padT + plotH - y;
      const band = cfg.color_bars
        ? bandForValue(safe, light, moderate, heavy)
        : "light";
      const color = BAND_COLORS[band];
      bars += `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${barW.toFixed(2)}" height="${h.toFixed(2)}" fill="${color}"></rect>`;
    });

    // Threshold lines
    let thresholds = "";
    const drawLine = (value, color, label) => {
      if (!Number.isFinite(value) || value <= 0 || value > yMax) return;
      const y = yToPx(value);
      thresholds += `
        <line x1="${padL}" y1="${y.toFixed(2)}" x2="${padL + plotW}" y2="${y.toFixed(2)}"
              stroke="${color}" stroke-width="1" stroke-dasharray="3 3" opacity="0.65"/>
        <text x="${padL - 4}" y="${(y + 3).toFixed(2)}" text-anchor="end"
              font-size="9" fill="${color}" opacity="0.85">${esc(label)}</text>
      `;
    };
    drawLine(light, BAND_COLORS.light, "L");
    drawLine(moderate, BAND_COLORS.moderate, "M");
    drawLine(heavy, BAND_COLORS.heavy, "H");

    // X axis: a few labelled times
    const ticks = [];
    if (forecast.length > 0) {
      const tickIndices = [
        0,
        Math.floor(forecast.length / 4),
        Math.floor(forecast.length / 2),
        Math.floor((3 * forecast.length) / 4),
        forecast.length - 1,
      ];
      const seen = new Set();
      for (const i of tickIndices) {
        if (seen.has(i)) continue;
        seen.add(i);
        const ts = Number(forecast[i] && forecast[i].attime);
        if (!Number.isFinite(ts)) continue;
        const date = new Date(ts * 1000);
        const label = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
        const x = padL + (i + 0.5) * xStep;
        ticks.push(
          `<text x="${x.toFixed(2)}" y="${(H - 6).toFixed(2)}" text-anchor="middle"
            font-size="10" fill="var(--secondary-text-color, #777)">${esc(label)}</text>`
        );
      }
    }

    // Y axis: top label
    const yAxis = `
      <text x="${padL - 4}" y="${(padT - 2).toFixed(2)}" text-anchor="end"
            font-size="9" fill="var(--secondary-text-color, #777)">${yMax.toFixed(1)} mm/h</text>
      <text x="${padL - 4}" y="${(padT + plotH - 1).toFixed(2)}" text-anchor="end"
            font-size="9" fill="var(--secondary-text-color, #777)">0</text>
    `;

    // Baseline
    const baseline = `<line x1="${padL}" y1="${(padT + plotH).toFixed(2)}" x2="${padL + plotW}" y2="${(padT + plotH).toFixed(2)}" stroke="var(--divider-color, #ddd)" stroke-width="1"/>`;

    // Legend (only when colour-coding is on)
    let legend = "";
    if (cfg.color_bars) {
      const items = [
        ["trace", "trace"],
        ["light", "light"],
        ["moderate", "moderate"],
        ["heavy", "heavy"],
      ];
      legend =
        `<div class="ba-legend">` +
        items
          .map(
            ([key, label]) =>
              `<span><span class="swatch" style="background:${BAND_COLORS[key]}"></span>${esc(label)}</span>`
          )
          .join("") +
        `</div>`;
    }

    return `
      <svg class="ba-chart" viewBox="0 0 ${W} ${H}"
           xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Rain forecast"
           preserveAspectRatio="none">
        ${baseline}
        ${yAxis}
        ${bars}
        ${thresholds}
        ${ticks.join("")}
      </svg>
      ${legend}
    `;
  }
}

// ---------------------------------------------------------------------------
// GUI editor
// ---------------------------------------------------------------------------

/**
 * Custom element used by Lovelace as the visual editor.
 *
 * Layout (top to bottom):
 *   - Title (text)
 *   - Next shower sensor (entity picker, sensor domain)
 *   - Headline + Color bars (two checkboxes side by side)
 *   - Light / Moderate / Heavy thresholds (three entity pickers in one row)
 *
 * Implementation note: this editor renders a single <ha-form> element with
 * a schema. Letting HA build the form means the lazy-loaded sub-elements
 * (ha-entity-picker, ha-selector, ha-textfield) get pulled in automatically
 * — building those controls by hand via document.createElement ends up with
 * unrendered HTMLUnknownElements until something else on the page triggers
 * the loader.
 *
 * The threshold fields take entity_ids only in the GUI. To configure a fixed
 * numeric threshold, switch to the YAML editor and set e.g. `light: 0.1`.
 * The card runtime accepts both shapes; the GUI just covers the common case.
 */
class BuienalarmCardEditor extends HTMLElement {
  constructor() {
    super();
    this._hass = null;
    this._config = null;
    this._form = null;
    this._help = null;
  }

  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  // -- Schema ------------------------------------------------------------

  /**
   * Build the schema for ha-form. The threshold-row "grid" layout puts
   * three entity selectors side by side; the headline/color-bars grid
   * puts two booleans side by side.
   *
   * Selectors used:
   *   - "text"  — for the title
   *   - "entity" with domain filter — for sensor pickers
   *   - "boolean" — for the two checkboxes
   */
  _schema() {
    const entitySelector = {
      entity: { domain: "sensor" },
    };
    return [
      {
        name: "title",
        selector: { text: {} },
      },
      {
        name: "next_shower_sensor",
        required: true,
        selector: entitySelector,
      },
      {
        type: "grid",
        name: "",
        schema: [
          { name: "show_headline", selector: { boolean: {} } },
          { name: "color_bars", selector: { boolean: {} } },
        ],
      },
      {
        type: "grid",
        name: "",
        schema: [
          { name: "light", selector: entitySelector },
          { name: "moderate", selector: entitySelector },
          { name: "heavy", selector: entitySelector },
        ],
      },
    ];
  }

  /**
   * Provide nicer labels for fields. ha-form calls this per-field.
   */
  _computeLabel(field) {
    switch (field.name) {
      case "title": return "Title";
      case "next_shower_sensor": return "Next shower sensor";
      case "show_headline": return "Show headline";
      case "color_bars": return "Color bars";
      case "light": return "Light threshold";
      case "moderate": return "Moderate threshold";
      case "heavy": return "Heavy threshold";
      default: return field.name;
    }
  }

  /**
   * Build the data object passed into ha-form. Threshold values that are
   * not entity IDs (e.g. fixed numbers from YAML) are surfaced as empty in
   * the GUI so the user can pick an entity without losing the YAML value
   * — _onValueChanged only writes back fields the user actually touched.
   */
  _formData() {
    const cfg = this._config || {};
    return {
      title: cfg.title ?? "",
      next_shower_sensor: isEntityId(cfg.next_shower_sensor)
        ? cfg.next_shower_sensor
        : "",
      show_headline: cfg.show_headline !== false,
      color_bars: cfg.color_bars !== false,
      light: isEntityId(cfg.light) ? cfg.light : "",
      moderate: isEntityId(cfg.moderate) ? cfg.moderate : "",
      heavy: isEntityId(cfg.heavy) ? cfg.heavy : "",
    };
  }

  // -- DOM ---------------------------------------------------------------

  _render() {
    if (!this._config || !this._hass) return;

    if (!this._form) {
      this.innerHTML = "";

      const style = document.createElement("style");
      style.textContent = `
        .ba-ed-wrap {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 8px 0;
        }
        .ba-ed-help {
          font-size: 0.85em;
          color: var(--secondary-text-color, #777);
          padding: 0 4px;
        }
      `;

      const wrap = document.createElement("div");
      wrap.className = "ba-ed-wrap";

      const form = document.createElement("ha-form");
      form.computeLabel = (f) => this._computeLabel(f);
      form.addEventListener("value-changed", (ev) => this._onValueChanged(ev));

      const help = document.createElement("div");
      help.className = "ba-ed-help";
      help.textContent =
        "Tip: to use a fixed numeric threshold instead of a sensor, switch to the YAML editor and enter a number (e.g. light: 0.1).";

      wrap.appendChild(form);
      wrap.appendChild(help);

      this.appendChild(style);
      this.appendChild(wrap);

      this._form = form;
      this._help = help;
    }

    this._form.hass = this._hass;
    this._form.schema = this._schema();
    this._form.data = this._formData();
  }

  // -- Events ------------------------------------------------------------

  _onValueChanged(ev) {
    ev.stopPropagation();
    if (!ev.detail || !ev.detail.value) return;
    const incoming = ev.detail.value;
    const newConfig = { ...(this._config || {}) };

    // Map each field back to the config. Empty strings are deletions so
    // the user can clear a picker.
    const setOrDel = (key, value, isString) => {
      if (value === undefined || value === null) {
        delete newConfig[key];
        return;
      }
      if (isString && value === "") {
        delete newConfig[key];
        return;
      }
      newConfig[key] = value;
    };

    setOrDel("title", incoming.title, true);
    setOrDel("next_shower_sensor", incoming.next_shower_sensor, true);
    // Booleans default to true — only persist the explicit `false` so we
    // don't fill the YAML with redundant defaults.
    if (incoming.show_headline === false) {
      newConfig.show_headline = false;
    } else {
      delete newConfig.show_headline;
    }
    if (incoming.color_bars === false) {
      newConfig.color_bars = false;
    } else {
      delete newConfig.color_bars;
    }

    // Threshold pickers: only overwrite when the user picked an entity.
    // An empty string clears the field — but because numeric YAML values
    // are surfaced as empty in the form, we can't reliably distinguish
    // "user cleared an entity" from "user didn't touch a YAML number".
    // Compromise: if the user clears a picker that had a non-entity value
    // before, we leave that value in place. This matches "preserve YAML
    // numbers" intuition.
    for (const key of ["light", "moderate", "heavy"]) {
      const newValue = incoming[key];
      const oldValue = this._config ? this._config[key] : undefined;
      if (newValue && isEntityId(newValue)) {
        newConfig[key] = newValue;
      } else if (newValue === "" || newValue === undefined || newValue === null) {
        if (isEntityId(oldValue)) {
          // Clearing an entity selection: drop the key.
          delete newConfig[key];
        }
        // else: leave the existing (possibly numeric) value intact.
      }
    }

    this._config = newConfig;
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: newConfig },
        bubbles: true,
        composed: true,
      })
    );
  }
}

if (!customElements.get("buienalarm-card-editor")) {
  customElements.define("buienalarm-card-editor", BuienalarmCardEditor);
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

if (!customElements.get("buienalarm-card")) {
  customElements.define("buienalarm-card", BuienalarmCard);
}

window.customCards = window.customCards || [];
if (!window.customCards.find((c) => c.type === "buienalarm-card")) {
  window.customCards.push({
    type: "buienalarm-card",
    name: "BuienAlarm Card",
    preview: false,
    description:
      "Rain forecast card for the ha-buienalarm integration. Shows the next-shower status and a coloured precipitation chart with light/moderate/heavy threshold lines.",
    documentationURL: "https://github.com/lancer73/ha-buienalarm",
  });
}

console.info(
  `%c BUIENALARM-CARD %c v${CARD_VERSION} `,
  "color: white; background: #2e7dd1; font-weight: 700;",
  "color: #2e7dd1; background: white; font-weight: 700;"
);
