/**
 * lib/canvas-types.ts
 *
 * Shared data-model for the contract template canvas editor.
 *
 * This file is the single source of truth for every type used by:
 *   - The canvas renderer (Step 4)
 *   - The layers panel   (Step 5)
 *   - The properties panel (Step 6)
 *   - The toolbar        (Step 7)
 *   - The backend JSON column (Step 2)
 *
 * Design goal: every element on the canvas is a plain serialisable object.
 * The entire template layout is a JSON array of CanvasElement objects plus
 * a PageConfig. This JSON is stored in the DB and later used by a render
 * step to produce the printed contract.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Element types
// ─────────────────────────────────────────────────────────────────────────────

/** The four kinds of elements you can place on the canvas. */
export type ElementType = "text" | "shape" | "image" | "input-field"

// ─────────────────────────────────────────────────────────────────────────────
// Style model
//
// Background opacity and text opacity are kept SEPARATE so you can have a
// semi-transparent box behind fully-opaque text (like Figma's fill + content
// opacity split).
// ─────────────────────────────────────────────────────────────────────────────

export interface ElementStyle {
  // ── Fill ──────────────────────────────────────────────────────────────────
  backgroundColor: string        // hex, e.g. "#ffffff"
  backgroundOpacity: number      // 0–100
  backgroundImage: string | null // URL / data-URI for image elements

  // ── Text ──────────────────────────────────────────────────────────────────
  color: string                  // hex text colour
  textOpacity: number            // 0–100, separate from bg opacity
  fontSize: number               // px
  fontWeight: "normal" | "bold" | "semibold"
  fontStyle: "normal" | "italic"
  textAlign: "left" | "center" | "right"
  lineHeight: number             // multiplier e.g. 1.5
  letterSpacing: number          // px

  // ── Border ────────────────────────────────────────────────────────────────
  borderWidth: number            // px (0 = no border)
  borderColor: string            // hex
  borderStyle: "solid" | "dashed" | "dotted"
  borderRadius: number           // px

  // ── Shadow ────────────────────────────────────────────────────────────────
  shadowX: number
  shadowY: number
  shadowBlur: number
  shadowColor: string
  shadowOpacity: number          // 0–100

  // ── Padding (for text/input elements) ────────────────────────────────────
  paddingTop: number
  paddingRight: number
  paddingBottom: number
  paddingLeft: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Canvas element
// ─────────────────────────────────────────────────────────────────────────────

export interface CanvasElement {
  id: string             // unique, e.g. "el_abc123"
  type: ElementType
  label: string          // user-facing name shown in Layers panel

  // ── Position + size (px, relative to page top-left) ──────────────────────
  x: number
  y: number
  width: number
  height: number
  rotation: number       // degrees

  // ── Z-order ───────────────────────────────────────────────────────────────
  zIndex: number

  // ── Content ───────────────────────────────────────────────────────────────
  /**
   * For type="text"        → the text string (may contain {{variable}} tokens)
   * For type="image"       → image src URL / data-URI
   * For type="input-field" → the field name / placeholder text
   * For type="shape"       → unused (empty string)
   */
  content: string

  /**
   * Data binding key.  When the template is later used to render a real
   * contract, this key is looked up in the contract data object and the
   * element's content is replaced with the real value.
   *
   * Examples: "customer.companyName", "contract.invoiceNumber",
   *           "contract.grossTotal"
   * null = static element (not data-bound)
   */
  dataKey: string | null

  style: ElementStyle

