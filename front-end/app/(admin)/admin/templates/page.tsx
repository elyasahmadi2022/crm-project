"use client"

import * as React from "react"
import {
  Undo2, Redo2, Grid3x3, Eye, Printer, Upload, RotateCcw, Save,
  Trash2, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Group, Ungroup, Image as ImgIcon, Type, Hash, User, Building2,
  DollarSign, Calendar, CreditCard, Minus, FileText, Phone, Mail,
  Globe, MapPin, QrCode, Signature, StickyNote, X, Palette, Loader2, Plus,
} from "lucide-react"
import { Button }    from "@/components/ui/button"
import { Input }     from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Label }     from "@/components/ui/label"
import { Slider }    from "@/components/ui/slider"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  useContractTemplatesQuery,
  useCreateTemplateMutation,
  useUpdateTemplateMutation,
  useSaveLayoutMutation,
  useDeleteTemplateMutation,
  useSetDefaultTemplateMutation,
} from "@/queries/company.queries"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type PaperSize = "A4" | "LETTER" | "A5"
type ResizeHandle = "nw"|"n"|"ne"|"e"|"se"|"s"|"sw"|"w"

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

interface PageStyle { bgColor: string; bgImage?: string }

// ─────────────────────────────────────────────────────────────────────────────
// Constants (module-level — never recreated)
// ─────────────────────────────────────────────────────────────────────────────

const PAPER: Record<PaperSize,{w:number;h:number;label:string}> = {
  A4:     {w:595,h:842,label:"A4 · 210×297 mm"},
  LETTER: {w:612,h:792,label:"Letter · 8.5×11 in"},
  A5:     {w:420,h:595,label:"A5 · 148×210 mm"},
}

const FIELDS: {type:FieldType;label:string;icon:React.ElementType;section:string}[] = [
  {type:"company-logo",       label:"Company Logo",       icon:ImgIcon,    section:"Company"},
  {type:"company-name",       label:"Company Name",       icon:Building2,  section:"Company"},
  {type:"company-tagline",    label:"Tagline",            icon:Type,       section:"Company"},
  {type:"company-phone",      label:"Phone",              icon:Phone,      section:"Company"},
  {type:"company-email",      label:"Email",              icon:Mail,       section:"Company"},
  {type:"company-website",    label:"Website",            icon:Globe,      section:"Company"},
  {type:"company-address",    label:"Address",            icon:MapPin,     section:"Company"},
  {type:"invoice-title",      label:"INVOICE Title",      icon:FileText,   section:"Invoice"},
  {type:"invoice-date",       label:"Invoice Date",       icon:Calendar,   section:"Invoice"},
  {type:"invoice-number",     label:"Invoice #",          icon:Hash,       section:"Invoice"},
  {type:"order-id",           label:"Order ID",           icon:Hash,       section:"Invoice"},
  {type:"installation-limit", label:"Installation Limit", icon:Type,       section:"Invoice"},
  {type:"activation-process", label:"Activation Process", icon:Type,       section:"Invoice"},
  {type:"payment-terms",      label:"Payment Terms",      icon:CreditCard, section:"Invoice"},
  {type:"customer-block",     label:"Customer Block",     icon:User,       section:"Customer"},
  {type:"items-table",        label:"Items Table",        icon:FileText,   section:"Table"},
  {type:"project-description", label:"Project Description", icon:StickyNote, section:"Table"},
  {type:"subtotal",           label:"Subtotal",           icon:DollarSign, section:"Table"},
  {type:"tax-line",           label:"Tax Line",           icon:DollarSign, section:"Table"},
  {type:"grand-total",        label:"Grand Total",        icon:DollarSign, section:"Table"},
  {type:"contract-text",      label:"Contract / Terms",   icon:StickyNote, section:"Contract"},
  {type:"signature-block",    label:"Signature Block",    icon:Signature,  section:"Contract"},
  {type:"divider",            label:"Divider Line",       icon:Minus,      section:"Layout"},
  {type:"custom-text",        label:"Custom Text",        icon:Type,       section:"Layout"},
  {type:"qr-code",            label:"QR Code",            icon:QrCode,     section:"Layout"},
]
const SECTIONS = ["Company","Invoice","Customer","Table","Contract","Layout"]

const PH: Record<FieldType,string> = {
  "company-logo":"Logo","company-name":"FastBooks ERP Solutions",
  "company-tagline":"Business Accounting ERP","company-phone":"+93 (0) 707 00 3785",
  "company-email":"info@fastbooks.info","company-website":"www.fastbooks.info",
  "company-address":"Shahr-e-naw, Kabul Afghanistan",
  "invoice-title":"INVOICE","invoice-date":"Saturday, 11 July 2026",
  "invoice-number":"10384","order-id":"11343",
  "installation-limit":"1 Active License","activation-process":"6-24 Hours After Payment",
  "payment-terms":"Advanced","customer-block":"Invoice To:\nCompany\nContact\nAddress",
  "items-table":"Items table","project-description":"Project description goes here...",
  "subtotal":"Total Amount: 11,000.00 AFN",
  "tax-line":"GOV.TAX 2%: 220.00 AFN","grand-total":"Gross Total: 11,220.00 AFN",
  "contract-text":"Terms & Conditions\n\n1. Payment is due within specified terms.\n2. License is non-transferable.\n3. Support for duration specified.\n4. Disputes resolved under local law.",
  "signature-block":"Signature / Date","divider":"","custom-text":"Custom text","qr-code":"QR",
}

const HANDLE_DIRS: ResizeHandle[] = ["nw","n","ne","e","se","s","sw","w"]

function handleCss(h:ResizeHandle):React.CSSProperties{
  const c="50%",e0=-4
  const pos:Record<ResizeHandle,React.CSSProperties>={
    nw:{top:e0,left:e0},n:{top:e0,left:c},
    ne:{top:e0,right:0,left:"auto"},e:{top:c,right:0,left:"auto"},
    se:{bottom:e0,right:0,left:"auto",top:"auto"},
    s:{bottom:e0,left:c,top:"auto"},
    sw:{bottom:e0,left:e0,top:"auto"},
    w:{top:c,left:e0},
  }
  const cur:Record<ResizeHandle,string>={
    nw:"nw-resize",n:"n-resize",ne:"ne-resize",e:"e-resize",
    se:"se-resize",s:"s-resize",sw:"sw-resize",w:"w-resize",
  }
  return{position:"absolute",width:8,height:8,background:"#3b82f6",
    border:"1px solid #fff",borderRadius:2,transform:"translate(-50%,-50%)",
    cursor:cur[h],zIndex:20,...pos[h]}
}

function uid(){return`el-${Date.now()}-${Math.random().toString(36).slice(2,7)}`}

// ─────────────────────────────────────────────────────────────────────────────
// Default layout
// ─────────────────────────────────────────────────────────────────────────────

