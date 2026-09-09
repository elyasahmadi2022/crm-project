"use client"

/**
 * components/template-editor/canvas-renderer.tsx
 *
 * The A4 page canvas. Renders every CanvasElement in z-index order,
 * draws the selection outline + 8 resize handles on the selected element,
 * and wires all mouse events through the CanvasEngine.
 */

import * as React from "react"
import type { CanvasElement } from "@/lib/canvas-types"
import { ALL_HANDLES, handleCursor, handleOffset } from "@/lib/canvas-types"
import type { CanvasEngine } from "@/hooks/use-canvas-engine"
import { ImageIcon } from "lucide-react"

// ── Handle size ───────────────────────────────────────────────────────────────
const HANDLE_SIZE = 8 // px, the square resize knob

// ── Element renderer ──────────────────────────────────────────────────────────

function ElementNode({
  el,
  isSelected,
  engine,
}: {
  el:         CanvasElement
  isSelected: boolean
  engine:     CanvasEngine
}) {
  const s = el.style

  // Build CSS for the element box
  const boxStyle: React.CSSProperties = {
    position:   "absolute",
    left:       el.x,
    top:        el.y,
    width:      el.width,
    height:     el.height,
    transform:  el.rotation ? `rotate(${el.rotation}deg)` : undefined,
    zIndex:     el.zIndex,
    cursor:     el.locked ? "default" : "move",
    userSelect: "none",
    boxSizing:  "border-box",
    overflow:   "hidden",

    // Fill
    backgroundColor:
      el.type === "text"
        ? "transparent"
        : `${s.backgroundColor}${opacityToHex(s.backgroundOpacity)}`,

    // Border
    border:
      s.borderWidth > 0
        ? `${s.borderWidth}px ${s.borderStyle} ${s.borderColor}`
        : undefined,
    borderRadius: s.borderRadius,

    // Shadow
    boxShadow:
      s.shadowOpacity > 0
        ? `${s.shadowX}px ${s.shadowY}px ${s.shadowBlur}px ${s.shadowColor}${opacityToHex(s.shadowOpacity)}`
        : undefined,

    // Padding (text / input-field)
    paddingTop:    s.paddingTop,
    paddingRight:  s.paddingRight,
    paddingBottom: s.paddingBottom,
    paddingLeft:   s.paddingLeft,
  }

  // Visibility fade
  if (!el.visible) boxStyle.opacity = 0.25

  // Text / content styles
  const textStyle: React.CSSProperties = {
    color:          `${s.color}${opacityToHex(s.textOpacity)}`,
    fontSize:       s.fontSize,
    fontWeight:     s.fontWeight === "semibold" ? 600 : s.fontWeight,
    fontStyle:      s.fontStyle,
    textAlign:      s.textAlign,
    lineHeight:     s.lineHeight,
    letterSpacing:  s.letterSpacing,
    wordBreak:      "break-word",
    whiteSpace:     "pre-wrap",
    width:          "100%",
    height:         "100%",
  }

  function renderContent() {
    switch (el.type) {
      case "text":
        return (
          <div style={textStyle}>
            {el.content || <span style={{ opacity: 0.35 }}>Double-click to edit</span>}
          </div>
        )

      case "shape":
        return null // shape is pure background + border

      case "image":
        return s.backgroundImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={s.backgroundImage}
            alt={el.label}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            draggable={false}
          />
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full gap-1 text-muted-foreground">
            <ImageIcon className="size-6 opacity-40" />
            <span style={{ fontSize: 10, opacity: 0.4 }}>Image</span>
          </div>
        )

      case "input-field":
        return (
          <div style={{ ...textStyle, opacity: 0.6, pointerEvents: "none" }}>
            {el.content || "Field"}
          </div>
        )
    }
  }

  return (
    <>
      {/* ── Element box ─────────────────────────────────────────────── */}
      <div
        style={boxStyle}
        onMouseDown={(e) => engine.onElementMouseDown(el.id, e)}
      >
        {renderContent()}
      </div>

      {/* ── Selection outline + handles ─────────────────────────────── */}
      {isSelected && (
        <>
          {/* Selection ring — sits just outside the element */}
          <div
            style={{
              position:      "absolute",
              left:          el.x - 1,
              top:           el.y - 1,
              width:         el.width  + 2,
              height:        el.height + 2,
              zIndex:        9998,
              border:        "1.5px solid #2563eb",
              borderRadius:  s.borderRadius > 0 ? s.borderRadius + 1 : 2,
              pointerEvents: "none",
              boxSizing:     "border-box",
            }}
          />

          {/* 8 resize handles */}
          {ALL_HANDLES.map((handle) => {
            const off = handleOffset(handle, el.width, el.height)
            return (
              <div
                key={handle}
                style={{
                  position:        "absolute",
                  left:            el.x + off.x - HANDLE_SIZE / 2,
                  top:             el.y + off.y - HANDLE_SIZE / 2,
                  width:           HANDLE_SIZE,
                  height:          HANDLE_SIZE,
                  zIndex:          9999,
                  backgroundColor: "#ffffff",
                  border:          "1.5px solid #2563eb",
                  borderRadius:    2,
                  cursor:          handleCursor(handle),
                  boxSizing:       "border-box",
                }}
                onMouseDown={(e) => engine.onHandleMouseDown(el.id, handle, e)}
              />
            )
          })}

          {/* Lock indicator */}
          {el.locked && (
            <div
              style={{
                position:   "absolute",
                left:       el.x + el.width / 2 - 10,
                top:        el.y - 22,
                zIndex:     9999,
                fontSize:   11,
                background: "#1e293b",
                color:      "#f8fafc",
                padding:    "1px 6px",
                borderRadius: 4,
                pointerEvents: "none",
                whiteSpace: "nowrap",
              }}
            >
              🔒 Locked
            </div>
          )}
        </>
      )}
    </>
  )
}