  // ── State flags ───────────────────────────────────────────────────────────
  locked: boolean        // when true, element can't be moved/resized on canvas
  visible: boolean       // when false, element is hidden (faded in editor, absent in print)
}

// ─────────────────────────────────────────────────────────────────────────────
// Page / canvas config
// ─────────────────────────────────────────────────────────────────────────────

export type PageSizePreset = "A4" | "A5" | "Letter" | "Legal" | "Custom"
export type Orientation    = "portrait" | "landscape"

/** Pixel dimensions at 96 DPI for each preset (portrait). */
export const PAGE_SIZE_PRESETS: Record<Exclude<PageSizePreset, "Custom">, { w: number; h: number }> = {
  A4:     { w: 794,  h: 1123 },
  A5:     { w: 559,  h: 794  },
  Letter: { w: 816,  h: 1056 },
  Legal:  { w: 816,  h: 1344 },
}

/** Real-world mm dimensions for each preset (used for accurate PDF output). */
export const PAGE_SIZE_MM: Record<Exclude<PageSizePreset, "Custom">, { w: number; h: number }> = {
  A4:     { w: 210, h: 297 },
  A5:     { w: 148, h: 210 },
  Letter: { w: 215.9, h: 279.4 },
  Legal:  { w: 215.9, h: 355.6 },
}

export interface PageConfig {
  preset:      PageSizePreset
  orientation: Orientation
  widthPx:     number           // actual canvas width in px (accounts for orientation)
  heightPx:    number           // actual canvas height in px
  widthMm:     number           // real-world width in mm
  heightMm:    number           // real-world height in mm
  background:  string           // page background hex (default "#ffffff")
  backgroundImage: string | null
  backgroundImageOpacity: number // 0–100
}

/** Build a PageConfig from preset + orientation. */
export function makePageConfig(
  preset: PageSizePreset,
  orientation: Orientation,
  customW = 794,
  customH = 1123,
): PageConfig {
  let px: { w: number; h: number }
  let mm: { w: number; h: number }

  if (preset === "Custom") {
    px = { w: customW, h: customH }
    mm = { w: Math.round((customW / 96) * 25.4), h: Math.round((customH / 96) * 25.4) }
  } else {
    px = { ...PAGE_SIZE_PRESETS[preset] }
    mm = { ...PAGE_SIZE_MM[preset] }
  }

  if (orientation === "landscape") {
    px = { w: px.h, h: px.w }
    mm = { w: mm.h, h: mm.w }
  }

  return {
    preset,
    orientation,
    widthPx: px.w,
    heightPx: px.h,
    widthMm: mm.w,
    heightMm: mm.h,
    background: "#ffffff",
    backgroundImage: null,
    backgroundImageOpacity: 100,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Template layout (the full JSON blob stored in the DB)
// ─────────────────────────────────────────────────────────────────────────────

export interface TemplateLayout {
  version:  "1"
  page:     PageConfig
  elements: CanvasElement[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Default style values (used when inserting a new element)
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_STYLE: ElementStyle = {
  backgroundColor:  "#ffffff",
  backgroundOpacity: 100,
  backgroundImage:   null,

  color:            "#111827",
  textOpacity:      100,
  fontSize:         14,
  fontWeight:       "normal",
  fontStyle:        "normal",
  textAlign:        "left",
  lineHeight:       1.5,
  letterSpacing:    0,

  borderWidth:      0,
  borderColor:      "#e5e7eb",
  borderStyle:      "solid",
  borderRadius:     0,

  shadowX:          0,
  shadowY:          0,
  shadowBlur:       0,
  shadowColor:      "#000000",
  shadowOpacity:    0,

  paddingTop:       8,
  paddingRight:     8,
  paddingBottom:    8,
  paddingLeft:      8,
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory helpers — create a new element with sensible defaults
// ─────────────────────────────────────────────────────────────────────────────

let _counter = 1
function uid() {
  return `el_${Date.now()}_${_counter++}`
}

export function createElement(
  type: ElementType,
  overrides: Partial<Omit<CanvasElement, "type">> = {},
): CanvasElement {
  const base: CanvasElement = {
    id:       uid(),
    type,
    label:    type === "text"        ? "Text"
              : type === "shape"     ? "Rectangle"
              : type === "image"     ? "Image"
              : "Input Field",
    x:        100,
    y:        100,
    width:    type === "text"        ? 200
              : type === "shape"     ? 160
              : type === "image"     ? 200
              : 240,
    height:   type === "text"        ? 40
              : type === "shape"     ? 80
              : type === "image"     ? 120
              : 36,
    rotation: 0,
    zIndex:   0,
    content:  type === "text"        ? "Double-click to edit"
              : type === "input-field" ? "Field label"
              : "",
    dataKey:  null,
    style: {
      ...DEFAULT_STYLE,
      // type-specific overrides
      ...(type === "shape"       ? { backgroundColor: "#2563eb", backgroundOpacity: 100, borderRadius: 4 } : {}),
      ...(type === "image"       ? { backgroundColor: "#f3f4f6", backgroundOpacity: 100, borderRadius: 6, borderWidth: 1 } : {}),
      ...(type === "input-field" ? { backgroundColor: "#f9fafb", backgroundOpacity: 100, borderWidth: 1, borderRadius: 4, fontSize: 13 } : {}),
      ...(type === "text"        ? { backgroundColor: "transparent", backgroundOpacity: 0 } : {}),
    },
    locked:  false,
    visible: true,
  }

  return { ...base, ...overrides }
}

// ─────────────────────────────────────────────────────────────────────────────
// Blank template layout (used when creating a fresh template)
// ─────────────────────────────────────────────────────────────────────────────

export function makeBlankLayout(): TemplateLayout {
  const page = makePageConfig("A4", "portrait")

  // Pre-populate with the standard contract sections so users aren't
  // starting from a totally blank canvas.
  const elements: CanvasElement[] = [
    // ── Header band (full-width coloured rectangle) ──────────────────
    createElement("shape", {
      id: uid(), label: "Header band",
      x: 0, y: 0, width: page.widthPx, height: 110,
      zIndex: 0,
      style: { ...DEFAULT_STYLE, backgroundColor: "#1e293b", backgroundOpacity: 100, borderRadius: 0, borderWidth: 0 },
    }),
    // ── Company name ─────────────────────────────────────────────────
    createElement("text", {
      id: uid(), label: "Company name",
      x: 32, y: 24, width: 260, height: 36,
      zIndex: 1,
      content: "{{company.name}}",
      dataKey: "company.name",
      style: { ...DEFAULT_STYLE, backgroundColor: "transparent", backgroundOpacity: 0, color: "#f8fafc", fontSize: 22, fontWeight: "bold", paddingTop: 0, paddingLeft: 0 },
    }),
    // ── Tagline ───────────────────────────────────────────────────────
    createElement("text", {
      id: uid(), label: "Tagline",
      x: 32, y: 62, width: 260, height: 24,
      zIndex: 1,
      content: "{{company.tagline}}",
      dataKey: "company.tagline",
      style: { ...DEFAULT_STYLE, backgroundColor: "transparent", backgroundOpacity: 0, color: "#94a3b8", fontSize: 12, paddingTop: 0, paddingLeft: 0 },
    }),
    // ── Invoice # label ───────────────────────────────────────────────
    createElement("text", {
      id: uid(), label: "Invoice # label",
      x: 544, y: 24, width: 220, height: 20,
      zIndex: 1,
      content: "Invoice #",
      style: { ...DEFAULT_STYLE, backgroundColor: "transparent", backgroundOpacity: 0, color: "#94a3b8", fontSize: 11, textAlign: "right", paddingTop: 0, paddingRight: 0 },
    }),
    createElement("text", {
      id: uid(), label: "Invoice # value",
      x: 544, y: 44, width: 220, height: 24,
      zIndex: 1,
      content: "{{contract.invoiceNumber}}",
      dataKey: "contract.invoiceNumber",
      style: { ...DEFAULT_STYLE, backgroundColor: "transparent", backgroundOpacity: 0, color: "#f8fafc", fontSize: 14, fontWeight: "bold", textAlign: "right", paddingTop: 0, paddingRight: 0 },
    }),
    // ── Customer info block ───────────────────────────────────────────
    createElement("shape", {
      id: uid(), label: "Customer block bg",
      x: 32, y: 134, width: 320, height: 80,
      zIndex: 0,
      style: { ...DEFAULT_STYLE, backgroundColor: "#f8fafc", backgroundOpacity: 100, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 6 },
    }),
    createElement("text", {
      id: uid(), label: "Customer name",
      x: 44, y: 148, width: 296, height: 20,
      zIndex: 1,
      content: "{{customer.companyName}}",
      dataKey: "customer.companyName",
      style: { ...DEFAULT_STYLE, backgroundColor: "transparent", backgroundOpacity: 0, color: "#111827", fontSize: 13, fontWeight: "bold", paddingTop: 0, paddingLeft: 0 },
    }),
    createElement("text", {
      id: uid(), label: "Customer address",
      x: 44, y: 172, width: 296, height: 30,
      zIndex: 1,
      content: "{{customer.address}}",
      dataKey: "customer.address",
      style: { ...DEFAULT_STYLE, backgroundColor: "transparent", backgroundOpacity: 0, color: "#6b7280", fontSize: 11, paddingTop: 0, paddingLeft: 0 },
    }),
    // ── Line items table header ───────────────────────────────────────
    createElement("shape", {
      id: uid(), label: "Table header bg",
      x: 32, y: 250, width: 730, height: 32,
      zIndex: 0,
      style: { ...DEFAULT_STYLE, backgroundColor: "#2563eb", backgroundOpacity: 100, borderRadius: 4, borderWidth: 0 },
    }),
    createElement("text", {
      id: uid(), label: "Table col: Description",
      x: 40, y: 257, width: 460, height: 18,
      zIndex: 1,
      content: "DESCRIPTION",
      style: { ...DEFAULT_STYLE, backgroundColor: "transparent", backgroundOpacity: 0, color: "#ffffff", fontSize: 10, fontWeight: "bold", letterSpacing: 1, paddingTop: 0, paddingLeft: 0 },
    }),
    createElement("text", {
      id: uid(), label: "Table col: Amount",
      x: 654, y: 257, width: 100, height: 18,
      zIndex: 1,
      content: "AMOUNT",
      style: { ...DEFAULT_STYLE, backgroundColor: "transparent", backgroundOpacity: 0, color: "#ffffff", fontSize: 10, fontWeight: "bold", letterSpacing: 1, textAlign: "right", paddingTop: 0, paddingRight: 0 },
    }),
    // ── Terms box ─────────────────────────────────────────────────────
    createElement("shape", {
      id: uid(), label: "Terms box",
      x: 32, y: 600, width: 730, height: 120,
      zIndex: 0,
      style: { ...DEFAULT_STYLE, backgroundColor: "#ffffff", backgroundOpacity: 100, borderWidth: 2, borderColor: "#e5e7eb", borderRadius: 6 },
    }),
    createElement("text", {
      id: uid(), label: "Terms text",
      x: 44, y: 612, width: 706, height: 96,
      zIndex: 1,
      content: "{{contract.termsAndConditions}}",
      dataKey: "contract.termsAndConditions",
      style: { ...DEFAULT_STYLE, backgroundColor: "transparent", backgroundOpacity: 0, color: "#374151", fontSize: 11, lineHeight: 1.6, paddingTop: 0, paddingLeft: 0 },
    }),
    // ── Gross total ───────────────────────────────────────────────────
    createElement("text", {
      id: uid(), label: "Gross total label",
      x: 520, y: 544, width: 120, height: 24,
      zIndex: 1,
      content: "GROSS TOTAL",
      style: { ...DEFAULT_STYLE, backgroundColor: "transparent", backgroundOpacity: 0, color: "#6b7280", fontSize: 10, fontWeight: "bold", letterSpacing: 1, paddingTop: 0, paddingLeft: 0 },
    }),
    createElement("text", {
      id: uid(), label: "Gross total value",
      x: 614, y: 538, width: 148, height: 30,
      zIndex: 1,
      content: "{{contract.grossTotal}}",
      dataKey: "contract.grossTotal",
      style: { ...DEFAULT_STYLE, backgroundColor: "transparent", backgroundOpacity: 0, color: "#111827", fontSize: 18, fontWeight: "bold", textAlign: "right", paddingTop: 0, paddingRight: 0 },
    }),
    // ── Signature line ────────────────────────────────────────────────
    createElement("shape", {
      id: uid(), label: "Signature line",
      x: 32, y: 756, width: 220, height: 1,
      zIndex: 0,
      style: { ...DEFAULT_STYLE, backgroundColor: "#9ca3af", backgroundOpacity: 100, borderWidth: 0, borderRadius: 0 },
    }),
    createElement("text", {
      id: uid(), label: "Signature caption",
      x: 32, y: 762, width: 220, height: 18,
      zIndex: 1,
      content: "Customer Signature",
      style: { ...DEFAULT_STYLE, backgroundColor: "transparent", backgroundOpacity: 0, color: "#9ca3af", fontSize: 10, paddingTop: 0, paddingLeft: 0 },
    }),
    // ── Footer ────────────────────────────────────────────────────────
    createElement("text", {
      id: uid(), label: "Footer text",
      x: 32, y: page.heightPx - 36, width: page.widthPx - 64, height: 20,
      zIndex: 1,
      content: "{{company.footerText}}",
      dataKey: "company.footerText",
      style: { ...DEFAULT_STYLE, backgroundColor: "transparent", backgroundOpacity: 0, color: "#9ca3af", fontSize: 10, textAlign: "center", paddingTop: 0, paddingLeft: 0, paddingRight: 0 },
    }),
  ]

  return { version: "1", page, elements }
}

// ─────────────────────────────────────────────────────────────────────────────
// Resize handle positions
// ─────────────────────────────────────────────────────────────────────────────

export type HandlePosition =
  | "nw" | "n" | "ne"
  | "w"          | "e"
  | "sw" | "s" | "se"

export const ALL_HANDLES: HandlePosition[] = ["nw","n","ne","w","e","sw","s","se"]

/** Return the CSS cursor name for each handle. */
export function handleCursor(h: HandlePosition): string {
  const map: Record<HandlePosition, string> = {
    nw: "nw-resize", n: "n-resize",  ne: "ne-resize",
    w:  "w-resize",                  e:  "e-resize",
    sw: "sw-resize", s: "s-resize",  se: "se-resize",
  }
  return map[h]
}

/** Return x,y position of a handle relative to the element's bounding box. */
export function handleOffset(
  h: HandlePosition,
  w: number,
  ht: number,
): { x: number; y: number } {
  const cx = w / 2, cy = ht / 2
  const map: Record<HandlePosition, { x: number; y: number }> = {
    nw: { x: 0,  y: 0   }, n:  { x: cx, y: 0   }, ne: { x: w,  y: 0   },
    w:  { x: 0,  y: cy  },                          e:  { x: w,  y: cy  },
    sw: { x: 0,  y: ht  }, s:  { x: cx, y: ht  }, se: { x: w,  y: ht  },
  }
  return map[h]
}