function defaultElements():CanvasElement[]{
  const base:Omit<CanvasElement,"id">={
    type:"custom-text",x:0,y:0,width:100,height:30,
    fontSize:11,fontWeight:"normal",fontStyle:"normal",
    textDecoration:"none",textAlign:"left",color:"#111827",bgColor:"transparent",
  }
  function el(type:FieldType,x:number,y:number,w:number,h:number,
    ov:Partial<CanvasElement>={},groupId?:string):CanvasElement{
    return{...base,id:`${type}-${Math.random().toString(36).slice(2,7)}`,
      type,x,y,width:w,height:h,groupId,placeholder:PH[type],...ov}
  }
  const hg="grp-header"
  return[
    el("company-logo",   20, 18, 70, 60,{bgColor:"#f3f4f6"},hg),
    el("company-name",   96, 18,200, 22,{fontSize:14,fontWeight:"bold"},hg),
    el("company-tagline",96, 42,200, 16,{fontSize:9,color:"#6b7280"},hg),
    el("company-phone",  96, 60,200, 14,{fontSize:9},hg),
    el("company-email",  96, 76,200, 14,{fontSize:9},hg),
    el("company-website",96, 92,200, 14,{fontSize:9},hg),
    el("company-address",96,108,200, 14,{fontSize:9},hg),
    el("invoice-title", 420, 18,155, 30,{fontSize:22,fontWeight:"bold",textAlign:"right",color:"#1e293b"}),
    el("invoice-date",  340, 58,220, 16,{fontSize:9}),
    el("invoice-number",340, 76,220, 16,{fontSize:9}),
    el("order-id",      340, 94,220, 16,{fontSize:9}),
    el("installation-limit",340,112,220,16,{fontSize:9}),
    el("activation-process",340,130,220,16,{fontSize:9}),
    el("payment-terms", 340,148,220, 16,{fontSize:9}),
    el("divider",        20,170,550,  2,{bgColor:"#1e293b",color:"#1e293b"}),
    el("customer-block", 20,182,240, 80,{fontSize:10}),
    el("items-table",    20,278,550,120,{fontSize:10,bgColor:"#f8fafc"}),
    el("subtotal",      360,408,210, 18,{fontSize:10,textAlign:"right"}),
    el("tax-line",      360,428,210, 18,{fontSize:10,textAlign:"right",color:"#6b7280"}),
    el("grand-total",   360,448,210, 22,{fontSize:11,fontWeight:"bold",textAlign:"right",bgColor:"#1e293b",color:"#ffffff"}),
    el("divider",        20,480,550,  1,{bgColor:"#e5e7eb",color:"#e5e7eb"}),
    el("contract-text",  20,492,380,240,{fontSize:9,color:"#374151",text:PH["contract-text"]}),
    el("signature-block",20,748,260, 50,{fontSize:10}),
    el("qr-code",       480,700, 90, 90,{bgColor:"#f3f4f6"}),
  ]
}

// ─────────────────────────────────────────────────────────────────────────────
// Print helper
// ─────────────────────────────────────────────────────────────────────────────

function printCanvas(canvasEl:HTMLDivElement|null,paper:{w:number;h:number}){
  if(!canvasEl)return
  const win=window.open("","_blank","width=800,height=900")
  if(!win)return
  win.document.write(`<!DOCTYPE html><html><head><title>Print</title>
  <style>@page{size:${paper.w}px ${paper.h}px;margin:0}body{margin:0;padding:0}
  .page{position:relative;width:${paper.w}px;height:${paper.h}px;background:#fff;overflow:hidden}
  *{box-sizing:border-box}</style></head><body>
  <div class="page">${canvasEl.innerHTML}</div>
  <script>window.onload=()=>{window.print();window.close()}<\/script></body></html>`)
  win.document.close()
}

// ─────────────────────────────────────────────────────────────────────────────
// ElementContent — pure display (module-level, stable reference)
// ─────────────────────────────────────────────────────────────────────────────

function ElementContent({el}:{el:CanvasElement}){
  const content=el.text??el.placeholder??""
  if(el.type==="company-logo")return(
    <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",
      justifyContent:"center",background:el.bgColor||"#f3f4f6",borderRadius:4,
      fontSize:10,color:"#9ca3af",fontWeight:"normal"}}>Logo</div>)
  if(el.type==="qr-code")return(
    <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"center",background:el.bgColor||"#f3f4f6",
      borderRadius:4,gap:2}}>
      <QrCode size={Math.min(el.width,el.height)*0.55} color="#374151"/>
      <span style={{fontSize:8,color:"#6b7280"}}>QR Code</span></div>)
  if(el.type==="divider")return(
    <div style={{width:"100%",height:"100%",background:el.bgColor||"#374151"}}/>)
  if(el.type==="items-table")return(
    <div style={{width:"100%",height:"100%",overflow:"hidden"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:el.fontSize}}>
        <thead><tr style={{background:"#1e293b",color:"#fff"}}>
          {["Project Description","Cost"].map(h=>(
            <th key={h} style={{padding:"4px 8px",textAlign:"left",fontSize:el.fontSize-1}}>{h}</th>))}
        </tr></thead>
        <tbody>{[
          ["FastBooks Business Accounting ERP","11,000.00 AFN"],
          ["Online Hosting Server & System Installation","Free/First year"],
        ].map(([d,c],i)=>(
          <tr key={i} style={{background:i%2===0?"#f8fafc":"#fff"}}>
            <td style={{padding:"3px 8px",borderBottom:"1px solid #e5e7eb"}}>{d}</td>
            <td style={{padding:"3px 8px",borderBottom:"1px solid #e5e7eb",textAlign:"right",whiteSpace:"nowrap"}}>{c}</td>
          </tr>))}</tbody>
      </table></div>)
  if(el.type==="customer-block")return(
    <div style={{width:"100%",height:"100%",fontSize:el.fontSize,padding:"4px 6px",overflow:"hidden"}}>
      <div style={{fontSize:el.fontSize-1,color:"#6b7280",marginBottom:2}}>Invoice To:</div>
      <div style={{fontWeight:"bold",marginBottom:1}}>Mr. Abdullah</div>
      <div style={{marginBottom:1}}>Kabul, Afghanistan</div>
      <div style={{color:"#6b7280"}}>Mobile: +93 (0) 799 000 000</div></div>)
  if(el.type==="signature-block")return(
    <div style={{width:"100%",height:"100%",fontSize:el.fontSize,padding:"4px 6px"}}>
      <div style={{borderTop:"1px solid #374151",paddingTop:4,marginTop:8}}>Authorized Signature</div>
      <div style={{marginTop:16,borderTop:"1px solid #374151",paddingTop:4}}>Date</div></div>)
  if(el.type==="contract-text")return(
    <div style={{width:"100%",height:"100%",fontSize:el.fontSize,padding:"4px 6px",
      overflow:"hidden",whiteSpace:"pre-wrap",lineHeight:1.5,color:el.color}}>{content}</div>)
  return(
    <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",
      padding:"2px 6px",overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>{content}</div>)
}

