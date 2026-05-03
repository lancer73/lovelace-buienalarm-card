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

const CARD_VERSION = "1.2.0";

// ---------------------------------------------------------------------------
// Translations
// ---------------------------------------------------------------------------
//
// The card translates its own UI strings (title default, period sub-text,
// editor labels, legend, error/empty states) into the same set of languages
// the ha-buienalarm integration supports. The headline state value itself
// is translated by the integration server-side (it follows the per-entry
// `language` config option), so we don't translate that here.
//
// Language is picked from hass.locale.language with a fallback to
// hass.language. Lookup is case-insensitive and falls back to the base
// language (e.g. "de-CH" -> "de") and then to English. This mirrors
// resolve_language() in the integration.
//
// To add a language: copy the "en" block below, translate every value,
// and add the code to the lookup. Keep keys identical across languages.

const TRANSLATIONS = {
  // Notes on the legend labels:
  //
  // - The card's "trace" band represents precipitation that's detected
  //   but below the user's `light` threshold. In meteorological terms
  //   that's drizzle: very fine drops, < ~0.5 mm/h. So "trace" is
  //   translated using each language's native word for drizzle, not a
  //   literal calque of the English word "trace" (which would mean
  //   "track/footprint" in most of these languages and look out of
  //   place in a weather UI).
  // - The other three bands (light/moderate/heavy) are adjectives
  //   describing rain intensity, so they take adjective forms in
  //   languages that distinguish (e.g. Spanish "ligera/moderada/fuerte"
  //   agreeing with feminine "lluvia"; German "leicht/mäßig/stark"
  //   uncapitalised because they're adjectives, not nouns).
  en: {
    default_title: "Rain forecast",
    period_wet: "shower expected",
    period_dry: "current shower will end",
    period_nan: "no transition in window",
    entity_not_found: "Entity not found: {entity}",
    no_data: "No forecast data available yet.",
    state_unknown: "unknown",
    legend_trace: "trace",
    legend_light: "light",
    legend_moderate: "moderate",
    legend_heavy: "heavy",
    aria_chart: "Rain forecast",
    unit_mmh: "mm/h",
    ed_title: "Title",
    ed_next_shower_sensor: "Next shower sensor",
    ed_show_headline: "Show headline",
    ed_color_bars: "Color bars",
    ed_light: "Light threshold",
    ed_moderate: "Moderate threshold",
    ed_heavy: "Heavy threshold",
    ed_help: "Tip: to use a fixed numeric threshold instead of a sensor, switch to the YAML editor and enter a number (e.g. light: 0.1).",
    card_description: "Rain forecast card for the ha-buienalarm integration. Shows the next-shower status and a coloured precipitation chart with light/moderate/heavy threshold lines.",
    card_name: "BuienAlarm Card",
  },
  nl: {
    default_title: "Regenvoorspelling",
    period_wet: "bui verwacht",
    period_dry: "huidige bui stopt",
    period_nan: "geen overgang binnen venster",
    entity_not_found: "Entiteit niet gevonden: {entity}",
    no_data: "Nog geen voorspelling beschikbaar.",
    state_unknown: "onbekend",
    legend_trace: "motregen",
    legend_light: "licht",
    legend_moderate: "matig",
    legend_heavy: "zwaar",
    aria_chart: "Regenvoorspelling",
    unit_mmh: "mm/u",
    ed_title: "Titel",
    ed_next_shower_sensor: "Sensor volgende bui",
    ed_show_headline: "Kop tonen",
    ed_color_bars: "Gekleurde balken",
    ed_light: "Drempel licht",
    ed_moderate: "Drempel matig",
    ed_heavy: "Drempel zwaar",
    ed_help: "Tip: om een vaste numerieke drempel te gebruiken in plaats van een sensor, schakel over naar de YAML-editor en voer een getal in (bijv. light: 0.1).",
    card_description: "Regenvoorspellingskaart voor de ha-buienalarm integratie. Toont de status van de volgende bui en een gekleurde neerslaggrafiek met drempellijnen voor licht/matig/zwaar.",
    card_name: "BuienAlarm Kaart",
  },
  // --- machine-quality translations below; native-speaker PRs welcome ---
  fr: {
    default_title: "Prévision de pluie",
    period_wet: "averse attendue",
    period_dry: "fin de l'averse en cours",
    period_nan: "aucune transition dans la fenêtre",
    entity_not_found: "Entité introuvable : {entity}",
    no_data: "Aucune donnée de prévision disponible.",
    state_unknown: "inconnu",
    legend_trace: "bruine",
    legend_light: "léger",
    legend_moderate: "modéré",
    legend_heavy: "fort",
    aria_chart: "Prévision de pluie",
    unit_mmh: "mm/h",
    ed_title: "Titre",
    ed_next_shower_sensor: "Capteur de prochaine averse",
    ed_show_headline: "Afficher le titre",
    ed_color_bars: "Barres colorées",
    ed_light: "Seuil léger",
    ed_moderate: "Seuil modéré",
    ed_heavy: "Seuil fort",
    ed_help: "Astuce : pour utiliser un seuil numérique fixe au lieu d'un capteur, passez à l'éditeur YAML et saisissez un nombre (par ex. light: 0.1).",
    card_description: "Carte de prévision de pluie pour l'intégration ha-buienalarm. Affiche l'état de la prochaine averse et un graphique coloré des précipitations avec des lignes de seuil léger/modéré/fort.",
    card_name: "Carte BuienAlarm",
  },
  es: {
    default_title: "Previsión de lluvia",
    period_wet: "se espera lluvia",
    period_dry: "fin de la lluvia actual",
    period_nan: "sin transición en la ventana",
    entity_not_found: "Entidad no encontrada: {entity}",
    no_data: "Aún no hay datos de previsión.",
    state_unknown: "desconocido",
    legend_trace: "llovizna",
    legend_light: "ligera",
    legend_moderate: "moderada",
    legend_heavy: "fuerte",
    aria_chart: "Previsión de lluvia",
    unit_mmh: "mm/h",
    ed_title: "Título",
    ed_next_shower_sensor: "Sensor de próxima lluvia",
    ed_show_headline: "Mostrar encabezado",
    ed_color_bars: "Barras de color",
    ed_light: "Umbral ligero",
    ed_moderate: "Umbral moderado",
    ed_heavy: "Umbral fuerte",
    ed_help: "Consejo: para usar un umbral numérico fijo en lugar de un sensor, cambia al editor YAML e introduce un número (p. ej. light: 0.1).",
    card_description: "Tarjeta de previsión de lluvia para la integración ha-buienalarm. Muestra el estado de la próxima lluvia y un gráfico de precipitación coloreado con líneas de umbral ligero/moderado/fuerte.",
    card_name: "Tarjeta BuienAlarm",
  },
  pt: {
    default_title: "Previsão de chuva",
    period_wet: "aguaceiro previsto",
    period_dry: "fim do aguaceiro atual",
    period_nan: "sem transição na janela",
    entity_not_found: "Entidade não encontrada: {entity}",
    no_data: "Ainda não há dados de previsão.",
    state_unknown: "desconhecido",
    legend_trace: "chuvisco",
    legend_light: "fraca",
    legend_moderate: "moderada",
    legend_heavy: "forte",
    aria_chart: "Previsão de chuva",
    unit_mmh: "mm/h",
    ed_title: "Título",
    ed_next_shower_sensor: "Sensor de próximo aguaceiro",
    ed_show_headline: "Mostrar cabeçalho",
    ed_color_bars: "Barras coloridas",
    ed_light: "Limiar fraco",
    ed_moderate: "Limiar moderado",
    ed_heavy: "Limiar forte",
    ed_help: "Dica: para usar um limiar numérico fixo em vez de um sensor, mude para o editor YAML e insira um número (p. ex. light: 0.1).",
    card_description: "Cartão de previsão de chuva para a integração ha-buienalarm. Mostra o estado do próximo aguaceiro e um gráfico de precipitação colorido com linhas de limiar fraco/moderado/forte.",
    card_name: "Cartão BuienAlarm",
  },
  "pt-br": {
    default_title: "Previsão de chuva",
    period_wet: "chuva prevista",
    period_dry: "fim da chuva atual",
    period_nan: "sem transição na janela",
    entity_not_found: "Entidade não encontrada: {entity}",
    no_data: "Ainda não há dados de previsão.",
    state_unknown: "desconhecido",
    legend_trace: "garoa",
    legend_light: "fraca",
    legend_moderate: "moderada",
    legend_heavy: "forte",
    aria_chart: "Previsão de chuva",
    unit_mmh: "mm/h",
    ed_title: "Título",
    ed_next_shower_sensor: "Sensor da próxima chuva",
    ed_show_headline: "Mostrar cabeçalho",
    ed_color_bars: "Barras coloridas",
    ed_light: "Limite fraco",
    ed_moderate: "Limite moderado",
    ed_heavy: "Limite forte",
    ed_help: "Dica: para usar um limite numérico fixo em vez de um sensor, mude para o editor YAML e digite um número (ex. light: 0.1).",
    card_description: "Cartão de previsão de chuva para a integração ha-buienalarm. Mostra o estado da próxima chuva e um gráfico de precipitação colorido com linhas de limite fraco/moderado/forte.",
    card_name: "Cartão BuienAlarm",
  },
  fy: {
    default_title: "Reinfoarsizzing",
    period_wet: "bui ferwachte",
    period_dry: "hjoeddeistige bui einiget",
    period_nan: "gjin oergong binnen finster",
    entity_not_found: "Entiteit net fûn: {entity}",
    no_data: "Noch gjin foarsizzing beskikber.",
    state_unknown: "ûnbekend",
    legend_trace: "motrein",
    legend_light: "licht",
    legend_moderate: "matich",
    legend_heavy: "swier",
    aria_chart: "Reinfoarsizzing",
    unit_mmh: "mm/o",
    ed_title: "Titel",
    ed_next_shower_sensor: "Sensor folgjende bui",
    ed_show_headline: "Kop sjen litte",
    ed_color_bars: "Kleurde balken",
    ed_light: "Drompel licht",
    ed_moderate: "Drompel matich",
    ed_heavy: "Drompel swier",
    ed_help: "Tip: om in fêste numerike drompel te brûken yn stee fan in sensor, skeakelje nei de YAML-editor en fier in getal yn (bgl. light: 0.1).",
    card_description: "Reinfoarsizzingskaart foar de ha-buienalarm yntegraasje. Lit de status fan de folgjende bui sjen en in kleurde delslachgrafyk mei drompels foar licht/matich/swier.",
    card_name: "BuienAlarm Kaart",
  },
  tr: {
    default_title: "Yağmur tahmini",
    period_wet: "yağmur bekleniyor",
    period_dry: "mevcut yağmur sona erecek",
    period_nan: "pencerede geçiş yok",
    entity_not_found: "Varlık bulunamadı: {entity}",
    no_data: "Henüz tahmin verisi yok.",
    state_unknown: "bilinmiyor",
    legend_trace: "çisenti",
    legend_light: "hafif",
    legend_moderate: "orta",
    legend_heavy: "şiddetli",
    aria_chart: "Yağmur tahmini",
    unit_mmh: "mm/sa",
    ed_title: "Başlık",
    ed_next_shower_sensor: "Sonraki yağmur sensörü",
    ed_show_headline: "Başlığı göster",
    ed_color_bars: "Renkli çubuklar",
    ed_light: "Hafif eşik",
    ed_moderate: "Orta eşik",
    ed_heavy: "Şiddetli eşik",
    ed_help: "İpucu: sensör yerine sabit sayısal eşik kullanmak için YAML düzenleyiciye geçin ve bir sayı girin (ör. light: 0.1).",
    card_description: "ha-buienalarm entegrasyonu için yağmur tahmin kartı. Sonraki yağmur durumunu ve hafif/orta/şiddetli eşik çizgileriyle renkli bir yağış grafiğini gösterir.",
    card_name: "BuienAlarm Kartı",
  },
  ar: {
    default_title: "توقعات المطر",
    period_wet: "زخّة متوقعة",
    period_dry: "ستنتهي الزخّة الحالية",
    period_nan: "لا يوجد تحول ضمن الفترة",
    entity_not_found: "الكيان غير موجود: {entity}",
    no_data: "لا تتوفر بيانات توقعات بعد.",
    state_unknown: "غير معروف",
    legend_trace: "رذاذ",
    legend_light: "خفيف",
    legend_moderate: "متوسط",
    legend_heavy: "غزير",
    aria_chart: "توقعات المطر",
    unit_mmh: "مم/س",
    ed_title: "العنوان",
    ed_next_shower_sensor: "مستشعر الزخّة التالية",
    ed_show_headline: "عرض العنوان",
    ed_color_bars: "أشرطة ملوّنة",
    ed_light: "عتبة خفيفة",
    ed_moderate: "عتبة متوسطة",
    ed_heavy: "عتبة غزيرة",
    ed_help: "نصيحة: لاستخدام عتبة رقمية ثابتة بدلاً من مستشعر، انتقل إلى محرر YAML وأدخل رقمًا (مثل light: 0.1).",
    card_description: "بطاقة توقعات المطر لتكامل ha-buienalarm. تعرض حالة الزخّة التالية ومخطط هطول ملوّن مع خطوط عتبات خفيف/متوسط/غزير.",
    card_name: "بطاقة BuienAlarm",
  },
  de: {
    default_title: "Regenvorhersage",
    period_wet: "Schauer erwartet",
    period_dry: "aktueller Schauer endet",
    period_nan: "kein Übergang im Zeitfenster",
    entity_not_found: "Entität nicht gefunden: {entity}",
    no_data: "Noch keine Vorhersagedaten verfügbar.",
    state_unknown: "unbekannt",
    legend_trace: "Nieselregen",
    legend_light: "leicht",
    legend_moderate: "mäßig",
    legend_heavy: "stark",
    aria_chart: "Regenvorhersage",
    unit_mmh: "mm/h",
    ed_title: "Titel",
    ed_next_shower_sensor: "Sensor nächster Schauer",
    ed_show_headline: "Überschrift anzeigen",
    ed_color_bars: "Farbige Balken",
    ed_light: "Schwelle leicht",
    ed_moderate: "Schwelle mäßig",
    ed_heavy: "Schwelle stark",
    ed_help: "Tipp: Um einen festen numerischen Schwellenwert anstelle eines Sensors zu verwenden, wechsle zum YAML-Editor und gib eine Zahl ein (z. B. light: 0.1).",
    card_description: "Regenvorhersage-Karte für die ha-buienalarm-Integration. Zeigt den Status des nächsten Schauers und ein farbiges Niederschlagsdiagramm mit Schwellenlinien für leicht/mäßig/stark.",
    card_name: "BuienAlarm-Karte",
  },
  "de-ch": {
    // Swiss German: 'ss' instead of 'ß'.
    default_title: "Regenvorhersage",
    period_wet: "Schauer erwartet",
    period_dry: "aktueller Schauer endet",
    period_nan: "kein Übergang im Zeitfenster",
    entity_not_found: "Entität nicht gefunden: {entity}",
    no_data: "Noch keine Vorhersagedaten verfügbar.",
    state_unknown: "unbekannt",
    legend_trace: "Nieselregen",
    legend_light: "leicht",
    legend_moderate: "mässig",
    legend_heavy: "stark",
    aria_chart: "Regenvorhersage",
    unit_mmh: "mm/h",
    ed_title: "Titel",
    ed_next_shower_sensor: "Sensor nächster Schauer",
    ed_show_headline: "Überschrift anzeigen",
    ed_color_bars: "Farbige Balken",
    ed_light: "Schwelle leicht",
    ed_moderate: "Schwelle mässig",
    ed_heavy: "Schwelle stark",
    ed_help: "Tipp: Um einen festen numerischen Schwellenwert anstelle eines Sensors zu verwenden, wechsle zum YAML-Editor und gib eine Zahl ein (z. B. light: 0.1).",
    card_description: "Regenvorhersage-Karte für die ha-buienalarm-Integration. Zeigt den Status des nächsten Schauers und ein farbiges Niederschlagsdiagramm mit Schwellenlinien für leicht/mässig/stark.",
    card_name: "BuienAlarm-Karte",
  },
};

