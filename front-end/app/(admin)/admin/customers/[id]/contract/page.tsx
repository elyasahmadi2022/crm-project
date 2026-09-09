"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { useParams, useRouter } from "next/navigation"
import { Printer, ArrowLeft, QrCode, Save, Bold, Italic, Underline, Type, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCustomerQuery } from "@/queries/customer.queries"
import { useCompanySettingsQuery, useContractTemplatesQuery } from "@/queries/company.queries"
import { useListContractsQuery, useCreateContractMutation, useUpdateContractMutation } from "@/queries/contract.queries"
import { toast } from "@/components/ui/toast"
import type { Contract } from "@/services/contract.service"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type PaperSize = "A4" | "LETTER" | "A5"

type FieldType =
  | "company-logo" | "company-name" | "company-tagline"
  | "company-phone" | "company-email" | "company-website" | "company-address"
  | "invoice-title" | "invoice-date" | "invoice-number" | "order-id"
  | "installation-limit" | "activation-process" | "payment-terms"
  | "customer-block" | "items-table" | "project-description"
  | "subtotal" | "tax-line" | "grand-total"
  | "contract-text" | "signature-block"
  | "divider" | "custom-text" | "qr-code"

interface CanvasElement {
  id:             string
  type:           FieldType
  groupId?:       string
  x:              number
  y:              number
  width:          number
  height:         number
  fontSize:       number
  fontWeight:     "normal" | "bold"
  fontStyle:      "normal" | "italic"
  textDecoration: "none"   | "underline"
  textAlign:      "left"   | "center" | "right"
  color:          string
  bgColor:        string
  text?:          string
  placeholder?:   string
}

const PAPER: Record<PaperSize, { w: number; h: number }> = {
  A4:     { w: 595, h: 842 },
  LETTER: { w: 612, h: 792 },
  A5:     { w: 420, h: 595 },
}

// ── Print styles ──────────────────────────────────────────────────────────────