// ─────────────────────────────────────────────────────────────────────────────
// ElementProps — stable module-level component
// All callbacks passed as props so they never cause remounts
// ─────────────────────────────────────────────────────────────────────────────

interface ElementPropsProps {
  el:           CanvasElement
  onUpdate:     (id:string, patch:Partial<CanvasElement>)=>void
  onDelete?:    (id:string)=>void
  onLogoClick:  ()=>void
  showPosition: boolean
}

function ElementProps({el,onUpdate,onDelete,onLogoClick,showPosition}:ElementPropsProps){
  const p=(patch:Partial<CanvasElement>)=>onUpdate(el.id,patch)
  const imgSrc=el.type==="company-logo"&&el.text?.startsWith("data:")?el.text:null

  return(
    <div className="flex flex-col gap-3">
      {/* Position & Size */}
      {showPosition&&(
        <div className="grid grid-cols-2 gap-2">
          {(["x","y","width","height"] as const).map(key=>(
            <div key={key}>
              <Label className="text-[10px] text-muted-foreground capitalize">{key}</Label>
              <Input type="number" value={Math.round(el[key])}
                onChange={e=>p({[key]:Number(e.target.value)||0})}
                className="h-7 text-xs mt-0.5"/>
            </div>))}
        </div>)}

      {/* Editable text */}
      {(el.type==="custom-text"||el.type==="contract-text")&&(
        <div className="flex flex-col gap-1">
          <Label className="text-[10px] text-muted-foreground">
            {el.type==="contract-text"?"Contract / Terms":"Content"}
          </Label>
          <textarea value={el.text??""}
            onChange={e=>p({text:e.target.value})}
            rows={el.type==="contract-text"?5:2}
            className="w-full rounded-md border bg-background px-2 py-1.5 text-xs resize-y focus:outline-none focus:ring-1 focus:ring-ring"/>
        </div>)}

      {/* Generic placeholder text for non-editable fields */}
      {el.type!=="custom-text"&&el.type!=="contract-text"&&
        el.type!=="company-logo"&&el.type!=="qr-code"&&
        el.type!=="divider"&&el.type!=="items-table"&&
        el.type!=="customer-block"&&el.type!=="signature-block"&&(
        <div className="flex flex-col gap-1">
          <Label className="text-[10px] text-muted-foreground">Display text</Label>
          <Input value={el.text??el.placeholder??""}
            onChange={e=>p({text:e.target.value})}
            className="h-7 text-xs"/>
        </div>)}

      {/* Logo upload */}
      {el.type==="company-logo"&&(
        <div className="flex flex-col gap-1.5">
          <Label className="text-[10px] text-muted-foreground">Logo Image</Label>
          {imgSrc?(
            <div className="flex flex-col gap-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imgSrc} alt="logo" className="max-h-12 object-contain rounded border"/>
              <Button variant="outline" size="sm" className="gap-1 h-7 text-xs"
                onClick={()=>p({text:undefined})}><X className="size-3"/>Remove</Button>
            </div>):(
            <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs"
              onClick={onLogoClick}><Upload className="size-3.5"/>Upload Logo</Button>)}
        </div>)}

      {/* Editable Label/Placeholder for all text fields */}
      {el.type!=="company-logo"&&el.type!=="qr-code"&&el.type!=="divider"&&(
        <div className="flex flex-col gap-1">
          <Label htmlFor={`label-${el.id}`} className="text-[10px] text-muted-foreground">
            {el.type==="custom-text"||el.type==="contract-text"?"Text Content":"Label/Placeholder"}
          </Label>
          <Input
            id={`label-${el.id}`}
            value={el.placeholder||""}
            onChange={e=>p({placeholder:e.target.value})}
            className="h-7 text-xs"
            placeholder={`Enter ${el.type} label...`}
          />
        </div>
      )}

      {/* Divider color */}
      {el.type==="divider"&&(
        <div className="flex flex-col gap-1">
          <Label className="text-[10px] text-muted-foreground">Line Color</Label>
          <div className="flex gap-2">
            <input type="color" value={el.bgColor||"#374151"}
              onChange={e=>p({bgColor:e.target.value,color:e.target.value})}
              className="size-7 rounded border cursor-pointer p-0.5"/>
            <Input value={el.bgColor||"#374151"}
              onChange={e=>p({bgColor:e.target.value})}
              className="h-7 text-xs font-mono flex-1" maxLength={7}/>
          </div></div>)}

      {/* Typography */}
      {el.type!=="divider"&&el.type!=="company-logo"&&el.type!=="qr-code"&&(
        <div className="flex flex-col gap-2.5">
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-[10px] text-muted-foreground">Font size</Label>
              <span className="text-[10px] text-muted-foreground">{el.fontSize}px</span>
            </div>
            <Slider value={[el.fontSize]}
              onValueChange={v=>p({fontSize:Array.isArray(v)?(v as number[])[0]!:v as number})}
              min={6} max={72} step={1}/>
          </div>
          <div className="flex gap-1 flex-wrap">
            {[
              {icon:Bold,      k:"fontWeight",     on:"bold",      off:"normal",    active:el.fontWeight==="bold"},
              {icon:Italic,    k:"fontStyle",      on:"italic",    off:"normal",    active:el.fontStyle==="italic"},
              {icon:Underline, k:"textDecoration", on:"underline", off:"none",      active:el.textDecoration==="underline"},
            ].map(({icon:Icon,k,on,off,active})=>(
              <Button key={k} variant={active?"default":"outline"} size="icon-sm"
                onClick={()=>p({[k]:active?off:on} as Partial<CanvasElement>)}>
                <Icon className="size-3.5"/></Button>))}
            <div className="w-px bg-border mx-0.5"/>
            {([["left",AlignLeft],["center",AlignCenter],["right",AlignRight]] as const).map(([val,Icon])=>(
              <Button key={val} variant={el.textAlign===val?"default":"outline"} size="icon-sm"
                onClick={()=>p({textAlign:val})}>
                <Icon className="size-3.5"/></Button>))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px] text-muted-foreground">Text</Label>
              <div className="flex gap-1.5 mt-0.5">
                <input type="color" value={el.color}
                  onChange={e=>p({color:e.target.value})}
                  className="size-7 rounded border cursor-pointer p-0.5 shrink-0"/>
                <Input value={el.color} onChange={e=>p({color:e.target.value})}
                  className="h-7 text-[10px] font-mono" maxLength={7}/>
              </div></div>
            <div>
              <Label className="text-[10px] text-muted-foreground">Background</Label>
              <div className="flex gap-1.5 mt-0.5">
                <input type="color" value={el.bgColor||"#ffffff"}
                  onChange={e=>p({bgColor:e.target.value})}
                  className="size-7 rounded border cursor-pointer p-0.5 shrink-0"/>
                <Input value={el.bgColor||"transparent"}
                  onChange={e=>p({bgColor:e.target.value})}
                  className="h-7 text-[10px] font-mono" maxLength={7}/>
              </div></div>
          </div>
        </div>)}

      {onDelete&&(
        <Button variant="outline" size="sm"
          className="h-6 px-2 text-[10px] gap-1 text-destructive hover:text-destructive w-full mt-1"
          onClick={()=>onDelete(el.id)}>
          <Trash2 className="size-3"/>Remove from canvas</Button>)}
    </div>)
}

