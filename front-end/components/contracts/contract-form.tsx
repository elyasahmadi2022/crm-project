"use client"

/**
 * components/contracts/contract-form.tsx
 *
 * Sheet-based form for creating or editing a contract.
 * Sections mirror the physical document layout:
 *   1. Invoice meta  (right-side header block)
 *   2. Project / cost table
 *   3. Terms & conditions paragraph
 *   4. Signature line
 */

import * as React from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button }   from "@/components/ui/button"
import { Input }    from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  useCreateContractMutation,
  useUpdateContractMutation,
} from "@/queries/contract.queries"
import type { Contract } from "@/services/contract.service"
import type { Customer } from "@/services/customer.service"

// ── Schema ────────────────────────────────────────────────────────────────────
const schema = z.object({
  // Invoice meta
  invoiceDate:       z.string().optional(),
  invoiceNumber:     z.string().optional(),
  orderId:           z.string().optional(),
  activationLimit:   z.string().optional(),
  activationProcess: z.string().optional(),
  paymentTerms:      z.string().optional(),

  // Project / cost
  projectDescription: z.string().min(1, "Project description is required."),
  projectDescLine:    z.string().optional(),
  lineItemCost:       z.coerce.number().min(0).default(0),
  taxPercent:         z.coerce.number().min(0).max(100).default(0),

  // Terms
  termsAndConditions: z.string().min(1, "Terms and conditions are required."),

  // Signature
  signedByName: z.string().optional(),
  signedAt:     z.string().optional(),

  status: z.enum(["DRAFT", "SENT", "SIGNED", "CANCELLED"] as const).default("DRAFT"),
})
type FormValues = z.infer<typeof schema>

// ── Default terms template ────────────────────────────────────────────────────
const DEFAULT_TERMS = `By signing this contract, the Customer acknowledges and agrees to the following:

1. SERVICE DESCRIPTION: The Company agrees to provide the services described above ("Project Description") in accordance with the specifications and requirements set forth herein.

2. PAYMENT TERMS: The Customer agrees to pay the Gross Total amount as specified above. Payment is due within the period stated in the Payment Terms field. Late payments may incur a penalty charge.

3. ACTIVATION & LICENSING: The license granted under this agreement is non-transferable and is valid for the Activation Limit period stated above. Renewal terms shall be agreed upon in writing prior to expiration.

4. INTELLECTUAL PROPERTY: All deliverables produced under this agreement remain the property of the Company until full payment is received, at which point ownership transfers to the Customer.

5. CONFIDENTIALITY: Both parties agree to keep all confidential information received from the other party strictly private and not to disclose it to any third party without prior written consent.

6. LIMITATION OF LIABILITY: The Company's total liability under this agreement shall not exceed the total amount paid by the Customer for the services rendered.

7. GOVERNING LAW: This agreement shall be governed by and construed in accordance with applicable laws.

The Customer confirms they have read, understood, and agree to all terms and conditions stated in this contract.`