/**
 * Resolve a language code to its translation bundle.
 * Mirrors resolve_language() in the integration: case-insensitive, with
 * fallback to the base language (e.g. "de-CH" -> "de") and finally to "en".
 */
function resolveTranslations(language) {
  if (!language || typeof language !== "string") return TRANSLATIONS.en;
  const code = language.toLowerCase();
  if (TRANSLATIONS[code]) return TRANSLATIONS[code];
  const base = code.split("-", 1)[0];
  if (TRANSLATIONS[base]) return TRANSLATIONS[base];
  return TRANSLATIONS.en;
}

/**
 * Pick the active language from a hass object. Prefer the explicit
 * locale.language (the user's selected HA UI language); fall back to the
 * deprecated hass.language; default to "en".
 */
function pickLanguage(hass) {
  if (!hass) return "en";
  return (hass.locale && hass.locale.language) || hass.language || "en";
}

/**
 * Look up a translation key with optional placeholder substitution.
 * Falls back to the English bundle if the key is missing in the active
 * language, then to the key itself if even English doesn't have it. This
 * makes adding a new key safe for partially-translated bundles.
 */
function t(strings, key, params) {
  let template;
  if (strings && Object.prototype.hasOwnProperty.call(strings, key)) {
    template = strings[key];
  } else if (Object.prototype.hasOwnProperty.call(TRANSLATIONS.en, key)) {
    template = TRANSLATIONS.en[key];
  } else {
    template = key;
  }
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (m, name) =>
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : m
  );
}

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
      // Note: title default is intentionally left undefined here so it
      // can resolve to the translated string at render time, following
      // the user's HA UI language. An explicit empty string still hides
      // the title; an explicit non-empty string still wins.
      title: config.title,
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
    const strings = resolveTranslations(pickLanguage(hass));

    // Title — explicit user value wins (including empty string to hide);
    // unset falls back to the translated default.
    const title = cfg.title === undefined ? t(strings, "default_title") : cfg.title;
    this._titleEl.textContent = title || "";
    this._titleEl.style.display = title ? "" : "none";

    const stateObj = hass.states[cfg.next_shower_sensor];
    if (!stateObj) {
      this._headlineEl.innerHTML =
        `<div class="ba-error">${esc(t(strings, "entity_not_found", { entity: cfg.next_shower_sensor }))}</div>`;
      this._chartEl.innerHTML = "";
      return;
    }

    // Resolve thresholds
    const light = resolveThreshold(cfg.light, hass);
    const moderate = resolveThreshold(cfg.moderate, hass);
    const heavy = resolveThreshold(cfg.heavy, hass);

    // Headline
    if (cfg.show_headline) {
      // The state value itself is translated server-side by the
      // integration (it follows the per-entry `language` setting), so
      // we display it as-is. Only the period sub-text is translated
      // client-side here.
      const state = stateObj.state;
      const sub = stateObj.attributes && stateObj.attributes.period_type
        ? this._subForPeriod(stateObj.attributes.period_type, strings)
        : "";
      this._headlineEl.innerHTML = `
        <span class="ba-state">${esc(state || t(strings, "state_unknown"))}</span>
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
        `<div class="ba-error">${esc(t(strings, "no_data"))}</div>`;
      return;
    }

    this._chartEl.innerHTML = this._renderChart(forecast, light, moderate, heavy, strings);
  }

  _subForPeriod(period, strings) {
    switch (period) {
      case "wet": return t(strings, "period_wet");
      case "dry": return t(strings, "period_dry");
      case "nan": return t(strings, "period_nan");
      default: return "";
    }
  }

  /**
   * Render the SVG chart. Built as a string and assigned via innerHTML —
   * cheaper than the DOM API and trivially garbage-collected on re-render.
   */
  _renderChart(forecast, light, moderate, heavy, strings) {
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
            font-size="9" fill="var(--secondary-text-color, #777)">${esc(yMax.toFixed(1) + " " + t(strings, "unit_mmh"))}</text>
      <text x="${padL - 4}" y="${(padT + plotH - 1).toFixed(2)}" text-anchor="end"
            font-size="9" fill="var(--secondary-text-color, #777)">0</text>
    `;

    // Baseline
    const baseline = `<line x1="${padL}" y1="${(padT + plotH).toFixed(2)}" x2="${padL + plotW}" y2="${(padT + plotH).toFixed(2)}" stroke="var(--divider-color, #ddd)" stroke-width="1"/>`;

    // Legend (only when colour-coding is on)
    let legend = "";
    if (cfg.color_bars) {
      const items = [
        ["trace", t(strings, "legend_trace")],
        ["light", t(strings, "legend_light")],
        ["moderate", t(strings, "legend_moderate")],
        ["heavy", t(strings, "legend_heavy")],
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
           xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(t(strings, "aria_chart"))}"
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
   * Labels follow the active HA UI language.
   */
  _computeLabel(field) {
    const strings = resolveTranslations(pickLanguage(this._hass));
    switch (field.name) {
      case "title": return t(strings, "ed_title");
      case "next_shower_sensor": return t(strings, "ed_next_shower_sensor");
      case "show_headline": return t(strings, "ed_show_headline");
      case "color_bars": return t(strings, "ed_color_bars");
      case "light": return t(strings, "ed_light");
      case "moderate": return t(strings, "ed_moderate");
      case "heavy": return t(strings, "ed_heavy");
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
      // Help text is filled in below on every render so it follows the
      // active HA UI language (and updates if the user changes locale
      // while the editor is open).

      wrap.appendChild(form);
      wrap.appendChild(help);

      this.appendChild(style);
      this.appendChild(wrap);

      this._form = form;
      this._help = help;
    }

    const strings = resolveTranslations(pickLanguage(this._hass));
    this._help.textContent = t(strings, "ed_help");

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
  // The card picker runs before any hass is available, so we use the
  // browser locale here as a best-effort. HA itself doesn't pass the
  // user's locale into customCards entries; once a card is added, the
  // editor and the rendered card both follow hass.locale.language.
  const pickerStrings = resolveTranslations(
    (typeof navigator !== "undefined" && navigator.language) || "en"
  );
  window.customCards.push({
    type: "buienalarm-card",
    name: t(pickerStrings, "card_name"),
    preview: false,
    description: t(pickerStrings, "card_description"),
    documentationURL: "https://github.com/lancer73/ha-buienalarm",
  });
}

console.info(
  `%c BUIENALARM-CARD %c v${CARD_VERSION} `,
  "color: white; background: #2e7dd1; font-weight: 700;",
  "color: #2e7dd1; background: white; font-weight: 700;"
);