// ─────────────────────────────────────────────────────────────────────────────
// GroupMemberRow — stable module-level accordion row
// ─────────────────────────────────────────────────────────────────────────────

interface GroupRowProps {
  el:          CanvasElement
  isSelected:  boolean
  isExpanded:  boolean
  onToggle:    (id:string)=>void
  onUpdate:    (id:string,patch:Partial<CanvasElement>)=>void
  onDelete:    (id:string)=>void
  onLogoClick: ()=>void
}

function GroupMemberRow({el,isSelected,isExpanded,onToggle,onUpdate,onDelete,onLogoClick}:GroupRowProps){
  const fieldDef=FIELDS.find(f=>f.type===el.type)
  const FieldIcon=fieldDef?.icon??Type
  const label=fieldDef?.label??el.type
  return(
    <div className={`rounded-lg border ${isSelected?"border-blue-400 bg-blue-50/40 dark:bg-blue-950/20":"border-border bg-muted/20"}`}>
      <button type="button"
        className="w-full flex items-center gap-2 px-3 py-2 text-left"
        onClick={()=>onToggle(el.id)}>
        <div className="flex size-5 items-center justify-center rounded bg-primary/10 text-primary shrink-0">
          <FieldIcon className="size-3"/>
        </div>
        <span className="text-xs font-medium flex-1 truncate">{label}</span>
        <span className="text-[10px] text-muted-foreground">{isExpanded?"−":"+"}</span>
      </button>
      {isExpanded&&(
        <div className="px-3 pb-3 border-t pt-2.5">
          <ElementProps el={el} onUpdate={onUpdate} onDelete={onDelete}
            onLogoClick={onLogoClick} showPosition/>
        </div>)}
    </div>)
}

// ─────────────────────────────────────────────────────────────────────────────
// GroupPanel — shows all members of a group, each individually editable
// ─────────────────────────────────────────────────────────────────────────────

interface GroupPanelProps {
  members:      CanvasElement[]
  selectedIds:  Set<string>
  onUpdate:     (id:string,patch:Partial<CanvasElement>)=>void
  onDelete:     (id:string)=>void
  onUngroup:    ()=>void
  onDeleteAll:  ()=>void
  onLogoClick:  ()=>void
  onSelectOne:  (id:string)=>void
}

