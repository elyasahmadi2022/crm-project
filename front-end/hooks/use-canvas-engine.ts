"use client"

/**
 * hooks/use-canvas-engine.ts
 *
 * Core state + interaction engine for the Figma-style canvas editor.
 *
 * TemplateLayout (from canvas-types.ts):
 *   { version: "1", page: PageConfig, elements: CanvasElement[] }
 *
 * The hook owns:
 *   - element CRUD  (add / update / delete / duplicate)
 *   - selection     (single selected element id)
 *   - drag-to-move  (mouse down on element → mousemove on window)
 *   - 8-handle resize (mouse down on handle → mousemove on window)
 *   - z-index management
 *   - page config updates
 */

import { useState, useCallback, useRef, useEffect } from "react"
import type { CanvasElement, TemplateLayout, HandlePosition } from "@/lib/canvas-types"
import { createElement } from "@/lib/canvas-types"
import type { ElementType } from "@/lib/canvas-types"

// ── Drag state ────────────────────────────────────────────────────────────────

type DragMode = "idle" | "move" | "resize"

interface DragState {
  mode:      DragMode
  elementId: string | null
  handle:    HandlePosition | null
  startX:    number
  startY:    number
  startRect: { x: number; y: number; width: number; height: number } | null
}

const IDLE_DRAG: DragState = {
  mode: "idle", elementId: null, handle: null,
  startX: 0, startY: 0, startRect: null,
}

// ── Public interface ──────────────────────────────────────────────────────────

export interface CanvasEngine {
  // State
  layout:     TemplateLayout
  selectedId: string | null
  dragMode:   DragMode

  // Selection
  selectElement:      (id: string | null) => void
  getElement:         (id: string) => CanvasElement | undefined
  getSelectedElement: () => CanvasElement | undefined

  // Mouse handlers (attached to DOM elements in the renderer)
  onCanvasMouseDown:  (e: React.MouseEvent) => void
  onElementMouseDown: (id: string, e: React.MouseEvent) => void
  onHandleMouseDown:  (id: string, handle: HandlePosition, e: React.MouseEvent) => void

  // CRUD
  addElement:       (type: ElementType, overrides?: Partial<Omit<CanvasElement, "type">>) => string
  updateElement:    (id: string, updates: Partial<CanvasElement>) => void
  updateStyle:      (id: string, styleUpdates: Partial<CanvasElement["style"]>) => void
  deleteElement:    (id: string) => void
  duplicateElement: (id: string) => string | null

  // Z-index
  moveElementUp:   (id: string) => void
  moveElementDown: (id: string) => void
  bringToFront:    (id: string) => void
  sendToBack:      (id: string) => void

  // Page config
  updatePage: (updates: Partial<TemplateLayout["page"]>) => void

  // Sorted elements (by zIndex ascending — render order)
  sortedElements: CanvasElement[]
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useCanvasEngine(
  initialLayout: TemplateLayout,
  onChange?: (layout: TemplateLayout) => void,
): CanvasEngine {

  const [layout,     setLayout]     = useState<TemplateLayout>(initialLayout)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dragState,  setDragState]  = useState<DragState>(IDLE_DRAG)

  const isDragging  = useRef(false)
  const dragRef     = useRef<DragState>(IDLE_DRAG) // always-current snapshot for mousemove
  const layoutRef   = useRef<TemplateLayout>(layout)

  // Keep refs in sync
  useEffect(() => { layoutRef.current = layout }, [layout])
  useEffect(() => { dragRef.current   = dragState }, [dragState])

  // Notify parent
  useEffect(() => { onChange?.(layout) }, [layout, onChange])

  // ── Helpers ───────────────────────────────────────────────────────────────

  const mutateElements = useCallback(
    (fn: (elements: CanvasElement[]) => CanvasElement[]) => {
      setLayout((prev) => ({ ...prev, elements: fn(prev.elements) }))
    },
    [],
  )

  const getElement = useCallback(
    (id: string) => layout.elements.find((el) => el.id === id),
    [layout.elements],
  )

