"use client"

/**
 * components/contracts/contract-preview.tsx
 *
 * Full-screen dialog showing the printable contract document.
 *
 * Company data  → fetched live from /api/v1/company/settings
 * Template      → fetched live from /api/v1/company/templates/default
 *                 (falls back to sensible defaults if none set)
 *
 * Print: window.print() with injected @media print CSS that hides
 *        everything except #contract-printable.
 */

import * as React from "react"
import {
  Printer, X, Pencil, Trash2, Loader2,
  Smartphone, Mail, Phone, Globe, MessageCircle, MapPin, Building2,
} from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button }    from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge }     from "@/components/ui/badge"

import { useDeleteContractMutation }  from "@/queries/contract.queries"
import { useCompanySettingsQuery }    from "@/queries/company.queries"
import { useDefaultTemplateQuery }    from "@/queries/company.queries"
import type { Contract }              from "@/services/contract.service"
import type { Customer }              from "@/services/customer.service"
import type { ContractTemplate }      from "@/services/company.service"

// ── Fallback template (used when no template is saved yet) ────────────────────

const FALLBACK_TPL: Omit<ContractTemplate, "id" | "createdAt" | "updatedAt"> = {
  name:            "Default",
  isDefault:       true,
  layoutJson:      null,
  logoPosition:    "left",
  headerBg:        "#ffffff",
  headerTextColor: "#111111",
  showMobile:      true,
  showEmail:       true,
  showPhone:       true,
  showWebsite:     true,
  showWhatsapp:    true,
  showAddress:     true,
  showTagline:     true,
  bodyBg:          "#ffffff",
  bodyTextColor:   "#111111",
  accentColor:     "#2563eb",
  borderColor:     "#e5e7eb",
  fontSizeBase:    13,
  showCustomerBlock:  true,
  showCostTable:      true,
  showTermsBlock:     true,
  showSignatureBlock: true,
  showFooter:         true,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(val: string | null | undefined, prefix = ""): string {
  if (!val) return "—"
  const n = parseFloat(val)
  return isNaN(n)
    ? "—"
    : `${prefix}${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  })
}

const STATUS_CLASS: Record<string, string> = {
  DRAFT:     "bg-slate-100 text-slate-600 border-transparent",
  SENT:      "bg-blue-100 text-blue-700 border-transparent",
  SIGNED:    "bg-green-100 text-green-700 border-transparent",
  CANCELLED: "bg-red-100 text-red-700 border-transparent",
}

// ── Print styles ──────────────────────────────────────────────────────────────

const PRINT_STYLE = `
@media print {
  body > *:not(#contract-print-root) { display: none !important; }
  #contract-print-root > *:not(#contract-printable) { display: none !important; }
  #contract-printable {
    position: fixed !important;
    inset: 0 !important;
    z-index: 99999 !important;
    background: white !important;
    padding: 32px 40px !important;
    font-size: 11pt !important;
    color: #000 !important;
  }
  #contract-printable * { color: inherit !important; }
  .no-print { display: none !important; }
}
`

// ── Sub-components ────────────────────────────────────────────────────────────

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 text-xs">
      <span className="min-w-[130px] font-medium text-muted-foreground shrink-0">{label}:</span>
      <span>{value || "—"}</span>
    </div>
  )
}

function ContactLine({
  icon: Icon,
  value,
  accentColor,
}: {
  icon: React.ElementType
  value: string
  accentColor: string
}) {
  if (!value) return null
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <Icon className="size-3 shrink-0" style={{ color: accentColor }} />
      <span>{value}</span>
    </div>
  )
}

function CostRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <tr className={bold ? "font-semibold" : ""}>
      <td className="py-0.5 pr-6 text-sm whitespace-nowrap">{label}</td>
      <td className="py-0.5 text-right text-sm">{value}</td>
    </tr>
  )
}

// ── Document renderer ─────────────────────────────────────────────────────────

interface ContractDocProps {
  contract: Contract
  customer: Customer
  tpl: Omit<ContractTemplate, "id" | "createdAt" | "updatedAt">
  company: {
    name: string
    tagline: string
    logoUrl: string | null
    mobile: string
    email: string
    phone: string
    website: string
    whatsapp: string
    address: string
    footerText: string
  }
}

function ContractDocument({ contract, customer, tpl, company }: ContractDocProps) {
  const contact = customer.primaryContact

  const lineItemCost = parseFloat(contract.lineItemCost)
  const taxPercent   = parseFloat(contract.taxPercent)
  const totalAmount  = lineItemCost
  const taxAmount    = totalAmount * (taxPercent / 100)
  const grossTotal   = totalAmount + taxAmount

  const fs = tpl.fontSizeBase

  return (
    <div
      id="contract-printable"
      style={{
        backgroundColor: tpl.bodyBg,
        color: tpl.bodyTextColor,
        fontSize: `${fs}px`,
        lineHeight: 1.65,
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
      className="rounded-lg overflow-hidden"
    >

      {/* ══ 1. HEADER BAND ════════════════════════════════════════════ */}
      <div
        className="px-8 py-5"
        style={{ backgroundColor: tpl.headerBg, color: tpl.headerTextColor }}
      >
        <div
          className={`flex items-start gap-8 ${
            tpl.logoPosition === "center" ? "flex-col items-center text-center" : "justify-between"
          }`}
        >
          {/* Company identity */}
          <div className="flex flex-col gap-1">
            {company.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={company.logoUrl}
                alt={company.name}
                className="h-12 object-contain"
                style={tpl.logoPosition === "center" ? { margin: "0 auto" } : {}}
              />
            ) : (
              <div className="flex items-center gap-2">
                <Building2
                  className="size-6 shrink-0"
                  style={{ color: tpl.accentColor }}
                />
                <span style={{ fontSize: fs + 7, fontWeight: 700, letterSpacing: "-0.02em" }}>
                  {company.name || "Company Name"}
                </span>
              </div>
            )}
            {tpl.showTagline && company.tagline && (
              <span style={{ fontSize: fs - 1, opacity: 0.65 }}>{company.tagline}</span>
            )}
          </div>

          {/* Contact block */}
          <div className="flex flex-col gap-1.5">
            {tpl.showMobile   && <ContactLine icon={Smartphone}   value={company.mobile}   accentColor={tpl.accentColor} />}
            {tpl.showEmail    && <ContactLine icon={Mail}          value={company.email}    accentColor={tpl.accentColor} />}
            {tpl.showPhone    && <ContactLine icon={Phone}         value={company.phone}    accentColor={tpl.accentColor} />}
            {tpl.showWebsite  && <ContactLine icon={Globe}         value={company.website}  accentColor={tpl.accentColor} />}
            {tpl.showWhatsapp && <ContactLine icon={MessageCircle} value={company.whatsapp} accentColor={tpl.accentColor} />}
            {tpl.showAddress  && <ContactLine icon={MapPin}        value={company.address}  accentColor={tpl.accentColor} />}
          </div>

          {/* Invoice meta */}
          <div
            className="flex flex-col gap-1 rounded-lg px-4 py-3 shrink-0"
            style={{ border: `1px solid ${tpl.borderColor}`, minWidth: 200 }}
          >
            <p
              className="font-semibold mb-1"
              style={{ fontSize: fs - 2, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.06em" }}
            >
              Contract details
            </p>
            <MetaRow label="Invoice date"       value={fmtDate(contract.invoiceDate)} />
            <MetaRow label="Invoice #"          value={contract.invoiceNumber} />
            <MetaRow label="Order ID"           value={contract.orderId} />
            <MetaRow label="Activation limit"   value={contract.activationLimit} />
            <MetaRow label="Activation process" value={contract.activationProcess} />
            <MetaRow label="Payment terms"      value={contract.paymentTerms} />
          </div>
        </div>
      </div>

      <div className="px-8 py-6 flex flex-col gap-5">

        {/* ══ 2. CUSTOMER INFORMATION ══════════════════════════════════ */}
        {tpl.showCustomerBlock && (
          <div
            className="rounded-lg px-5 py-3"
            style={{ border: `1px solid ${tpl.borderColor}` }}
          >
            <p
              className="font-semibold mb-2"
              style={{ fontSize: fs - 2, color: tpl.accentColor, textTransform: "uppercase", letterSpacing: "0.06em" }}
            >
              Customer information
            </p>
            <div className="grid grid-cols-2 gap-x-10 gap-y-1">
              <MetaRow label="Company"  value={customer.companyName} />
              <MetaRow label="Address"  value={customer.address} />
              <MetaRow label="Contact"  value={contact?.name} />
              <MetaRow label="Email"    value={contact?.email} />
              <MetaRow label="Mobile"   value={contact?.phone} />
            </div>
          </div>
        )}

        {/* ══ 3. PROJECT + COST TABLE ══════════════════════════════════ */}
        {tpl.showCostTable && (
          <div>
            <p
              className="font-semibold mb-2"
              style={{ fontSize: fs - 2, color: tpl.accentColor, textTransform: "uppercase", letterSpacing: "0.06em" }}
            >
              Project description &amp; cost
            </p>
            <table
              className="w-full rounded-lg overflow-hidden"
              style={{ border: `1px solid ${tpl.borderColor}` }}
            >
              <thead>
                <tr style={{ backgroundColor: tpl.accentColor + "14", textAlign: "left" }}>
                  <th
                    className="px-4 py-2 w-3/4"
                    style={{ fontSize: fs - 2, textTransform: "uppercase", letterSpacing: "0.06em" }}
                  >
                    Description
                  </th>
                  <th
                    className="px-4 py-2 text-right"
                    style={{ fontSize: fs - 2, textTransform: "uppercase", letterSpacing: "0.06em" }}
                  >
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderTop: `1px solid ${tpl.borderColor}` }}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{contract.projectDescription}</p>
                    {contract.projectDescLine && (
                      <p className="mt-0.5 opacity-60" style={{ fontSize: fs - 2 }}>
                        {contract.projectDescLine}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right align-top font-medium">
                    {fmt(contract.lineItemCost, "$")}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr style={{ borderTop: `1px solid ${tpl.borderColor}`, backgroundColor: tpl.accentColor + "08" }}>
                  <td className="px-4 py-2" colSpan={2}>
                    <table className="ml-auto">
                      <tbody>
                        <CostRow
                          label="Total amount"
                          value={`$${totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                        />
                        <CostRow
                          label={`Tax (GOV-TAX-${taxPercent}%)`}
                          value={`$${taxAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                        />
                        <CostRow
                          label="Gross total"
                          value={`$${grossTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                          bold
                        />
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* ══ 4. TERMS & ACCEPTANCE ════════════════════════════════════ */}
        {tpl.showTermsBlock && (
          <div
            className="rounded-lg px-5 py-4"
            style={{ border: `2px solid ${tpl.borderColor}` }}
          >
            <p
              className="font-semibold mb-2"
              style={{ fontSize: fs - 2, color: tpl.accentColor, textTransform: "uppercase", letterSpacing: "0.06em" }}
            >
              Terms &amp; acceptance
            </p>
            <div
              className="whitespace-pre-wrap leading-relaxed opacity-85"
              style={{ fontSize: fs - 1 }}
            >
              {contract.termsAndConditions}
            </div>
          </div>
        )}

        {/* ══ 5. SIGNATURE LINE ════════════════════════════════════════ */}
        {tpl.showSignatureBlock && (
          <div className="flex items-end gap-8 pt-1">
            <div className="flex-1">
              <div
                className="h-10 mb-1"
                style={{ borderBottom: `1px dashed ${tpl.borderColor}` }}
              />
              <p style={{ fontSize: fs - 2, opacity: 0.55 }}>
                Customer signature
                {contract.signedByName ? ` — ${contract.signedByName}` : ""}
              </p>
            </div>
            <div className="flex-1">
              <div
                className="h-10 flex items-end pb-1 mb-1"
                style={{ borderBottom: `1px dashed ${tpl.borderColor}` }}
              >
                {contract.signedAt && (
                  <span className="font-medium" style={{ fontSize: fs - 1 }}>
                    {fmtDate(contract.signedAt)}
                  </span>
                )}
              </div>
              <p style={{ fontSize: fs - 2, opacity: 0.55 }}>Date</p>
            </div>
            <div className="flex-1">
              <div
                className="h-10 mb-1"
                style={{ borderBottom: `1px dashed ${tpl.borderColor}` }}
              />
              <p style={{ fontSize: fs - 2, opacity: 0.55 }}>Company representative</p>
            </div>
          </div>
        )}

        {/* ══ 6. FOOTER ════════════════════════════════════════════════ */}
        {tpl.showFooter && (
          <>
            <Separator />
            <div className="flex items-center justify-between">
              <p style={{ fontSize: fs - 2, opacity: 0.45 }}>
                {company.footerText || `${company.name} · ${company.website}`}
              </p>
              <p style={{ fontSize: fs - 2, opacity: 0.45 }}>
                Contract #{contract.id} · Generated {fmtDate(contract.createdAt)}
              </p>
            </div>
          </>
        )}

      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface ContractPreviewProps {
  contract: Contract
  customer: Customer
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: () => void
}

export function ContractPreview({
  contract,
  customer,
  open,
  onOpenChange,
  onEdit,
}: ContractPreviewProps) {
  const deleteMut   = useDeleteContractMutation()
  const { data: companyData }  = useCompanySettingsQuery()
  const { data: templateData } = useDefaultTemplateQuery()

  // Resolve template — use saved default or fall back
  const tpl: Omit<ContractTemplate, "id" | "createdAt" | "updatedAt"> =
    templateData ?? FALLBACK_TPL

  // Resolved company — use saved or placeholder
  const company = {
    name:       companyData?.name       ?? "Company Name",
    tagline:    companyData?.tagline    ?? "",
    logoUrl:    companyData?.logoUrl    ?? null,
    mobile:     companyData?.mobile     ?? "",
    email:      companyData?.email      ?? "",
    phone:      companyData?.phone      ?? "",
    website:    companyData?.website    ?? "",
    whatsapp:   companyData?.whatsapp   ?? "",
    address:    companyData?.address    ?? "",
    footerText: companyData?.footerText ?? "",
  }

  // Inject / remove print styles
  React.useEffect(() => {
    if (!open) return
    const style = document.createElement("style")
    style.id    = "contract-print-styles"
    style.innerHTML = PRINT_STYLE
    document.head.appendChild(style)
    return () => document.getElementById("contract-print-styles")?.remove()
  }, [open])

  function handleDelete() {
    if (!window.confirm(`Delete this contract for ${customer.companyName}? This cannot be undone.`))
      return
    deleteMut.mutate(contract.id, { onSuccess: () => onOpenChange(false) })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        id="contract-print-root"
        showCloseButton={false}
        className="max-w-5xl w-[calc(100vw-2rem)] h-[94vh] flex flex-col gap-0 p-0 overflow-hidden"
      >
        {/* ── Toolbar (hidden on print) ────────────────────────────── */}
        <DialogHeader className="no-print flex-row items-center justify-between gap-3 border-b px-5 py-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <DialogTitle className="text-sm font-medium leading-none">
              Contract — {customer.companyName}
            </DialogTitle>
            <Badge
              className={`text-[10px] px-1.5 py-0.5 h-auto ${STATUS_CLASS[contract.status] ?? ""}`}
            >
              {contract.status}
            </Badge>
          </div>

          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" onClick={onEdit} className="gap-1.5">
              <Pencil className="size-3.5" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
              disabled={deleteMut.isPending}
              onClick={handleDelete}
            >
              {deleteMut.isPending
                ? <Loader2 className="size-3.5 animate-spin" />
                : <Trash2 className="size-3.5" />}
              Delete
            </Button>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => window.print()}
            >
              <Printer className="size-3.5" />
              Print / PDF
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Close preview"
              onClick={() => onOpenChange(false)}
            >
              <X className="size-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* ── Scrollable document ──────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto bg-muted/30 p-4 md:p-6">
          <div className="mx-auto max-w-[860px] shadow-sm ring-1 ring-black/8 rounded-lg overflow-hidden bg-white">
            <ContractDocument
              contract={contract}
              customer={customer}
              tpl={tpl}
              company={company}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