// ── Canvas renderer ───────────────────────────────────────────────────────────

interface CanvasRendererProps {
  engine:  CanvasEngine
  /** Canvas zoom level (1 = 100%). Defaults to 1. */
  zoom?:   number
  /** Whether to show the page grid. Defaults to false. */
  showGrid?: boolean
}

export function CanvasRenderer({
  engine,
  zoom = 1,
  showGrid = false,
}: CanvasRendererProps) {
  const { layout, selectedId, sortedElements } = engine
  const { page } = layout

  const pageStyle: React.CSSProperties = {
    position:   "relative",
    width:      page.widthPx,
    height:     page.heightPx,
    flexShrink: 0,

    // Page background
    backgroundColor: page.background,
    backgroundImage: page.backgroundImage
      ? `url(${page.backgroundImage})`
      : undefined,
    backgroundSize:  "cover",
    backgroundPosition: "center",
    ...(page.backgroundImage
      ? { "--bg-img-opacity": `${page.backgroundImageOpacity / 100}` } as React.CSSProperties
      : {}),

    // Shadow to give "paper" feel
    boxShadow: "0 4px 32px rgba(0,0,0,0.18)",

    // Grid overlay (CSS background pattern)
    ...(showGrid
      ? {
          backgroundImage:
            "linear-gradient(to right, rgba(99,102,241,0.08) 1px, transparent 1px), " +
            "linear-gradient(to bottom, rgba(99,102,241,0.08) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }
      : {}),
  }

  return (
    /* ── Scrollable outer wrapper ─────────────────────────────────── */
    <div
      className="flex-1 overflow-auto flex items-start justify-center py-12"
      style={{ background: "#f1f5f9", minHeight: 0 }}
    >
      {/* ── Zoom wrapper ──────────────────────────────────────────── */}
      <div
        style={{
          transform:       `scale(${zoom})`,
          transformOrigin: "top center",
          marginBottom:    (page.heightPx * zoom) - page.heightPx,
        }}
      >
        {/* ── Page ──────────────────────────────────────────────── */}
        <div
          style={pageStyle}
          onMouseDown={engine.onCanvasMouseDown}
        >
          {sortedElements.map((el) => (
            <ElementNode
              key={el.id}
              el={el}
              isSelected={el.id === selectedId}
              engine={engine}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Utility ───────────────────────────────────────────────────────────────────

/** Convert 0–100 opacity to a 2-char hex suffix, e.g. 50 → "80" */
function opacityToHex(opacity: number): string {
  if (opacity >= 100) return ""
  if (opacity <= 0)   return "00"
  return Math.round((opacity / 100) * 255)
    .toString(16)
    .padStart(2, "0")
}