  const getSelectedElement = useCallback(
    () => (selectedId ? layout.elements.find((el) => el.id === selectedId) : undefined),
    [selectedId, layout.elements],
  )

  const sortedElements = [...layout.elements].sort((a, b) => a.zIndex - b.zIndex)

  // ── Selection ─────────────────────────────────────────────────────────────

  const selectElement = useCallback((id: string | null) => setSelectedId(id), [])

  // ── CRUD ──────────────────────────────────────────────────────────────────

  const addElement = useCallback(
    (type: ElementType, overrides?: Partial<Omit<CanvasElement, "type">>): string => {
      const maxZ = layoutRef.current.elements.reduce((m, el) => Math.max(m, el.zIndex), 0)
      const el   = createElement(type, { ...overrides, zIndex: maxZ + 1 })
      mutateElements((prev) => [...prev, el])
      setSelectedId(el.id)
      return el.id
    },
    [mutateElements],
  )

  const updateElement = useCallback(
    (id: string, updates: Partial<CanvasElement>) => {
      mutateElements((prev) =>
        prev.map((el) => (el.id === id ? { ...el, ...updates } : el)),
      )
    },
    [mutateElements],
  )

  const updateStyle = useCallback(
    (id: string, styleUpdates: Partial<CanvasElement["style"]>) => {
      mutateElements((prev) =>
        prev.map((el) =>
          el.id === id ? { ...el, style: { ...el.style, ...styleUpdates } } : el,
        ),
      )
    },
    [mutateElements],
  )

  const deleteElement = useCallback(
    (id: string) => {
      mutateElements((prev) => prev.filter((el) => el.id !== id))
      setSelectedId((prev) => (prev === id ? null : prev))
    },
    [mutateElements],
  )