function GroupPanel({members,selectedIds,onUpdate,onDelete,onUngroup,onDeleteAll,onLogoClick,onSelectOne}:GroupPanelProps){
  const [expandedIds,setExpandedIds]=React.useState<Set<string>>(new Set())
  function toggle(id:string){
    const isOpening=!expandedIds.has(id)
    setExpandedIds(prev=>{
      const next=new Set(prev)
      if(next.has(id)){next.delete(id)}else{next.add(id)}
      return next
    })
    // call onSelectOne outside the state updater — never call parent setState during render
    if(isOpening) onSelectOne(id)
  }
  return(
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Group · {members.length} elements
        </Label>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]"
            onClick={()=>setExpandedIds(new Set(members.map(e=>e.id)))}>All</Button>
          <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]"
            onClick={()=>setExpandedIds(new Set())}>None</Button>
        </div>
      </div>
      {members.map(el=>(
        <GroupMemberRow key={el.id} el={el}
          isSelected={selectedIds.has(el.id)}
          isExpanded={expandedIds.has(el.id)}
          onToggle={toggle} onUpdate={onUpdate} onDelete={onDelete}
          onLogoClick={onLogoClick}/>))}
      <Separator/>
      <Button size="sm" variant="outline" className="gap-1.5" onClick={onUngroup}>
        <Ungroup className="size-3.5"/>Ungroup</Button>
      <Button variant="destructive" size="sm" className="gap-1.5" onClick={onDeleteAll}>
        <Trash2 className="size-3.5"/>Delete group ({members.length})</Button>
    </div>)
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function TemplateDesignerPage(){
  // ── API: load templates from backend ──────────────────────────────────
  const { data: apiTemplates = [], isLoading: tplLoading } = useContractTemplatesQuery()
  const createTplMut   = useCreateTemplateMutation()
  const updateTplMut   = useUpdateTemplateMutation()
  const saveLayoutMut  = useSaveLayoutMutation()
  const deleteTplMut   = useDeleteTemplateMutation()
  const setDefaultMut  = useSetDefaultTemplateMutation()

  // Track which template is currently open in the editor (by API id)
  const [activeTplId, setActiveTplId] = React.useState<number | null>(null)
  const [isSaving,    setIsSaving]    = React.useState(false)

  // When the template list loads, auto-select the default (or first) template
  React.useEffect(() => {
    if (apiTemplates.length === 0 || activeTplId !== null) return
    const def = apiTemplates.find(t => t.isDefault) ?? apiTemplates[0]
    if (def) loadTemplate(def.id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiTemplates])

  // Load a saved template by id — restore its canvas state from layoutJson
  function loadTemplate(id: number) {
    const tpl = apiTemplates.find(t => t.id === id)
    if (!tpl) return
    setActiveTplId(id)
    setTemplateName(tpl.name)
    if (tpl.layoutJson) {
      try {
        const saved = JSON.parse(tpl.layoutJson) as {
          version?: string
          templateName?: string
          paperSize?: PaperSize
          pageStyle?: PageStyle
          elements?: CanvasElement[]
        }
        if (saved.paperSize) setPaperSize(saved.paperSize)
        if (saved.pageStyle) setPageStyle(saved.pageStyle)
        if (saved.elements && Array.isArray(saved.elements)) {
          const els = saved.elements as CanvasElement[]
          histRef.current = [els.map(e => ({ ...e }))]
          histIdx.current = 0
          setElements(els)
          syncUR()
        }
      } catch { /* corrupt JSON — keep default */ }
    } else {
      // No layout saved yet — reset to default canvas
      const d = defaultElements()
      histRef.current = [d.map(e => ({ ...e }))]
      histIdx.current = 0
      setElements(d)
      syncUR()
    }
    clearSel()
  }

  const [templateName, setTemplateName] = React.useState("Default Invoice Template")
  const [paperSize,    setPaperSize]    = React.useState<PaperSize>("A4")
  const [showGrid,     setShowGrid]     = React.useState(true)
  const [elements,     setElements]     = React.useState<CanvasElement[]>(defaultElements)
  const [selectedIds,  setSelectedIds]  = React.useState<Set<string>>(new Set())
  const [openSection,  setOpenSection]  = React.useState<string|null>("Company")
  const [pageStyle,    setPageStyle]    = React.useState<PageStyle>({bgColor:"#ffffff"})
  const [previewOpen,  setPreviewOpen]  = React.useState(false)
  const [customFieldDialog, setCustomFieldDialog] = React.useState(false)
  const [customFieldLabel, setCustomFieldLabel] = React.useState("")


  // history
  const histRef=React.useRef<CanvasElement[][]>([defaultElements()])
  const histIdx=React.useRef(0)
  const [canUndo,setCanUndo]=React.useState(false)
  const [canRedo,setCanRedo]=React.useState(false)

  function syncUR(){setCanUndo(histIdx.current>0);setCanRedo(histIdx.current<histRef.current.length-1)}
  const commit=React.useCallback((els:CanvasElement[])=>{
    histRef.current=histRef.current.slice(0,histIdx.current+1)
    histRef.current.push(els.map(e=>({...e})))
    histIdx.current=histRef.current.length-1
    setElements(els);syncUR()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  function undo(){if(histIdx.current<=0)return;histIdx.current--;setElements(histRef.current[histIdx.current]!.map(e=>({...e})));syncUR()}
  function redo(){if(histIdx.current>=histRef.current.length-1)return;histIdx.current++;setElements(histRef.current[histIdx.current]!.map(e=>({...e})));syncUR()}

  // stable callbacks passed as props
  const updateProp=React.useCallback((id:string,patch:Partial<CanvasElement>)=>{
    setElements(prev=>{
      const next=prev.map(e=>e.id===id?{...e,...patch}:e)
      histRef.current=histRef.current.slice(0,histIdx.current+1)
      histRef.current.push(next.map(e=>({...e})))
      histIdx.current=histRef.current.length-1
      syncUR()
      return next
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  const deleteSingle=React.useCallback((id:string)=>{
    setElements(prev=>{
      const next=prev.filter(e=>e.id!==id)
      histRef.current=histRef.current.slice(0,histIdx.current+1)
      histRef.current.push(next.map(e=>({...e})))
      histIdx.current=histRef.current.length-1
      syncUR()
      return next
    })
    setSelectedIds(prev=>{const n=new Set(prev);n.delete(id);return n})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  function deleteSelected(){commit(elements.filter(e=>!selectedIds.has(e.id)));clearSel()}
  function clearSel(){setSelectedIds(new Set())}
  function selectOne(id:string){setSelectedIds(new Set([id]))}

  function addElement(type:FieldType){
    const W:Partial<Record<FieldType,number>>={
      "items-table":550,"contract-text":380,"customer-block":220,
      "company-logo":70,"qr-code":80,"divider":550,
      "grand-total":210,"subtotal":210,"tax-line":210,
    }
    const H:Partial<Record<FieldType,number>>={
      "items-table":120,"contract-text":200,"customer-block":80,
      "company-logo":60,"qr-code":80,"divider":2,"grand-total":22,
    }
    const el:CanvasElement={
      id:uid(),type,x:40,y:40,width:W[type]??180,height:H[type]??25,
      fontSize:11,fontWeight:"normal",fontStyle:"normal",
      textDecoration:"none",textAlign:"left",color:"#111827",bgColor:"transparent",
      placeholder:PH[type],
      text:(type==="custom-text"||type==="contract-text")?PH[type]:undefined,
    }
    commit([...elements,el]);selectOne(el.id)
  }

  function createCustomField(){
    if(!customFieldLabel.trim())return
    const el:CanvasElement={
      id:uid(),type:"custom-text",x:40,y:40,width:200,height:25,
      fontSize:11,fontWeight:"normal",fontStyle:"normal",
      textDecoration:"none",textAlign:"left",color:"#111827",bgColor:"transparent",
      placeholder:customFieldLabel.trim(),
      text:customFieldLabel.trim(),
    }
    commit([...elements,el])
    selectOne(el.id)
    setCustomFieldLabel("")
    setCustomFieldDialog(false)
  }


  function groupSelected(){
    if(selectedIds.size<2)return
    const gid=`grp-${Date.now()}`
    commit(elements.map(e=>selectedIds.has(e.id)?{...e,groupId:gid}:e))
  }
  function ungroupSelected(){commit(elements.map(e=>selectedIds.has(e.id)?{...e,groupId:undefined}:e))}
  function resetCanvas(){if(!window.confirm("Reset to default layout?"))return;commit(defaultElements());clearSel()}

  async function handleSave(){
    const layout = JSON.stringify({ version: "1.0", templateName, paperSize, pageStyle, elements })
    if (activeTplId !== null) {
      // Update name + save canvas layout
      setIsSaving(true)
      try {
        await updateTplMut.mutateAsync({ id: activeTplId, dto: { name: templateName } })
        await saveLayoutMut.mutateAsync({ id: activeTplId, layoutJson: layout })
      } finally { setIsSaving(false) }
    } else {
      // No template selected — create a new one first
      setIsSaving(true)
      try {
        const created = await createTplMut.mutateAsync({
          name: templateName, isDefault: apiTemplates.length === 0,
          logoPosition: "left", headerBg: "#1e293b", headerTextColor: "#f8fafc",
          showMobile: true, showEmail: true, showPhone: true, showWebsite: true,
          showWhatsapp: true, showAddress: true, showTagline: true,
          bodyBg: pageStyle.bgColor, bodyTextColor: "#111827",
          accentColor: "#2563eb", borderColor: "#e5e7eb", fontSizeBase: 11,
          showCustomerBlock: true, showCostTable: true, showTermsBlock: true,
          showSignatureBlock: true, showFooter: true, layoutJson: layout,
        })
        setActiveTplId(created.id)
        await saveLayoutMut.mutateAsync({ id: created.id, layoutJson: layout })
      } finally { setIsSaving(false) }
    }
  }

  async function handleNewTemplate() {
    const name = window.prompt("New template name:", "Untitled Template")
    if (!name?.trim()) return
    setIsSaving(true)
    try {
      const created = await createTplMut.mutateAsync({
        name: name.trim(), isDefault: apiTemplates.length === 0,
        logoPosition: "left", headerBg: "#1e293b", headerTextColor: "#f8fafc",
        showMobile: true, showEmail: true, showPhone: true, showWebsite: true,
        showWhatsapp: true, showAddress: true, showTagline: true,
        bodyBg: "#ffffff", bodyTextColor: "#111827",
        accentColor: "#2563eb", borderColor: "#e5e7eb", fontSizeBase: 11,
        showCustomerBlock: true, showCostTable: true, showTermsBlock: true,
        showSignatureBlock: true, showFooter: true, layoutJson: null,
      })
      loadTemplate(created.id)
    } finally { setIsSaving(false) }
  }

  async function handleDeleteTemplate() {
    if (!activeTplId) return
    const tpl = apiTemplates.find(t => t.id === activeTplId)
    if (!window.confirm(`Delete template "${tpl?.name}"? This cannot be undone.`)) return
    await deleteTplMut.mutateAsync(activeTplId)
    setActiveTplId(null)
    const remaining = apiTemplates.filter(t => t.id !== activeTplId)
    if (remaining.length > 0) loadTemplate(remaining[0]!.id)
    else { commit(defaultElements()); setTemplateName("Default Invoice Template") }
  }

  // logo upload
  const logoInputRef=React.useRef<HTMLInputElement>(null)
  // keep a ref to selected logo element id so the file-change handler always reads current value
  const pendingLogoId=React.useRef<string|null>(null)
  const handleLogoClick=React.useCallback(()=>{
    // find logo element: prefer singleSel if it's a logo, else first logo in elements
    setElements(prev=>{
      const target=prev.find(e=>e.type==="company-logo")
      if(target)pendingLogoId.current=target.id
      return prev
    })
    logoInputRef.current?.click()
  },[])

  function handleLogoUpload(e:React.ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0];if(!file)return
    const reader=new FileReader()
    reader.onload=ev=>{
      const dataUrl=ev.target?.result as string
      const id=pendingLogoId.current
      if(id)updateProp(id,{text:dataUrl})
      pendingLogoId.current=null
    }
    reader.readAsDataURL(file)
    e.target.value=""
  }

  // bg image upload
  const bgInputRef=React.useRef<HTMLInputElement>(null)
  function handleBgUpload(e:React.ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0];if(!file)return
    const reader=new FileReader()
    reader.onload=ev=>setPageStyle(s=>({...s,bgImage:ev.target?.result as string}))
    reader.readAsDataURL(file);e.target.value=""
  }

  // keyboard shortcuts
  React.useEffect(()=>{
    function onKey(e:KeyboardEvent){
      const tag=(e.target as HTMLElement).tagName
      if(tag==="INPUT"||tag==="TEXTAREA")return
      if((e.ctrlKey||e.metaKey)&&e.key==="z"){e.preventDefault();undo()}
      if((e.ctrlKey||e.metaKey)&&e.key==="y"){e.preventDefault();redo()}
      if((e.ctrlKey||e.metaKey)&&e.key==="s"){e.preventDefault();handleSave()}
      if((e.key==="Delete"||e.key==="Backspace")&&selectedIds.size>0){e.preventDefault();deleteSelected()}
    }
    window.addEventListener("keydown",onKey)
    return()=>window.removeEventListener("keydown",onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[selectedIds,elements])

  // drag / resize
  const canvasRef=React.useRef<HTMLDivElement>(null)
  const dragElemsRef=React.useRef<CanvasElement[]>([])
  const draggingIds=React.useRef<Set<string>>(new Set())
  const grabOffset=React.useRef<Record<string,{ox:number;oy:number}>>({})
  const resizingId=React.useRef<string|null>(null)
  const resizeHnd=React.useRef<ResizeHandle|null>(null)
  const resizeStart=React.useRef({mx:0,my:0,x:0,y:0,w:0,h:0})

  function onElementMouseDown(e:React.MouseEvent,el:CanvasElement){
    if((e.target as HTMLElement).dataset.handle)return
    e.preventDefault();e.stopPropagation()

    // Shift+click: add/remove single element from selection (no group expansion)
    if(e.shiftKey){
      setSelectedIds(prev=>{
        const next=new Set(prev)
        if(next.has(el.id)){next.delete(el.id)}else{next.add(el.id)}
        return next
      })
      // Don't start a drag on shift-click — just toggle selection
      return
    }

    // Normal click: select the element (plus whole group if grouped)
    let ids=new Set([el.id])
    if(el.groupId)elements.forEach(x=>{if(x.groupId===el.groupId)ids.add(x.id)})
    setSelectedIds(ids);draggingIds.current=ids
    const rect=canvasRef.current!.getBoundingClientRect()
    const offs:Record<string,{ox:number;oy:number}>={};
    ids.forEach(id=>{const t=elements.find(x=>x.id===id)!;offs[id]={ox:e.clientX-rect.left-t.x,oy:e.clientY-rect.top-t.y}})
    grabOffset.current=offs;dragElemsRef.current=elements.map(x=>({...x}))
  }
  function onHandleMouseDown(e:React.MouseEvent,el:CanvasElement,handle:ResizeHandle){
    e.preventDefault();e.stopPropagation()
    resizingId.current=el.id;resizeHnd.current=handle
    resizeStart.current={mx:e.clientX,my:e.clientY,x:el.x,y:el.y,w:el.width,h:el.height}
    dragElemsRef.current=elements.map(x=>({...x}))
  }

  React.useEffect(()=>{
    function onMove(e:MouseEvent){
      const canvas=canvasRef.current;if(!canvas)return
      if(resizingId.current){
        const id=resizingId.current,h=resizeHnd.current!,s=resizeStart.current
        const dx=e.clientX-s.mx,dy=e.clientY-s.my
        let x=s.x,y=s.y,w=s.w,ht=s.h
        if(h.includes("e")){w=Math.max(20,s.w+dx)}
        if(h.includes("s")){ht=Math.max(10,s.h+dy)}
        if(h.includes("w")){w=Math.max(20,s.w-dx);x=s.x+s.w-w}
        if(h.includes("n")){ht=Math.max(10,s.h-dy);y=s.y+s.h-ht}
        const idx=dragElemsRef.current.findIndex(el=>el.id===id)
        if(idx!==-1){dragElemsRef.current[idx]={...dragElemsRef.current[idx]!,x,y,width:w,height:ht};setElements([...dragElemsRef.current])}
        return
      }
      if(draggingIds.current.size===0)return
      const rect=canvas.getBoundingClientRect()
      draggingIds.current.forEach(id=>{
        const off=grabOffset.current[id];if(!off)return
        const idx=dragElemsRef.current.findIndex(el=>el.id===id);if(idx===-1)return
        const el=dragElemsRef.current[idx]!
        dragElemsRef.current[idx]={...el,
          x:Math.max(0,Math.min(e.clientX-rect.left-off.ox,canvas.offsetWidth-el.width)),
          y:Math.max(0,Math.min(e.clientY-rect.top-off.oy,canvas.offsetHeight-el.height))}
      })
      setElements([...dragElemsRef.current])
    }
    function onUp(){
      const wasDrag=draggingIds.current.size>0,wasRes=!!resizingId.current
      draggingIds.current=new Set();resizingId.current=null
      if(wasDrag||wasRes)commit([...dragElemsRef.current])
    }
    window.addEventListener("mousemove",onMove)
    window.addEventListener("mouseup",onUp)
    return()=>{window.removeEventListener("mousemove",onMove);window.removeEventListener("mouseup",onUp)}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  const paper=PAPER[paperSize]
  const selArray=[...selectedIds]
  const groupIds=new Set(selArray.map(id=>elements.find(e=>e.id===id)?.groupId).filter(Boolean) as string[])
  const sharedGroup=groupIds.size===1?[...groupIds][0]:undefined
  const singleSel=selectedIds.size===1&&!sharedGroup?elements.find(e=>selectedIds.has(e.id))??null:null
  const canGroup=selectedIds.size>=2
  const groupMembers=sharedGroup?elements.filter(e=>e.groupId===sharedGroup):[]

  const paperStyle:React.CSSProperties={
    width:paper.w,height:paper.h,backgroundColor:pageStyle.bgColor,
    backgroundImage:pageStyle.bgImage?`url(${pageStyle.bgImage})`:showGrid
      ?"linear-gradient(rgba(0,0,0,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,.04) 1px,transparent 1px)"
      :"none",
    backgroundSize:pageStyle.bgImage?"cover":"20px 20px",
    backgroundPosition:"center",position:"relative",
  }

  return(
    <div className="flex flex-col overflow-hidden" style={{height:"calc(100vh - 56px)"}}>
      <input ref={logoInputRef} type="file" accept="image/*" className="sr-only" onChange={handleLogoUpload}/>
      <input ref={bgInputRef}   type="file" accept="image/*" className="sr-only" onChange={handleBgUpload}/>

      {/* TOP TOOLBAR */}
      <div className="flex items-center gap-2 px-4 py-2 border-b bg-background shrink-0 flex-wrap">
        <Input value={templateName} onChange={e=>setTemplateName(e.target.value)}
          className="w-52 h-8 text-sm font-medium" placeholder="Template name"/>

        {/* Template switcher */}
        <Select
          value={activeTplId?.toString() ?? ""}
          onValueChange={v=>{ if(v) loadTemplate(parseInt(v)) }}
        >
          <SelectTrigger className="w-44 h-8">
            <SelectValue placeholder={tplLoading ? "Loading…" : "Select template"} />
          </SelectTrigger>
          <SelectContent>
            {apiTemplates.map(t => (
              <SelectItem key={t.id} value={t.id.toString()}>
                {t.name}{t.isDefault ? " ★" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon-sm" title="New template" onClick={handleNewTemplate}>
          <Plus className="size-4"/>
        </Button>
        {activeTplId !== null && (
          <Button variant="ghost" size="icon-sm" title="Delete this template"
            className="text-destructive hover:text-destructive"
            onClick={handleDeleteTemplate}>
            <Trash2 className="size-4"/>
          </Button>
        )}

        <Separator orientation="vertical" className="h-6"/>
        <Button variant="ghost" size="icon-sm" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)"><Undo2 className="size-4"/></Button>
        <Button variant="ghost" size="icon-sm" onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)"><Redo2 className="size-4"/></Button>
        <Separator orientation="vertical" className="h-6"/>
        <Button variant={showGrid?"default":"ghost"} size="sm" className="h-8 gap-1.5" onClick={()=>setShowGrid(v=>!v)}>
          <Grid3x3 className="size-3.5"/>Grid</Button>
        <Select value={paperSize} onValueChange={v=>{if(v)setPaperSize(v as PaperSize)}}>
          <SelectTrigger className="w-48 h-8"><SelectValue/></SelectTrigger>
          <SelectContent>{(Object.keys(PAPER) as PaperSize[]).map(k=>(
            <SelectItem key={k} value={k}>{PAPER[k].label}</SelectItem>))}</SelectContent>
        </Select>
        <Separator orientation="vertical" className="h-6"/>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5" onClick={()=>setPreviewOpen(true)}><Eye className="size-3.5"/>Preview</Button>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5" onClick={()=>printCanvas(canvasRef.current,paper)}><Printer className="size-3.5"/>Print</Button>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5" onClick={handleLogoClick}><Upload className="size-3.5"/>Logo</Button>
        <div className="flex-1"/>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5" onClick={resetCanvas}><RotateCcw className="size-3.5"/>Reset</Button>
        <Button size="sm" className="h-8 gap-1.5" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="size-3.5 animate-spin"/> : <Save className="size-3.5"/>}
          {isSaving ? "Saving…" : "Save"}
        </Button>
      </div>

      {/* THREE-PANEL BODY */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT: Fields */}
        <div className="w-56 shrink-0 border-r bg-background flex flex-col overflow-hidden">
          <div className="px-4 py-2.5 border-b shrink-0">
            <p className="text-xs font-semibold uppercase tracking-wider">Fields</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Click to add to canvas</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {SECTIONS.map(section=>{
              const sf=FIELDS.filter(f=>f.section===section)
              const isOpen=openSection===section
              return(
                <div key={section}>
                  <button type="button"
                    className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-muted/50 hover:bg-muted border-b transition-colors"
                    onClick={()=>setOpenSection(isOpen?null:section)}>
                    {section}<span className="text-muted-foreground">{isOpen?"−":"+"}</span>
                  </button>
                  {isOpen&&(
                    <div className="flex flex-col gap-1 p-2">
                      {sf.map(def=>(
                        <button key={def.type} type="button" onClick={()=>addElement(def.type)}
                          className="flex items-center gap-2 px-2.5 py-2 rounded-md border bg-card hover:bg-accent transition-colors text-left">
                          <div className="flex size-6 items-center justify-center rounded bg-primary/10 text-primary shrink-0">
                            <def.icon className="size-3"/></div>
                          <span className="text-xs">{def.label}</span>
                        </button>))}
                    </div>)}
                </div>)
            })}
            
            {/* Custom Field Button */}
            <div className="p-2 border-t mt-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={()=>setCustomFieldDialog(true)}
              >
                <Plus className="size-4"/>
                Create Custom Field
              </Button>
            </div>
          </div>
        </div>

        {/* CENTER: Canvas */}
        <div className="flex-1 overflow-auto bg-[#e8e8e8] flex flex-col items-center py-8 px-6 gap-4">
          <div ref={canvasRef} className="relative shadow-2xl ring-1 ring-black/10 shrink-0"
            style={paperStyle} onClick={e=>{if(e.target===e.currentTarget)clearSel()}}>
            {elements.map(el=>{
              const isSel=selectedIds.has(el.id)
              const isGrpHl=!!el.groupId&&[...selectedIds].some(id=>elements.find(x=>x.id===id)?.groupId===el.groupId)
              const imgSrc=el.type==="company-logo"&&el.text?.startsWith("data:")?el.text:null
              return(
                <div key={el.id} onMouseDown={e=>onElementMouseDown(e,el)}
                  style={{position:"absolute",left:el.x,top:el.y,width:el.width,height:el.height,
                    fontSize:el.fontSize,fontWeight:el.fontWeight,fontStyle:el.fontStyle,
                    textDecoration:el.textDecoration,textAlign:el.textAlign,
                    color:el.type==="divider"?"transparent":el.color,
                    backgroundColor:el.bgColor||"transparent",
                    border:isSel?"1.5px solid #3b82f6":isGrpHl?"1.5px dashed #8b5cf6":"1px dashed #cbd5e1",
                    boxSizing:"border-box",cursor:"grab",userSelect:"none",overflow:"hidden"}}>
                  {imgSrc?(
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imgSrc} alt="logo" style={{width:"100%",height:"100%",objectFit:"contain"}}/>
                  ):(
                    <ElementContent el={el}/>)}
                  {isSel&&selectedIds.size===1&&HANDLE_DIRS.map(handle=>(
                    <div key={handle} data-handle={handle} style={handleCss(handle)}
                      onMouseDown={e=>onHandleMouseDown(e,el,handle)}/>))}
                  {el.groupId&&isSel&&(
                    <div style={{position:"absolute",top:-14,left:0,fontSize:9,
                      background:"#8b5cf6",color:"#fff",padding:"0 4px",borderRadius:2,
                      pointerEvents:"none"}}>group</div>)}
                </div>)})}
          </div>
          <p className="text-xs text-gray-400 select-none">
            {paper.label} · {paper.w}×{paper.h}px &nbsp;·&nbsp;
            Click to select · Drag to move · Handles to resize
          </p>
        </div>

        {/* RIGHT: Properties */}
        <div className="w-72 shrink-0 border-l bg-background flex flex-col overflow-hidden">
          <div className="px-4 py-2.5 border-b shrink-0 flex items-center gap-2">
            <Palette className="size-3.5 text-muted-foreground"/>
            <p className="text-xs font-semibold uppercase tracking-wider">Properties</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex flex-col gap-4">

              {/* Page Background — always visible */}
              <section className="flex flex-col gap-2">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Page Background
                </Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={pageStyle.bgColor}
                    onChange={e=>setPageStyle(s=>({...s,bgColor:e.target.value}))}
                    className="size-8 rounded border cursor-pointer p-0.5"/>
                  <Input value={pageStyle.bgColor}
                    onChange={e=>setPageStyle(s=>({...s,bgColor:e.target.value}))}
                    className="h-8 text-xs font-mono flex-1" maxLength={7}/>
                  <Button variant="outline" size="icon-sm" title="Upload background image"
                    onClick={()=>bgInputRef.current?.click()}>
                    <ImgIcon className="size-3.5"/></Button>
                </div>
                {pageStyle.bgImage&&(
                  <Button variant="ghost" size="sm" className="h-7 gap-1 text-destructive self-start text-xs"
                    onClick={()=>setPageStyle(s=>({...s,bgImage:undefined}))}>
                    <X className="size-3"/>Remove BG image</Button>)}
              </section>

              {/* No selection */}
              {selectedIds.size===0&&(
                <div className="flex flex-col items-center text-center gap-2 py-4 px-2">
                  <div className="size-10 rounded-full bg-muted flex items-center justify-center">
                    <Type className="size-5 text-muted-foreground"/></div>
                  <p className="text-sm font-medium">No element selected</p>
                  <p className="text-xs text-muted-foreground">Click an element on the canvas</p>
                </div>)}

              {/* GROUP mode */}
              {sharedGroup&&groupMembers.length>0&&(
                <>
                  <Separator/>
                  <GroupPanel
                    members={groupMembers}
                    selectedIds={selectedIds}
                    onUpdate={updateProp}
                    onDelete={deleteSingle}
                    onUngroup={ungroupSelected}
                    onDeleteAll={deleteSelected}
                    onLogoClick={handleLogoClick}
                    onSelectOne={selectOne}/>
                </>)}

              {/* SINGLE element */}
              {singleSel&&(
                <>
                  <Separator/>
                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {FIELDS.find(f=>f.type===singleSel.type)?.label??singleSel.type}
                  </Label>
                  <ElementProps el={singleSel} onUpdate={updateProp}
                    onDelete={deleteSingle} onLogoClick={handleLogoClick} showPosition/>
                  <Separator/>
                  {canGroup&&(
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={groupSelected}>
                      <Group className="size-3.5"/>Group with selection</Button>)}
                </>)}

              {/* MULTI without shared group */}
              {selectedIds.size>1&&!sharedGroup&&(
                <>
                  <Separator/>
                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {selectedIds.size} elements selected
                  </Label>
                  <p className="text-[11px] text-muted-foreground -mt-2">
                    Shift+click to add or remove elements
                  </p>
                  {/* Check if all selected already belong to same group → show Ungroup instead */}
                  {(()=>{
                    const selEls=elements.filter(e=>selectedIds.has(e.id))
                    const selGroupIds=new Set(selEls.map(e=>e.groupId).filter(Boolean))
                    const allGrouped=selEls.every(e=>!!e.groupId)
                    const mixedGroups=selGroupIds.size>1
                    return(
                      <div className="flex flex-col gap-2">
                        {/* Group button — always available for 2+ ungrouped or mixed */}
                        <Button size="sm" variant="outline" className="gap-1.5" onClick={groupSelected}>
                          <Group className="size-3.5"/>Group {selectedIds.size} elements</Button>
                        {/* Ungroup — only if at least one selected element is already in a group */}
                        {allGrouped&&(
                          <Button size="sm" variant="outline" className="gap-1.5" onClick={ungroupSelected}>
                            <Ungroup className="size-3.5"/>Ungroup selected</Button>)}
                        <Button size="sm" variant="destructive" className="gap-1.5" onClick={deleteSelected}>
                          <Trash2 className="size-3.5"/>Delete {selectedIds.size} elements</Button>
                      </div>)
                  })()}
                </>)}
            </div>
          </div>
        </div>
      </div>

      {/* PREVIEW MODAL */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto p-4">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Preview — {templateName}</span>
              <Button size="sm" variant="outline" className="gap-1.5"
                onClick={()=>printCanvas(canvasRef.current,paper)}>
                <Printer className="size-3.5"/>Print</Button>
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-center mt-4 overflow-auto">
            <div style={{transform:`scale(${Math.min(1,700/paper.w)})`,transformOrigin:"top left",
              width:paper.w,height:paper.h,flexShrink:0}}>
              <div style={{...paperStyle,boxShadow:"0 4px 24px rgba(0,0,0,.15)"}}>
                {elements.map(el=>{
                  const imgSrc=el.type==="company-logo"&&el.text?.startsWith("data:")?el.text:null
                  return(
                    <div key={el.id} style={{position:"absolute",left:el.x,top:el.y,
                      width:el.width,height:el.height,fontSize:el.fontSize,
                      fontWeight:el.fontWeight,fontStyle:el.fontStyle,
                      textDecoration:el.textDecoration,textAlign:el.textAlign,
                      color:el.type==="divider"?"transparent":el.color,
                      backgroundColor:el.bgColor||"transparent",
                      overflow:"hidden",boxSizing:"border-box"}}>
                      {imgSrc?(
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imgSrc} alt="logo" style={{width:"100%",height:"100%",objectFit:"contain"}}/>
                      ):(
                        <ElementContent el={el}/>)}
                    </div>)})}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* CUSTOM FIELD DIALOG */}
      <Dialog open={customFieldDialog} onOpenChange={setCustomFieldDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Custom Field</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="custom-label">Field Label</Label>
              <Input
                id="custom-label"
                value={customFieldLabel}
                onChange={(e) => setCustomFieldLabel(e.target.value)}
                placeholder="e.g., Serial Number, License Key, etc."
                onKeyDown={(e) => {
                  if (e.key === "Enter") createCustomField()
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setCustomFieldDialog(false)
              setCustomFieldLabel("")
            }}>
              Cancel
            </Button>
            <Button onClick={createCustomField} disabled={!customFieldLabel.trim()}>
              Create Field
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>)
}