// ── Helper ────────────────────────────────────────────────────────────────────
function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-destructive">{message}</p>
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface ContractFormProps {
  customer: Customer
  initial?: Contract
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ── Component ─────────────────────────────────────────────────────────────────
export function ContractForm({ customer, initial, open, onOpenChange }: ContractFormProps) {
  const isEdit       = !!initial
  const createMut    = useCreateContractMutation()
  const updateMut    = useUpdateContractMutation()
  const isPending    = createMut.isPending || updateMut.isPending

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      invoiceDate:        initial?.invoiceDate        ?? "",
      invoiceNumber:      initial?.invoiceNumber      ?? "",
      orderId:            initial?.orderId            ?? "",
      activationLimit:    initial?.activationLimit    ?? "",
      activationProcess:  initial?.activationProcess  ?? "",
      paymentTerms:       initial?.paymentTerms       ?? "Net 30",
      projectDescription: initial?.projectDescription ?? "",
      projectDescLine:    initial?.projectDescLine    ?? "",
      lineItemCost:       initial ? parseFloat(initial.lineItemCost) : 0,
      taxPercent:         initial ? parseFloat(initial.taxPercent)   : 2,
      termsAndConditions: initial?.termsAndConditions ?? DEFAULT_TERMS,
      signedByName:       initial?.signedByName       ?? "",
      signedAt:           initial?.signedAt
        ? new Date(initial.signedAt).toISOString().split("T")[0]
        : "",
      status: initial?.status ?? "DRAFT",
    },
    mode: "onTouched",
  })

  // Live cost preview
  const lineItemCost = watch("lineItemCost") ?? 0
  const taxPercent   = watch("taxPercent")   ?? 0
  const totalAmount  = Number(lineItemCost)
  const grossTotal   = totalAmount + totalAmount * (Number(taxPercent) / 100)

  function onSubmit(values: FormValues) {
    const close = () => onOpenChange(false)
    if (isEdit) {
      updateMut.mutate(
        { id: initial.id, dto: { ...values, lineItemCost: values.lineItemCost, taxPercent: values.taxPercent } },
        { onSuccess: close },
      )
    } else {
      createMut.mutate(
        {
          customerId: customer.id,
          ...values,
        },
        { onSuccess: close },
      )
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full max-w-2xl flex flex-col overflow-hidden p-0"
        showCloseButton
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <SheetTitle>
            {isEdit ? "Edit contract" : "New contract"}
          </SheetTitle>
          <SheetDescription>
            {customer.companyName}
            {customer.primaryContact?.name ? ` · ${customer.primaryContact.name}` : ""}
          </SheetDescription>
        </SheetHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <form id="contract-form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="flex flex-col gap-6">

              {/* ── 1. Invoice meta ─────────────────────────────────────── */}
              <div className="flex flex-col gap-3">
                <SectionLabel>Invoice information</SectionLabel>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">Invoice date</label>
                    <Input type="date" {...register("invoiceDate")} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">Invoice #</label>
                    <Input placeholder="INV-001" {...register("invoiceNumber")} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">Order ID</label>
                    <Input placeholder="ORD-001" {...register("orderId")} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">Activation limit</label>
                    <Input placeholder="e.g. 1 year" {...register("activationLimit")} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">Activation process</label>
                    <Input placeholder="e.g. Online activation" {...register("activationProcess")} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">Payment terms</label>
                    <Input placeholder="Net 30" {...register("paymentTerms")} />
                  </div>
                </div>
              </div>

              <Separator />

              {/* ── 2. Project / cost ───────────────────────────────────── */}
              <div className="flex flex-col gap-3">
                <SectionLabel>Project description &amp; cost</SectionLabel>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">
                    Project / product name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="e.g. Enterprise CRM License"
                    aria-invalid={!!errors.projectDescription}
                    {...register("projectDescription")}
                  />
                  <FieldError message={errors.projectDescription?.message} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Description subtitle</label>
                  <Input
                    placeholder="e.g. Annual subscription · includes onboarding"
                    {...register("projectDescLine")}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">Cost (before tax)</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      {...register("lineItemCost")}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">Tax %</label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      placeholder="2"
                      {...register("taxPercent")}
                    />
                  </div>
                </div>

                {/* Live cost summary */}
                <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Total amount</span>
                    <span className="font-medium text-foreground">
                      ${totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground mt-1">
                    <span>Tax ({taxPercent}%)</span>
                    <span>
                      ${(grossTotal - totalAmount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex items-center justify-between font-semibold">
                    <span>Gross total</span>
                    <span>${grossTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* ── 3. Terms & conditions ───────────────────────────────── */}
              <div className="flex flex-col gap-3">
                <SectionLabel>Terms &amp; conditions</SectionLabel>
                <p className="text-xs text-muted-foreground">
                  This paragraph appears as the bordered terms block in the printed contract. Edit the clauses below to match the contract type.
                </p>
                <div className="flex flex-col gap-1.5">
                  <Textarea
                    rows={12}
                    placeholder="Enter the full terms and acceptance text…"
                    aria-invalid={!!errors.termsAndConditions}
                    className="min-h-56 resize-y font-mono text-xs leading-relaxed"
                    {...register("termsAndConditions")}
                  />
                  <FieldError message={errors.termsAndConditions?.message} />
                </div>
              </div>

              <Separator />

              {/* ── 4. Signature & status ───────────────────────────────── */}
              <div className="flex flex-col gap-3">
                <SectionLabel>Signature &amp; status</SectionLabel>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">Signed by (customer name)</label>
                    <Input placeholder="Customer representative name" {...register("signedByName")} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">Date signed</label>
                    <Input type="date" {...register("signedAt")} />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Contract status</label>
                  <Controller
                    control={control}
                    name="status"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue>
                            {field.value === "DRAFT"     ? "Draft"
                             : field.value === "SENT"    ? "Sent"
                             : field.value === "SIGNED"  ? "Signed"
                             : "Cancelled"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DRAFT">Draft</SelectItem>
                          <SelectItem value="SENT">Sent</SelectItem>
                          <SelectItem value="SIGNED">Signed</SelectItem>
                          <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

            </div>
          </form>
        </div>

        {/* Footer stays at the bottom */}
        <SheetFooter className="px-6 py-4 border-t bg-muted/50 shrink-0">
          <Button
            type="submit"
            form="contract-form"
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            {isPending && <Loader2 className="size-3.5 animate-spin" />}
            {isPending ? "Saving…" : isEdit ? "Save changes" : "Create contract"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