  const duplicateElement = useCallback(
    (id: string): string | null => {
      const src = layoutRef.current.elements.find((el) => el.id === id)
      if (!src) return null
      const maxZ = layoutRef.current.elements.reduce((m, el) => Math.max(m, el.zIndex), 0)
      const copy: CanvasElement = {
        ...src,
        id:     `el_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        label:  `${src.label} Copy`,
        x:      src.x + 20,
        y:      src.y + 20,
        zIndex: maxZ + 1,
      }
      mutateElements((prev) => [...prev, copy])
      setSelectedId(copy.id)
      return copy.id
    },
    [mutateElements],
  )

  // ── Z-index ───────────────────────────────────────────────────────────────

  const moveElementUp = useCallback(
    (id: string) => {
      const els = [...layoutRef.current.elements].sort((a, b) => a.zIndex - b.zIndex)
      const idx = els.findIndex((el) => el.id === id)
      if (idx === -1 || idx === els.length - 1) return
      const [a, b] = [els[idx], els[idx + 1]]
      updateElement(a.id, { zIndex: b.zIndex })
      updateElement(b.id, { zIndex: a.zIndex })
    },
    [updateElement],
  )

  const moveElementDown = useCallback(
    (id: string) => {
      const els = [...layoutRef.current.elements].sort((a, b) => a.zIndex - b.zIndex)
      const idx = els.findIndex((el) => el.id === id)
      if (idx <= 0) return
      const [a, b] = [els[idx], els[idx - 1]]
      updateElement(a.id, { zIndex: b.zIndex })
      updateElement(b.id, { zIndex: a.zIndex })
    },
    [updateElement],
  )

  const bringToFront = useCallback(
    (id: string) => {
      const maxZ = layoutRef.current.elements.reduce((m, el) => Math.max(m, el.zIndex), 0)
      updateElement(id, { zIndex: maxZ + 1 })
    },
    [updateElement],
  )

  const sendToBack = useCallback(
    (id: string) => {
      const minZ = layoutRef.current.elements.reduce((m, el) => Math.min(m, el.zIndex), 0)
      updateElement(id, { zIndex: minZ - 1 })
    },
    [updateElement],
  )

  // ── Page config ───────────────────────────────────────────────────────────

  const updatePage = useCallback(
    (updates: Partial<TemplateLayout["page"]>) => {
      setLayout((prev) => ({ ...prev, page: { ...prev.page, ...updates } }))
    },
    [],
  )

  // ── Mouse handlers ────────────────────────────────────────────────────────

  const onCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) setSelectedId(null)
  }, [])

  const onElementMouseDown = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation()
      const el = layoutRef.current.elements.find((x) => x.id === id)
      if (!el || el.locked) {
        // Still allow selection of locked elements
        setSelectedId(id)
        return
      }
      setSelectedId(id)
      const ds: DragState = {
        mode: "move", elementId: id, handle: null,
        startX: e.clientX, startY: e.clientY,
        startRect: { x: el.x, y: el.y, width: el.width, height: el.height },
      }
      setDragState(ds)
      dragRef.current  = ds
      isDragging.current = true
    },
    [],
  )

  const onHandleMouseDown = useCallback(
    (id: string, handle: HandlePosition, e: React.MouseEvent) => {
      e.stopPropagation()
      const el = layoutRef.current.elements.find((x) => x.id === id)
      if (!el || el.locked) return
      const ds: DragState = {
        mode: "resize", elementId: id, handle,
        startX: e.clientX, startY: e.clientY,
        startRect: { x: el.x, y: el.y, width: el.width, height: el.height },
      }
      setDragState(ds)
      dragRef.current    = ds
      isDragging.current = true
    },
    [],
  )

  // ── Global mouse listeners ────────────────────────────────────────────────

  useEffect(() => {
    const MIN = 20 // minimum element dimension in px

    function onMouseMove(e: MouseEvent) {
      if (!isDragging.current) return
      const ds = dragRef.current
      if (!ds.startRect || !ds.elementId) return

      const dx = e.clientX - ds.startX
      const dy = e.clientY - ds.startY

      if (ds.mode === "move") {
        setLayout((prev) => ({
          ...prev,
          elements: prev.elements.map((el) =>
            el.id === ds.elementId
              ? { ...el, x: ds.startRect!.x + dx, y: ds.startRect!.y + dy }
              : el,
          ),
        }))
        return
      }

      if (ds.mode === "resize" && ds.handle) {
        const { x, y, width, height } = ds.startRect
        const h = ds.handle
        let nx = x, ny = y, nw = width, nh = height

        if (h.includes("n")) { ny = y + dy; nh = height - dy }
        if (h.includes("s")) { nh = height + dy }
        if (h.includes("w")) { nx = x + dx;  nw = width  - dx }
        if (h.includes("e")) { nw = width  + dx }

        // Clamp to minimum size
        if (nw < MIN) { if (h.includes("w")) nx = x + width - MIN; nw = MIN }
        if (nh < MIN) { if (h.includes("n")) ny = y + height - MIN; nh = MIN }

        setLayout((prev) => ({
          ...prev,
          elements: prev.elements.map((el) =>
            el.id === ds.elementId
              ? { ...el, x: nx, y: ny, width: nw, height: nh }
              : el,
          ),
        }))
      }
    }

    function onMouseUp() {
      if (!isDragging.current) return
      isDragging.current = false
      setDragState(IDLE_DRAG)
      dragRef.current = IDLE_DRAG
    }

    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup",   onMouseUp)
    return () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup",   onMouseUp)
    }
  }, []) // intentionally empty — reads everything via refs

  // ── Return ────────────────────────────────────────────────────────────────

  return {
    layout,
    selectedId,
    dragMode: dragState.mode,
    selectElement,
    getElement,
    getSelectedElement,
    onCanvasMouseDown,
    onElementMouseDown,
    onHandleMouseDown,
    addElement,
    updateElement,
    updateStyle,
    deleteElement,
    duplicateElement,
    moveElementUp,
    moveElementDown,
    bringToFront,
    sendToBack,
    updatePage,
    sortedElements,
  }
}