// Dynamic print styles function
function getPrintStyles(paperSize: PaperSize): string {
  const paper = PAPER[paperSize]
  return `
@media print {
  /* Page setup */
  @page {
    size: ${paperSize === "A4" ? "A4" : paperSize === "LETTER" ? "letter" : "A5"};
    margin: 0;
  }
  
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    height: auto !important;
    background: white !important;
  }
  
  /* Hide everything except print content */
  body > *:not(#print-container) {
    display: none !important;
  }
  
  /* Show only print container */
  #print-container {
    display: block !important;
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  
  /* Each page centered and exact size */
  .contract-page {
    display: block !important;
    position: relative !important;
    width: ${paper.w}px !important;
    height: ${paper.h}px !important;
    margin: 0 auto !important;
    padding: 0 !important;
    box-shadow: none !important;
    background: white !important;
    page-break-after: always !important;
    page-break-inside: avoid !important;
  }
  
  /* Last page no page break */
  .contract-page:last-child {
    page-break-after: auto !important;
  }
}
`
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(): string {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function CustomerContractPage() {
  const params = useParams()
  const router = useRouter()
  const customerId = Number(params.id)

  // ── Queries ─────────────────────────────────────────────────────────────────
  const { data: customer, isLoading: loadingCustomer } = useCustomerQuery(customerId)
  const { data: companyData, isLoading: loadingCompany } = useCompanySettingsQuery()
  const { data: templatesData, isLoading: loadingTemplates } = useContractTemplatesQuery()
  
  // Query existing contracts for this customer
  const { data: contractsData } = useListContractsQuery({ customerId })
  const createContractMutation = useCreateContractMutation()
  const updateContractMutation = useUpdateContractMutation()

  // Get existing contract for this customer (if any)
  const existingContract: Contract | undefined = React.useMemo(() => 
    contractsData?.data?.find((c: Contract) => c.customer.id === customerId),
    [contractsData, customerId]
  )

  // ── Local state ─────────────────────────────────────────────────────────────
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<number | null>(null)
  const [terms, setTerms] = React.useState(
    "1. Payment is due within specified terms.\n" +
    "2. License is non-transferable.\n" +
    "3. Support for duration specified.\n" +
    "4. Disputes resolved under local law."
  )
  const [projectDescription, setProjectDescription] = React.useState("FastBooks Business Accounting ERP")
  const [lineItemCost, setLineItemCost] = React.useState("0.00")
  const [taxPercent, setTaxPercent] = React.useState("10")
  const [activationLimit, setActivationLimit] = React.useState("1 Active License")
  const [activationProcess, setActivationProcess] = React.useState("6-24 Hours After Payment")
  const [paymentTerms, setPaymentTerms] = React.useState("Advanced")
  const [textDirection, setTextDirection] = React.useState<"ltr" | "rtl">("ltr")
  
  // Rich text formatting state
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const [isSaving, setIsSaving] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  
  // Mount state for portal
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Generate unique invoice/order IDs based on customer ID and timestamp
  const invoiceNumber = React.useMemo(() => `INV-${customerId}-${Date.now().toString().slice(-6)}`, [customerId])
  const orderID = React.useMemo(() => `ORD-${customerId}-${Date.now().toString().slice(-6)}`, [customerId])

  // Load existing contract data on mount
  React.useEffect(() => {
    if (existingContract) {
      // Parse terms and extract text direction if stored
      const termsText = existingContract.termsAndConditions || terms
      const directionMatch = termsText.match(/^<!--DIR:(ltr|rtl)-->/)
      
      if (directionMatch) {
        setTextDirection(directionMatch[1] as "ltr" | "rtl")
        // Remove the direction metadata from displayed text
        setTerms(termsText.replace(/^<!--DIR:(ltr|rtl)-->\n?/, ""))
      } else {
        setTerms(termsText)
      }
      
      setProjectDescription(existingContract.projectDescription || projectDescription)
      setLineItemCost(existingContract.lineItemCost || lineItemCost)
      setTaxPercent(existingContract.taxPercent || taxPercent)
      setActivationLimit(existingContract.activationLimit || activationLimit)
      setActivationProcess(existingContract.activationProcess || activationProcess)
      setPaymentTerms(existingContract.paymentTerms || paymentTerms)
    }
  }, [existingContract])

  // Get all templates and select default on load
  const templates = templatesData ?? []
  React.useEffect(() => {
    if (templates.length > 0 && selectedTemplateId === null) {
      const defaultTemplate = templates.find(t => t.isDefault) ?? templates[0]
      if (defaultTemplate) setSelectedTemplateId(defaultTemplate.id)
    }
  }, [templates, selectedTemplateId])

  // Get selected template
  const template = templates.find(t => t.id === selectedTemplateId) ?? null

  // Parse template layout
  let elements: CanvasElement[] = []
  let paperSize: PaperSize = "A4"
  let pageStyle: { bgColor: string; bgImage?: string } = { bgColor: "#ffffff" }

  if (template?.layoutJson) {
    try {
      const parsed = JSON.parse(template.layoutJson) as {
        version?: string
        paperSize?: PaperSize
        pageStyle?: { bgColor: string; bgImage?: string }
        elements?: CanvasElement[]
      }
      elements = parsed.elements || []
      paperSize = parsed.paperSize || "A4"
      pageStyle = parsed.pageStyle || pageStyle
    } catch (e) {
      console.error("Failed to parse layoutJson:", e)
    }
  }

  // Inject dynamic print styles based on paper size
  React.useEffect(() => {
    const style = document.createElement("style")
    style.id = "contract-print-styles"
    style.innerHTML = getPrintStyles(paperSize)
    document.head.appendChild(style)
    return () => document.getElementById("contract-print-styles")?.remove()
  }, [paperSize])

  // ── Save contract ───────────────────────────────────────────────────────────
  const handleSaveContract = async () => {
    setIsSaving(true)
    try {
      // Store text direction as metadata in terms
      const termsWithDirection = `<!--DIR:${textDirection}-->\n${terms}`
      
      const contractData = {
        customerId,
        invoiceDate: fmtDate(),
        invoiceNumber,
        orderId: orderID,
        projectDescription,
        lineItemCost: parseFloat(lineItemCost) || 0,
        taxPercent: parseFloat(taxPercent) || 0,
        activationLimit,
        activationProcess,
        paymentTerms,
        termsAndConditions: termsWithDirection,
        status: "DRAFT" as const,
      }

      if (existingContract) {
        // Update existing contract
        await updateContractMutation.mutateAsync({
          id: existingContract.id,
          dto: contractData,
        })
        toast.add({
          type: "success",
          title: "Contract updated",
          description: "Contract saved successfully",
        })
      } else {
        // Create new contract
        await createContractMutation.mutateAsync(contractData)
        toast.add({
          type: "success",
          title: "Contract created",
          description: "Contract saved successfully",
        })
      }
    } catch (error) {
      toast.add({
        type: "error",
        title: "Save failed",
        description: error instanceof Error ? error.message : "Failed to save contract",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // ── Rich text formatting helpers ────────────────────────────────────────────
  const wrapSelection = (prefix: string, suffix: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = terms.substring(start, end)
    
    if (selectedText) {
      const before = terms.substring(0, start)
      const after = terms.substring(end)
      const newText = before + prefix + selectedText + suffix + after
      setTerms(newText)
      
      // Restore selection
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + prefix.length, end + prefix.length)
      }, 0)
    }
  }

  // Apply style to selection (color, size, etc.) - removes existing similar styles first
  const applyStyle = (styleProperty: string, styleValue: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    let selectedText = terms.substring(start, end)
    
    if (!selectedText) return

    // Remove existing span tags with the same style property from selection
    const styleRegex = new RegExp(`<span style="${styleProperty}:[^"]*">([^<]*)</span>`, 'g')
    selectedText = selectedText.replace(styleRegex, '$1')
    
    // Also handle nested spans - extract innermost content
    selectedText = selectedText.replace(/<\/?span[^>]*>/g, '')

    const before = terms.substring(0, start)
    const after = terms.substring(end)
    const wrappedText = `<span style="${styleProperty}:${styleValue}">${selectedText}</span>`
    const newText = before + wrappedText + after
    
    setTerms(newText)
    
    // Restore selection
    setTimeout(() => {
      textarea.focus()
      const newStart = start + `<span style="${styleProperty}:${styleValue}">`.length
      const newEnd = newStart + selectedText.length
      textarea.setSelectionRange(newStart, newEnd)
    }, 0)
  }

  // ── Loading states ──────────────────────────────────────────────────────────
  if (loadingCustomer || loadingCompany || loadingTemplates) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading contract...</div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-destructive">Customer not found</div>
      </div>
    )
  }

  if (templates.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-destructive">No templates available. Please create a template first.</div>
      </div>
    )
  }

  const paper = PAPER[paperSize]

  // Calculations
  const totalAmount = parseFloat(lineItemCost) || 0
  const taxAmount = totalAmount * (parseFloat(taxPercent) / 100)
  const grossTotal = totalAmount + taxAmount

  // Data substitution for canvas elements
  const substituteData = (el: CanvasElement): CanvasElement => {
    const invoiceDate = fmtDate()
    const contact = customer.primaryContact

    const customerBlock = customer
      ? `${customer.companyName}\n${contact?.email || ""}\n${contact?.phone || ""}\n${customer.address || ""}`
      : "[Customer Name]\n[Email]\n[Phone]\n[Address]"

    switch (el.type) {
      case "company-name":
        return { ...el, text: companyData?.name || "[Company Name]" }
      case "company-tagline":
        return { ...el, text: companyData?.tagline || "[Company Tagline]" }
      case "company-phone":
        return { ...el, text: companyData?.phone || "[Company Phone]" }
      case "company-email":
        return { ...el, text: companyData?.email || "[Company Email]" }
      case "company-website":
        return { ...el, text: companyData?.website || "[Company Website]" }
      case "company-address":
        return { ...el, text: companyData?.address || "[Company Address]" }
      case "invoice-date":
        return { ...el, text: invoiceDate }
      case "invoice-number":
        return { ...el, text: invoiceNumber }
      case "order-id":
        return { ...el, text: orderID }
      case "installation-limit":
        return { ...el, text: activationLimit }
      case "activation-process":
        return { ...el, text: activationProcess }
      case "payment-terms":
        return { ...el, text: paymentTerms }
      case "customer-block":
        return { ...el, text: customerBlock }
      case "project-description":
        return { ...el, text: projectDescription || el.text || "Project Description" }
      case "contract-text":
        return { ...el, text: terms || el.text || "[Terms and conditions]" }
      case "subtotal":
        return { ...el, text: `Total Amount: $${totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}` }
      case "tax-line":
        return { ...el, text: `Tax (${taxPercent}%): $${taxAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}` }
      case "grand-total":
        return { ...el, text: `Gross Total: $${grossTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}` }
      default:
        return el
    }
  }

  const substitutedElements = elements.map(substituteData)

  // Separate elements by type for page flow
  const headerElements = substitutedElements.filter(el => 
    el.type !== "contract-text" && 
    el.type !== "signature-block" && 
    el.type !== "qr-code" &&
    el.y < (paper.h * 0.4)
  )
  const termsElement = substitutedElements.find(el => el.type === "contract-text")
  const signatureElement = substitutedElements.find(el => el.type === "signature-block")
  const qrCodeElement = substitutedElements.find(el => el.type === "qr-code")
  const middleElements = substitutedElements.filter(el => 
    el.type !== "contract-text" && 
    el.type !== "signature-block" && 
    el.type !== "qr-code" &&
    el.y >= (paper.h * 0.4)
  )
  
  // Estimate text height for page breaks
  const estimatedTextLines = terms.split('\n').length
  const estimatedHeight = Math.max(
    termsElement?.height || 0,
    estimatedTextLines * 20 // ~20px per line with formatting
  )
  
  // Calculate pages needed
  const termsY = termsElement?.y || paper.h * 0.5
  const availableHeightFirstPage = paper.h - termsY - 100 // Reserve space for potential footer
  const availableHeightPerPage = paper.h - 100 // Margins for subsequent pages
  
  let pagesNeeded = 1
  if (estimatedHeight > availableHeightFirstPage) {
    const remainingHeight = estimatedHeight - availableHeightFirstPage
    pagesNeeded = 1 + Math.ceil(remainingHeight / availableHeightPerPage)
  }
  
  const totalPages = Math.max(1, pagesNeeded)
  const canvasHeight = totalPages * paper.h

  // ── Render element content ──────────────────────────────────────────────────
  // This matches the ElementContent from the template designer exactly
  function renderElement(el: CanvasElement) {
    const content = el.text ?? el.placeholder ?? ""

    if (el.type === "company-logo") {
      return companyData?.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={companyData.logoUrl}
          alt="Company Logo"
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      ) : (
        <div style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: el.bgColor || "#f3f4f6",
          borderRadius: 4,
          fontSize: 10,
          color: "#9ca3af",
          fontWeight: "normal"
        }}>
          Logo
        </div>
      )
    }

    if (el.type === "qr-code") {
      return (
        <div style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: el.bgColor || "#f3f4f6",
          borderRadius: 4,
          gap: 2
        }}>
          <QrCode size={Math.min(el.width, el.height) * 0.55} color="#374151" />
          <span style={{ fontSize: 8, color: "#6b7280" }}>QR Code</span>
        </div>
      )
    }

    if (el.type === "divider") {
      return <div style={{ width: "100%", height: "100%", background: el.bgColor || "#374151" }} />
    }

    if (el.type === "items-table") {
      return (
        <div style={{ width: "100%", height: "100%", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: el.fontSize }}>
            <thead>
              <tr style={{ background: "#1e293b", color: "#fff" }}>
                {["Project Description", "Cost"].map(h => (
                  <th key={h} style={{ padding: "4px 8px", textAlign: "left", fontSize: el.fontSize - 1 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                [projectDescription || "FastBooks Business Accounting ERP", `$${parseFloat(lineItemCost || "0").toFixed(2)}`],
                ["Online Hosting Server & System Installation", "Free/First year"],
              ].map(([d, c], i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "#f8fafc" : "#fff" }}>
                  <td style={{ padding: "3px 8px", borderBottom: "1px solid #e5e7eb" }}>{d}</td>
                  <td style={{ padding: "3px 8px", borderBottom: "1px solid #e5e7eb", textAlign: "right", whiteSpace: "nowrap" }}>{c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }

    if (el.type === "customer-block") {
      const contact = customer?.primaryContact
      return (
        <div style={{ width: "100%", height: "100%", fontSize: el.fontSize, padding: "4px 6px", overflow: "hidden" }}>
          <div style={{ fontSize: el.fontSize - 1, color: "#6b7280", marginBottom: 2 }}>Invoice To:</div>
          <div style={{ fontWeight: "bold", marginBottom: 1 }}>{customer?.companyName || "Company Name"}</div>
          <div style={{ marginBottom: 1 }}>{customer?.address || "Kabul, Afghanistan"}</div>
          <div style={{ color: "#6b7280" }}>Mobile: {contact?.phone || "+93 (0) 799 000 000"}</div>
        </div>
      )
    }

    if (el.type === "signature-block") {
      return (
        <div style={{ width: "100%", height: "100%", fontSize: el.fontSize, padding: "4px 6px" }}>
          <div style={{ borderTop: "1px solid #374151", paddingTop: 4, marginTop: 8 }}>Authorized Signature</div>
          <div style={{ marginTop: 16, borderTop: "1px solid #374151", paddingTop: 4 }}>Date</div>
        </div>
      )
    }

    if (el.type === "contract-text") {
      // Remove direction metadata for display
      const displayContent = content.replace(/^<!--DIR:(ltr|rtl)-->\n?/, "")
      
      return (
        <div 
          style={{
            width: "100%",
            minHeight: el.height,
            fontSize: el.fontSize,
            padding: "4px 6px",
            whiteSpace: "pre-wrap",
            lineHeight: 1.5,
            color: el.color,
            direction: textDirection,
            textAlign: textDirection === "rtl" ? "right" : "left"
          }}
          dangerouslySetInnerHTML={{ 
            __html: displayContent
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/_(.*?)_/g, '<em>$1</em>')
              .replace(/\n/g, '<br/>') 
          }}
        />
      )
    }

    // Default rendering for all other fields (invoice fields, company info, etc.)
    return (
      <div style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        padding: "2px 6px",
        overflow: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis"
      }}>
        {content}
      </div>
    )
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  
  // Render pages function for reuse
  const renderPages = () => (
    <>
      {Array.from({ length: totalPages }).map((_, pageIndex) => (
        <div
          key={pageIndex}
          className="contract-page relative bg-white shadow-lg mb-8"
          style={{
            width: `${paper.w}px`,
            height: `${paper.h}px`,
            backgroundColor: pageStyle.bgColor,
            backgroundImage: pageStyle.bgImage ? `url(${pageStyle.bgImage})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Render header and middle elements only on first page */}
          {pageIndex === 0 && (
            <>
              {headerElements.map((el) => (
                <div
                  key={el.id}
                  className="absolute"
                  style={{
                    left: el.x,
                    top: el.y,
                    width: el.width,
                    height: el.height,
                    fontSize: el.fontSize,
                    fontWeight: el.fontWeight,
                    fontStyle: el.fontStyle,
                    textDecoration: el.textDecoration,
                    textAlign: el.textAlign,
                    color: el.type === "divider" ? "transparent" : el.color,
                    backgroundColor: el.bgColor,
                    overflow: "hidden",
                  }}
                >
                  {renderElement(el)}
                </div>
              ))}
              {middleElements.map((el) => (
                <div
                  key={el.id}
                  className="absolute"
                  style={{
                    left: el.x,
                    top: el.y,
                    width: el.width,
                    height: el.height,
                    fontSize: el.fontSize,
                    fontWeight: el.fontWeight,
                    fontStyle: el.fontStyle,
                    textDecoration: el.textDecoration,
                    textAlign: el.textAlign,
                    color: el.type === "divider" ? "transparent" : el.color,
                    backgroundColor: el.bgColor,
                    overflow: "hidden",
                  }}
                >
                  {renderElement(el)}
                </div>
              ))}
            </>
          )}

          {/* Render terms - spans across pages */}
          {termsElement && (
            <div
              className="absolute"
              style={{
                left: termsElement.x,
                top: pageIndex === 0 ? termsElement.y : 50,
                width: termsElement.width,
                maxHeight: pageIndex === 0 
                  ? (paper.h - termsElement.y - 100) 
                  : (paper.h - 150),
                fontSize: termsElement.fontSize,
                fontWeight: termsElement.fontWeight,
                fontStyle: termsElement.fontStyle,
                textDecoration: termsElement.textDecoration,
                textAlign: termsElement.textAlign,
                color: termsElement.color,
                backgroundColor: termsElement.bgColor,
                overflow: pageIndex < totalPages - 1 ? "hidden" : "visible",
              }}
            >
              {renderElement(termsElement)}
            </div>
          )}

          {/* Render signature and QR on last page - use original template positions */}
          {pageIndex === totalPages - 1 && (
            <>
              {/* QR Code - original template position */}
              {qrCodeElement && (
                <div
                  className="absolute"
                  style={{
                    left: qrCodeElement.x,
                    top: qrCodeElement.y,
                    width: qrCodeElement.width,
                    height: qrCodeElement.height,
                    fontSize: qrCodeElement.fontSize,
                    fontWeight: qrCodeElement.fontWeight,
                    fontStyle: qrCodeElement.fontStyle,
                    textDecoration: qrCodeElement.textDecoration,
                    textAlign: qrCodeElement.textAlign,
                    color: qrCodeElement.color,
                    backgroundColor: qrCodeElement.bgColor,
                    overflow: "hidden",
                  }}
                >
                  {renderElement(qrCodeElement)}
                </div>
              )}

              {/* Signature - original template position */}
              {signatureElement && (
                <div
                  className="absolute"
                  style={{
                    left: signatureElement.x,
                    top: signatureElement.y,
                    width: signatureElement.width,
                    height: signatureElement.height,
                    fontSize: signatureElement.fontSize,
                    fontWeight: signatureElement.fontWeight,
                    fontStyle: signatureElement.fontStyle,
                    textDecoration: signatureElement.textDecoration,
                    textAlign: signatureElement.textAlign,
                    color: signatureElement.color,
                    backgroundColor: signatureElement.bgColor,
                    overflow: "hidden",
                  }}
                >
                  {renderElement(signatureElement)}
                </div>
              )}

              {/* Page number at very bottom */}
              <div
                className="absolute"
                style={{
                  left: 0,
                  right: 0,
                  bottom: 20,
                  textAlign: "center",
                  fontSize: 10,
                  color: "#6b7280",
                }}
              >
                Page {pageIndex + 1} of {totalPages}
              </div>
            </>
          )}

          {/* Page numbers on other pages */}
          {pageIndex < totalPages - 1 && (
            <div
              className="absolute"
              style={{
                left: 0,
                right: 0,
                bottom: 20,
                textAlign: "center",
                fontSize: 10,
                color: "#6b7280",
              }}
            >
              Page {pageIndex + 1} of {totalPages}
            </div>
          )}
        </div>
      ))}
    </>
  )
  
  return (
    <>
      <div className="flex h-screen flex-col bg-background">
      {/* Header - hidden on print */}
      <div className="no-print flex items-center justify-between border-b bg-card px-6 py-3">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/admin/customers/${customerId}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Contract for {customer.companyName}</h1>
            <p className="text-sm text-muted-foreground">
              {existingContract ? "Editing saved contract" : "Create new contract"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Template Selector */}
          <Select
            value={selectedTemplateId?.toString() || ""}
            onValueChange={(v) => setSelectedTemplateId(Number(v))}
          >
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Select template..." />
            </SelectTrigger>
            <SelectContent>
              {templates.map((tpl) => (
                <SelectItem key={tpl.id} value={tpl.id.toString()}>
                  {tpl.name} {tpl.isDefault && "(Default)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleSaveContract}
            disabled={isSaving}
            variant="default"
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : existingContract ? "Update Contract" : "Save Contract"}
          </Button>
          <Button onClick={() => window.print()} variant="outline" className="gap-2">
            <Printer className="h-4 w-4" />
            Print / PDF
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar: Editable fields - hidden on print */}
        <div className="no-print w-96 border-r bg-card p-6 overflow-y-auto">
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold mb-3">Contract Details</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="project-desc" className="text-xs">Project Description</Label>
                  <Textarea
                    id="project-desc"
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="FastBooks Business Accounting ERP"
                    className="mt-1 text-sm min-h-[80px]"
                  />
                </div>
                <div>
                  <Label htmlFor="cost" className="text-xs">Line Item Cost ($)</Label>
                  <input
                    id="cost"
                    type="number"
                    step="0.01"
                    value={lineItemCost}
                    onChange={(e) => setLineItemCost(e.target.value)}
                    placeholder="0.00"
                    className="mt-1 w-full px-3 py-1.5 text-sm border rounded-md"
                  />
                </div>
                <div>
                  <Label htmlFor="tax" className="text-xs">Tax Percent (%)</Label>
                  <input
                    id="tax"
                    type="number"
                    step="0.01"
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(e.target.value)}
                    placeholder="10"
                    className="mt-1 w-full px-3 py-1.5 text-sm border rounded-md"
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-semibold mb-3">License & Payment</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="activation-limit" className="text-xs">Activation Limit</Label>
                  <input
                    id="activation-limit"
                    type="text"
                    value={activationLimit}
                    onChange={(e) => setActivationLimit(e.target.value)}
                    placeholder="1 Active License"
                    className="mt-1 w-full px-3 py-1.5 text-sm border rounded-md"
                  />
                </div>
                <div>
                  <Label htmlFor="activation-process" className="text-xs">Activation Process</Label>
                  <input
                    id="activation-process"
                    type="text"
                    value={activationProcess}
                    onChange={(e) => setActivationProcess(e.target.value)}
                    placeholder="6-24 Hours After Payment"
                    className="mt-1 w-full px-3 py-1.5 text-sm border rounded-md"
                  />
                </div>
                <div>
                  <Label htmlFor="payment-terms" className="text-xs">Payment Terms</Label>
                  <input
                    id="payment-terms"
                    type="text"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    placeholder="Advanced"
                    className="mt-1 w-full px-3 py-1.5 text-sm border rounded-md"
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="terms" className="text-sm font-semibold">
                  Terms & Conditions
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTextDirection(textDirection === "ltr" ? "rtl" : "ltr")}
                  className="h-7 text-xs"
                >
                  {textDirection === "ltr" ? "LTR" : "RTL"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                Customize terms for this customer
              </p>
              
              {/* Rich Text Toolbar */}
              <div className="flex flex-wrap items-center gap-1 mb-2 p-2 border rounded-md bg-muted/30">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => wrapSelection("**", "**")}
                  title="Bold"
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => wrapSelection("_", "_")}
                  title="Italic"
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => wrapSelection("<u>", "</u>")}
                  title="Underline"
                >
                  <Underline className="h-4 w-4" />
                </Button>
                
                <div className="h-6 w-px bg-border mx-1" />
                
                <Select onValueChange={(size: string | null) => size && applyStyle("font-size", size)}>
                  <SelectTrigger className="h-8 w-24 text-xs">
                    <Type className="h-3 w-3 mr-1" />
                    <SelectValue placeholder="Size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12px">Small</SelectItem>
                    <SelectItem value="14px">Normal</SelectItem>
                    <SelectItem value="16px">Medium</SelectItem>
                    <SelectItem value="18px">Large</SelectItem>
                    <SelectItem value="20px">X-Large</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="h-6 w-px bg-border mx-1" />
                
                <div className="flex items-center gap-1">
                  <Palette className="h-3 w-3 text-muted-foreground" />
                  <input
                    type="color"
                    className="h-8 w-12 cursor-pointer rounded border"
                    onChange={(e) => applyStyle("color", e.target.value as string)}
                    title="Text Color"
                  />
                  <input
                    type="color"
                    className="h-8 w-12 cursor-pointer rounded border"
                    onChange={(e) => applyStyle("background-color", e.target.value as string)}
                    title="Highlight Color"
                  />
                </div>
              </div>
              
              <Textarea
                ref={textareaRef}
                id="terms"
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                dir={textDirection}
                className="min-h-[300px] font-mono text-xs"
              />
            </div>
          </div>
        </div>

        {/* Right: Contract canvas preview */}
        <div className="flex-1 overflow-auto bg-muted/30 p-8 no-print">
          <div className="contract-page-parent mx-auto" style={{ width: `${paper.w}px` }}>
            {renderPages()}
          </div>
        </div>
      </div>
    </div>
    
    {/* Hidden print container - only visible when printing - rendered via portal */}
    {mounted && createPortal(
      <div id="print-container" style={{ display: 'none' }}>
        {renderPages()}
      </div>,
      document.body
    )}
  </>
  )
}
