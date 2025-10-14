{
  "project": "Newline Apparel – Purchase Order Generator (Print-ready A4)",
  "design_personality": {
    "attributes": ["precise", "reliable", "audit-friendly", "utilitarian", "calm"],
    "tone": "Professional manufacturing documentation. Zero visual fluff in the PO itself; clean, monochrome UI around it."
  },
  "typography": {
    "font_stack": "Inter, Roboto, system-ui, -apple-system, Segoe UI, Helvetica Neue, Arial, Noto Sans, sans-serif",
    "roles": {
      "section_headers_pt": "12.5pt (semi-bold)",
      "body_pt": "9.5pt",
      "table_cells_pt": "9.5pt",
      "meta_chips_pt": "9pt (medium)"
    },
    "tailwind_scale": {
      "h1": "text-4xl sm:text-5xl lg:text-6xl (UI only, never inside the print PO)",
      "h2": "text-base md:text-lg (UI only)",
      "body": "text-sm md:text-base",
      "small": "text-xs"
    },
    "usage": [
      "Print document uses pt sizing; app UI can use Tailwind rem sizing.",
      "All table text 9–10pt; headers 12–13pt semibold per spec.",
      "Ensure numeric columns use tabular-nums via font-feature-settings: \"tnum\" 1;"
    ]
  },
  "color_system": {
    "goal": "Monochrome/gray for print reliability; neutral, unobtrusive UI.",
    "print_palette": {
      "ink": "#111827",
      "muted_text": "#374151",
      "border": "#D1D5DB",
      "header_bg": "#F5F5F7",
      "paper_bg": "#FFFFFF"
    },
    "app_ui_palette": {
      "bg": "#FAFAFA",
      "fg": "#0B0D10",
      "subtle": "#6B7280",
      "accent": "#111827",
      "focus": "#111827"
    },
    "semantic_tokens_css": ":root{--po-ink:#111827;--po-muted:#374151;--po-border:#D1D5DB;--po-header:#F5F5F7;--po-paper:#FFFFFF;--po-ring:#111827;--po-chip-bg:#F3F4F6;--po-chip-text:#111827}"
  },
  "layout": {
    "page": "A4 portrait (210×297mm) with 12mm margins on all sides. Scale 100%.",
    "structure": [
      "Header row: Logo left; Title + PO No. right",
      "Two address blocks: Buyer (left), Supplier/Factory (right)",
      "Meta strip (single-line chips): PO Date • Delivery Date • Payment Terms • Delivery Terms",
      "Order Summary table",
      "Size–Colour Breakdown matrix with totals",
      "Packing Instructions",
      "Other Terms",
      "Authorisation: two signature boxes side-by-side"
    ],
    "grid_rules": {
      "outer": "max-w-[900px] mx-auto px-4 md:px-6 lg:px-0 (UI container). For print, fixed A4 mm-based sizing.",
      "addresses": "grid grid-cols-2 gap-6",
      "signatures": "grid grid-cols-2 gap-6 items-end"
    },
    "tables": {
      "header_style": "semi-bold, bg #F5F5F7, text #111827",
      "row_min_height": "18–20px",
      "cell_padding": "6–8px",
      "border": "0.5–0.75pt solid #D1D5DB",
      "currency": "INR with ₹ symbol and thousand separators"
    },
    "page_breaks": {
      "rules": [
        "Avoid breaks inside header, addresses, meta strip, and size-color matrix if possible.",
        "Allow page break before Authorisation if content overflows.",
        "Keep each table header repeated if table continues (use thead { display: table-header-group } for print)."
      ]
    }
  },
  "print_css": {
    "snippet": "@page { size: A4; margin: 12mm; }\n@media print {\n  html, body { background: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }\n  body { font-family: Inter, Roboto, system-ui, -apple-system, Segoe UI, Helvetica Neue, Arial, Noto Sans, sans-serif; }\n  .po-doc { width: 186mm; /* 210 - 12 - 12 */ margin: 0 auto; color: #111827; }\n  .po-doc * { font-size: 9.5pt; line-height: 1.25; }\n  .po-section-title { font-weight: 600; font-size: 12.5pt; }\n  .po-table { width: 100%; border-collapse: collapse; }\n  .po-table th { background: #F5F5F7; color: #111827; font-weight: 600; }\n  .po-table th, .po-table td { border: 0.5pt solid #D1D5DB; padding: 6px; }\n  .po-row { min-height: 18px; }\n  .po-chip { background: #F3F4F6; color: #111827; border: 0.5pt solid #E5E7EB; padding: 2px 6px; border-radius: 4px; font-size: 9pt; }\n  .avoid-break { break-inside: avoid; page-break-inside: avoid; }\n  .page-break { break-before: page; page-break-before: always; }\n  thead { display: table-header-group; }\n  tfoot { display: table-footer-group; }\n  .no-print { display: none !important; }\n  .print-only { display: block !important; }\n  /* Remove UI hover/animation for print */\n  * { transition: none !important; animation: none !important; }\n}\n@media screen { .print-only { display: none; }}"
  },
  "components": {
    "list_view": {
      "purpose": "Show saved POs with PO Number, Date, Supplier; search/filter, pagination.",
      "layout": "Card with toolbar on top (search + filters), table below.",
      "shadcn": ["Input", "Select", "Badge", "Button", "Table", "Pagination", "Card", "Separator", "ScrollArea"],
      "micro": ["Row hover background using hover:bg-muted/50 (UI only)", "Keyboard navigation with focus-visible ring"],
      "testids": [
        "data-testid=\"po-list-search-input\"",
        "data-testid=\"po-list-supplier-filter\"",
        "data-testid=\"po-list-table\"",
        "data-testid=\"po-list-new-button\"",
        "data-testid=\"po-list-row-{poNo}\""
      ]
    },
    "po_entry_form": {
      "purpose": "Logical grouping of all input fields required for PO.",
      "groups": [
        "Header: Logo upload, PO Title auto, PO Number",
        "Parties: Buyer and Supplier addresses",
        "Meta: PO Date, Delivery Date, Payment Terms, Delivery Terms",
        "Order Summary: style, description, unit, price, currency, totals",
        "Size–Colour Matrix",
        "Packing Instructions",
        "Other Terms",
        "Authorisation: Signatory names + signature upload areas"
      ],
      "shadcn": ["Form", "Input", "Textarea", "Select", "Calendar", "Popover", "Button", "Tabs", "Separator", "Badge", "Dialog", "ScrollArea", "Tooltip"],
      "validation": "react-hook-form + zod for schema validation",
      "testids": [
        "data-testid=\"po-form-po-number-input\"",
        "data-testid=\"po-form-buyer-address\"",
        "data-testid=\"po-form-supplier-address\"",
        "data-testid=\"po-form-po-date\"",
        "data-testid=\"po-form-delivery-date\"",
        "data-testid=\"po-form-payment-terms\"",
        "data-testid=\"po-form-delivery-terms\"",
        "data-testid=\"po-form-style\"",
        "data-testid=\"po-form-description\"",
        "data-testid=\"po-form-currency\"",
        "data-testid=\"po-form-unit-price\"",
        "data-testid=\"po-form-packing-instructions\"",
        "data-testid=\"po-form-other-terms\"",
        "data-testid=\"po-form-save-button\"",
        "data-testid=\"po-form-preview-button\""
      ]
    },
    "size_colour_matrix": {
      "purpose": "Interactive grid with auto row/column/overall totals.",
      "layout": "Sticky left column (Color) and sticky header (Sizes). Scrollable if many.",
      "behaviour": [
        "Auto-calc row totals (per color), column totals (per size), and grand total.",
        "Keyboard-friendly: arrow keys move cell focus; Enter commits value.",
        "Allow dynamic size and color sets; persist structure to PO."
      ],
      "shadcn": ["Table", "ScrollArea", "Input", "Button", "Badge", "Tooltip"],
      "testids": [
        "data-testid=\"matrix-size-header-{size}\"",
        "data-testid=\"matrix-color-row-{color}\"",
        "data-testid=\"matrix-cell-{color}-{size}\"",
        "data-testid=\"matrix-total-row\"",
        "data-testid=\"matrix-total-column\"",
        "data-testid=\"matrix-grand-total\""
      ]
    },
    "pdf_preview_export": {
      "purpose": "Render exact print layout; export via browser print to PDF using react-to-print.",
      "shadcn": ["Dialog", "Button", "Tabs", "Separator"],
      "notes": [
        "Preview area uses the .po-doc structure with mm-based sizing.",
        "Export triggers window print via react-to-print for consistent margins and A4 size.",
        "Use thead/tfoot display rules for repeated headers on page breaks."
      ],
      "testids": [
        "data-testid=\"po-preview-open-button\"",
        "data-testid=\"po-preview-dialog\"",
        "data-testid=\"po-export-pdf-button\""
      ]
    }
  },
  "component_path": {
    "Button": "/app/frontend/src/components/ui/button.jsx",
    "Input": "/app/frontend/src/components/ui/input.jsx",
    "Textarea": "/app/frontend/src/components/ui/textarea.jsx",
    "Select": "/app/frontend/src/components/ui/select.jsx",
    "Calendar": "/app/frontend/src/components/ui/calendar.jsx",
    "Popover": "/app/frontend/src/components/ui/popover.jsx",
    "Badge": "/app/frontend/src/components/ui/badge.jsx",
    "Card": "/app/frontend/src/components/ui/card.jsx",
    "Separator": "/app/frontend/src/components/ui/separator.jsx",
    "Table": "/app/frontend/src/components/ui/table.jsx",
    "Pagination": "/app/frontend/src/components/ui/pagination.jsx",
    "Dialog": "/app/frontend/src/components/ui/dialog.jsx",
    "Tabs": "/app/frontend/src/components/ui/tabs.jsx",
    "Tooltip": "/app/frontend/src/components/ui/tooltip.jsx",
    "ScrollArea": "/app/frontend/src/components/ui/scroll-area.jsx",
    "Sonner": "/app/frontend/src/components/ui/sonner.jsx"
  },
  "tokens_and_tailwind": {
    "css_custom_properties": ":root{--po-ink:#111827;--po-muted:#374151;--po-border:#D1D5DB;--po-header:#F5F5F7;--po-paper:#FFFFFF;--po-ring:#111827;--radius:6px;--btn-radius:8px;--shadow-sm:0 1px 2px rgba(0,0,0,0.05)}",
    "utility_aliases": [
      ".ink { color: var(--po-ink); }",
      ".muted { color: var(--po-muted); }",
      ".ring-ink { box-shadow: 0 0 0 2px var(--po-ring); }"
    ],
    "buttons": {
      "primary": "inline-flex items-center justify-center rounded-[var(--btn-radius)] bg-neutral-900 text-white px-3 py-2 text-sm hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
      "secondary": "inline-flex items-center justify-center rounded-[var(--btn-radius)] bg-white text-neutral-900 border border-neutral-200 px-3 py-2 text-sm hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 transition-colors",
      "ghost": "inline-flex items-center justify-center rounded-[var(--btn-radius)] text-neutral-900 px-3 py-2 text-sm hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 transition-colors"
    }
  },
  "code_scaffolds": {
    "utils_currency.js": "export const formatINR = (v) => { if(v==null||v===\"\") return \"\"; const num = Number(v)||0; return new Intl.NumberFormat('en-IN',{ style:'currency', currency:'INR', minimumFractionDigits:2 }).format(num); };\nexport const formatQty = (v)=> { const n = Number(v)||0; return n.toLocaleString('en-IN'); };\n",
    "PODocument.js": "import React from 'react';\nimport { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from './components/ui/table';\nimport { formatINR } from './utils/formatters';\n\n// Named export per conventions\nexport const PODocument = React.forwardRef(({ data }, ref) => {\n  const { logoUrl, poNumber, buyer, supplier, meta, summaryRows, matrix, packing, terms, authorisers } = data;\n  return (\n    <div ref={ref} className=\"po-doc\" data-testid=\"po-print-document\">\n      {/* Header */}\n      <div className=\"flex items-start justify-between mb-3 avoid-break\">\n        <div className=\"flex items-center gap-3\">\n          {logoUrl ? (<img src={logoUrl} alt=\"Buyer Logo\" style={{ height: '28pt' }} />) : null}\n        </div>\n        <div className=\"text-right\">\n          <div className=\"po-section-title\">Purchase Order</div>\n          <div className=\"text-[10pt]\">PO No: <span className=\"font-medium\">{poNumber}</span></div>\n        </div>\n      </div>\n\n      {/* Addresses */}\n      <div className=\"grid grid-cols-2 gap-6 mb-3 avoid-break\">\n        <div>\n          <div className=\"po-section-title mb-1\">Buyer</div>\n          <div className=\"whitespace-pre-wrap text-[9.5pt]\">{buyer}</div>\n        </div>\n        <div>\n          <div className=\"po-section-title mb-1\">Supplier / Factory</div>\n          <div className=\"whitespace-pre-wrap text-[9.5pt]\">{supplier}</div>\n        </div>\n      </div>\n\n      {/* Meta strip */}\n      <div className=\"flex flex-wrap items-center gap-2 mb-3 avoid-break\">\n        {meta?.poDate && <span className=\"po-chip\" data-testid=\"po-meta-po-date\">PO Date: {meta.poDate}</span>}\n        {meta?.deliveryDate && <span className=\"po-chip\" data-testid=\"po-meta-delivery-date\">Delivery: {meta.deliveryDate}</span>}\n        {meta?.paymentTerms && <span className=\"po-chip\" data-testid=\"po-meta-payment-terms\">Payment: {meta.paymentTerms}</span>}\n        {meta?.deliveryTerms && <span className=\"po-chip\" data-testid=\"po-meta-delivery-terms\">Delivery Terms: {meta.deliveryTerms}</span>}\n      </div>\n\n      {/* Order Summary */}\n      {Array.isArray(summaryRows) && summaryRows.length>0 && (\n        <div className=\"mb-3 avoid-break\">\n          <div className=\"po-section-title mb-1\">Order Summary</div>\n          <table className=\"po-table\">\n            <thead>\n              <tr>\n                <th>Style</th><th>Description</th><th>Unit</th><th>Qty</th><th>Unit Price</th><th>Amount</th>\n              </tr>\n            </thead>\n            <tbody>\n              {summaryRows.map((r,idx)=>{\n                const amount = (Number(r.qty)||0) * (Number(r.unitPrice)||0);\n                return (\n                  <tr key={idx} className=\"po-row\">\n                    <td>{r.style}</td>\n                    <td>{r.description}</td>\n                    <td>{r.unit||'pcs'}</td>\n                    <td className=\"text-right\">{Number(r.qty)||0}</td>\n                    <td className=\"text-right\">{formatINR(r.unitPrice)}</td>\n                    <td className=\"text-right\">{formatINR(amount)}</td>\n                  </tr>\n                );\n              })}\n            </tbody>\n          </table>\n        </div>\n      )}\n\n      {/* Size–Colour Matrix */}\n      {matrix && matrix.sizes?.length>0 && matrix.colors?.length>0 && (\n        <div className=\"mb-3 avoid-break\">\n          <div className=\"po-section-title mb-1\">Size–Colour Breakdown</div>\n          <table className=\"po-table\">\n            <thead>\n              <tr>\n                <th>Color</th>\n                {matrix.sizes.map((s,i)=> (<th key={i}>{s}</th>))}\n                <th>Total</th>\n              </tr>\n            </thead>\n            <tbody>\n              {matrix.colors.map((c,ri)=>{\n                const rowTotal = matrix.sizes.reduce((acc,s)=> acc + (Number(matrix.values?.[c]?.[s])||0),0);\n                return (\n                  <tr key={ri} className=\"po-row\">\n                    <td>{c}</td>\n                    {matrix.sizes.map((s,ci)=> (<td key={ci} className=\"text-right\">{Number(matrix.values?.[c]?.[s])||0}</td>))}\n                    <td className=\"text-right\">{rowTotal}</td>\n                  </tr>\n                );\n              })}\n            </tbody>\n            <tfoot>\n              <tr>\n                <td className=\"font-semibold\">Total</td>\n                {matrix.sizes.map((s,ci)=>{\n                  const colTotal = matrix.colors.reduce((acc,c)=> acc + (Number(matrix.values?.[c]?.[s])||0),0);\n                  return <td key={ci} className=\"text-right font-semibold\">{colTotal}</td>;\n                })}\n                <td className=\"text-right font-semibold\">{matrix.grandTotal}</td>\n              </tr>\n            </tfoot>\n          </table>\n        </div>\n      )}\n\n      {/* Packing Instructions */}\n      {packing && (\n        <div className=\"mb-3 avoid-break\">\n          <div className=\"po-section-title mb-1\">Packing Instructions</div>\n          <div className=\"whitespace-pre-wrap\">{packing}</div>\n        </div>\n      )}\n\n      {/* Other Terms */}\n      {terms && (\n        <div className=\"mb-3 avoid-break\">\n          <div className=\"po-section-title mb-1\">Other Terms</div>\n          <div className=\"whitespace-pre-wrap\">{terms}</div>\n        </div>\n      )}\n\n      {/* Authorisation */}\n      <div className=\"grid grid-cols-2 gap-6 mt-6 avoid-break\">\n        <div style={{ minHeight: '50pt' }} className=\"border border-[#D1D5DB] p-2\">\n          <div style={{ height: '36pt' }} />\n          <div className=\"text-[9pt]\">Authorised Signatory</div>\n        </div>\n        <div style={{ minHeight: '50pt' }} className=\"border border-[#D1D5DB] p-2\">\n          <div style={{ height: '36pt' }} />\n          <div className=\"text-[9pt]\">Supplier Acceptance</div>\n        </div>\n      </div>\n    </div>\n  );\n});\n" ,
    "POEditorPage.js": "import React, { useMemo, useRef, useState } from 'react';\nimport { Button } from './components/ui/button';\nimport { Input } from './components/ui/input';\nimport { Textarea } from './components/ui/textarea';\nimport { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';\nimport { Popover, PopoverContent, PopoverTrigger } from './components/ui/popover';\nimport { Calendar } from './components/ui/calendar';\nimport { Dialog, DialogContent, DialogHeader, DialogTitle } from './components/ui/dialog';\nimport { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from './components/ui/table';\nimport { Toaster } from './components/ui/sonner';\nimport { formatINR } from './utils/formatters';\nimport { useReactToPrint } from 'react-to-print';\nimport { PODocument } from './PODocument';\n\nexport default function POEditorPage(){\n  const [data, setData] = useState({ sizes:['XS','S','M','L','XL'], colors:['Black','White'], values:{}, grandTotal:0 });\n  const [meta, setMeta] = useState({ poDate:'', deliveryDate:'', paymentTerms:'', deliveryTerms:'' });\n  const [openPreview, setOpenPreview] = useState(false);\n  const printRef = useRef();\n  const handlePrint = useReactToPrint({ content: ()=> printRef.current });\n\n  const updateCell = (color,size,val)=>{\n    setData(prev=>{\n      const values = { ...prev.values, [color]: { ...(prev.values?.[color]||{}), [size]: Number(val)||0 } };\n      const grand = (prev.colors||[]).reduce((acc,c)=> acc + (prev.sizes||[]).reduce((a,s)=> a + (Number(values?.[c]?.[s])||0),0),0);\n      return { ...prev, values, grandTotal: grand };\n    });\n  };\n\n  return (\n    <div className=\"max-w-[1100px] mx-auto px-4 md:px-6 py-6\">\n      <div className=\"flex items-center justify-between mb-4\">\n        <h1 className=\"text-xl font-semibold\">Newline Apparel – PO Generator</h1>\n        <div className=\"flex gap-2\">\n          <Button data-testid=\"po-form-preview-button\" onClick={()=> setOpenPreview(true)}>Preview</Button>\n          <Button data-testid=\"po-form-save-button\" variant=\"secondary\">Save</Button>\n        </div>\n      </div>\n\n      {/* Meta strip inputs */}\n      <div className=\"grid md:grid-cols-4 gap-3 mb-6\">\n        <Input data-testid=\"po-form-po-number-input\" placeholder=\"PO Number\"/>\n        <Popover>\n          <PopoverTrigger asChild>\n            <Button variant=\"secondary\" data-testid=\"po-form-po-date\">PO Date: {meta.poDate||'Select'}</Button>\n          </PopoverTrigger>\n          <PopoverContent align=\"start\">\n            <Calendar mode=\"single\" onSelect={(d)=> setMeta(m=>({...m, poDate: d?.toLocaleDateString('en-GB')}))} />\n          </PopoverContent>\n        </Popover>\n        <Popover>\n          <PopoverTrigger asChild>\n            <Button variant=\"secondary\" data-testid=\"po-form-delivery-date\">Delivery Date: {meta.deliveryDate||'Select'}</Button>\n          </PopoverTrigger>\n          <PopoverContent align=\"start\">\n            <Calendar mode=\"single\" onSelect={(d)=> setMeta(m=>({...m, deliveryDate: d?.toLocaleDateString('en-GB')}))} />\n          </PopoverContent>\n        </Popover>\n        <Input data-testid=\"po-form-payment-terms\" placeholder=\"Payment Terms\"/>\n      </div>\n\n      {/* Size-Colour Matrix UI */}\n      <div className=\"overflow-auto border rounded-md\">\n        <table className=\"w-full text-sm\" data-testid=\"matrix-table\">\n          <thead className=\"bg-neutral-100\">\n            <tr>\n              <th className=\"text-left p-2 min-w-[120px]\">Color</th>\n              {data.sizes.map((s,i)=> (<th key={i} className=\"text-right p-2\" data-testid={\`matrix-size-header-${s}\`}>{s}</th>))}\n              <th className=\"text-right p-2\">Total</th>\n            </tr>\n          </thead>\n          <tbody>\n            {data.colors.map((c,ri)=>{\n              const rowTotal = data.sizes.reduce((acc,s)=> acc + (Number(data.values?.[c]?.[s])||0),0);\n              return (\n                <tr key={ri} data-testid={\`matrix-color-row-${c}\`}>\n                  <td className=\"p-2\">{c}</td>\n                  {data.sizes.map((s,ci)=> (\n                    <td key={ci} className=\"p-1\">\n                      <Input inputMode=\"numeric\" data-testid={\`matrix-cell-${c}-${s}\`} value={data.values?.[c]?.[s]||''} onChange={(e)=> updateCell(c,s,e.target.value)} className=\"h-8 text-right\" />\n                    </td>\n                  ))}\n                  <td className=\"p-2 text-right\" data-testid=\"matrix-total-row\">{rowTotal}</td>\n                </tr>\n              )})}\n          </tbody>\n          <tfoot>\n            <tr className=\"font-medium\">\n              <td>Total</td>\n              {data.sizes.map((s,ci)=>{\n                const colTotal = data.colors.reduce((acc,c)=> acc + (Number(data.values?.[c]?.[s])||0),0);\n                return <td key={ci} className=\"p-2 text-right\" data-testid=\"matrix-total-column\">{colTotal}</td>;\n              })}\n              <td className=\"p-2 text-right\" data-testid=\"matrix-grand-total\">{data.grandTotal}</td>\n            </tr>\n          </tfoot>\n        </table>\n      </div>\n\n      {/* Preview / Print */}\n      <Dialog open={openPreview} onOpenChange={setOpenPreview}>\n        <DialogContent className=\"max-w-[900px]\" data-testid=\"po-preview-dialog\">\n          <DialogHeader><DialogTitle>Print Preview</DialogTitle></DialogHeader>\n          <div className=\"border rounded\">\n            <div ref={printRef}>\n              <PODocument data={{ poNumber: 'PO-0001', buyer: 'Buyer Name\nStreet\nCity', supplier:'Supplier Name\nStreet\nCity', meta, summaryRows:[], matrix:{ sizes:data.sizes, colors:data.colors, values:data.values, grandTotal:data.grandTotal }, packing:'', terms:'', authorisers:{} }} />\n            </div>\n          </div>\n          <div className=\"flex justify-end gap-2\">\n            <Button variant=\"secondary\" onClick={()=> setOpenPreview(false)}>Close</Button>\n            <Button data-testid=\"po-export-pdf-button\" onClick={handlePrint}>Export PDF</Button>\n          </div>\n        </DialogContent>\n      </Dialog>\n      <Toaster />\n    </div>\n  );\n}\n"
  },
  "libraries": {
    "required": [
      {"name": "react-to-print", "why": "Exact A4 print/PDF via browser print dialog", "install": "npm i react-to-print"},
      {"name": "react-hook-form", "why": "Robust form control", "install": "npm i react-hook-form"},
      {"name": "zod", "why": "Validation schemas", "install": "npm i zod"},
      {"name": "date-fns", "why": "Date formatting/parsing for meta dates", "install": "npm i date-fns"}
    ],
    "optional": [
      {"name": "@tanstack/react-table", "why": "Advanced List View tables if needed", "install": "npm i @tanstack/react-table"}
    ]
  },
  "micro_interactions": {
    "rules": [
      "Hover states only in app UI, never affect print.",
      "Focus-visible rings for all interactive controls using Tailwind focus-visible:ring-2 focus-visible:ring-neutral-900.",
      "Section headers slide-fade in on first mount (framer-motion optional), but disable animations in print with @media print."
    ],
    "specifics": {
      "button_hover": "hover:bg-neutral-800 transition-colors",
      "table_row_hover": "hover:bg-neutral-50",
      "chip_hover": "hover:border-neutral-300"
    }
  },
  "accessibility": {
    "contrast": "Maintain WCAG AA. Headers on #F5F5F7 with #111827 text meet contrast.",
    "focus": "Visible focus ring on all interactive elements.",
    "keyboard": "Matrix grid supports Tab and Arrow navigation; inputs announce row/column via aria-label (e.g., \"Quantity for Black, size M\").",
    "print": "12mm margins guarantee printer safety; repeated headers via thead display rule.",
    "aria_examples": [
      "<Input aria-label=\"PO Number\" data-testid=\"po-form-po-number-input\" />",
      "<Input aria-label=\"Quantity for Black, size M\" data-testid=\"matrix-cell-Black-M\" />"
    ]
  },
  "testing": {
    "policy": "Every interactive or critical informational element MUST include a data-testid attribute in kebab-case describing its role.",
    "examples": [
      "data-testid=\"po-list-search-input\"",
      "data-testid=\"po-form-save-button\"",
      "data-testid=\"matrix-cell-black-m\"",
      "data-testid=\"po-export-pdf-button\"",
      "data-testid=\"po-print-document\""
    ]
  },
  "image_urls": [
    {
      "url": "https://images.unsplash.com/photo-1527089923023-4bbd20fb5d15?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwzfHxtaW5pbWFsJTIwbW9ub2Nocm9tZSUyMHRleHRpbGUlMjBmYWN0b3J5JTIwbG9nbyUyMG1hcmt8ZW58MHx8fHwxNzYwNDY0ODU1fDA&ixlib=rb-4.1.0&q=85",
      "category": "logo-placeholder",
      "description": "Neutral fabric texture placeholder usable behind a monochrome logo (UI only, not in print doc)."
    },
    {
      "url": "https://images.pexels.com/photos/5477692/pexels-photo-5477692.jpeg",
      "category": "empty-state",
      "description": "Minimal apparel tag image for List View empty state card."
    },
    {
      "url": "https://images.pexels.com/photos/3850570/pexels-photo-3850570.jpeg",
      "category": "materials",
      "description": "Clean textile still for marketing blurb tile (dashboard header)."
    }
  ],
  "usage_notes": {
    "tables": [
      "Use shadcn Table for UI tables; for print tables in PODocument use semantic <table> with .po-table class for pt borders and header background.",
      "Header cells: semibold; bg #F5F5F7; border #D1D5DB at 0.5–0.75pt; padding 6–8px; maintain min row height 18–20px."
    ],
    "currencies": "Always show \u20B9 with thousand separators. Use formatINR util.",
    "page_setup": "In the print dialog: A4, Portrait, Margins=Default, Scale=100%, Headers/Footers=off.",
    "page_break_control": "Apply .avoid-break to header, addresses, meta strip, and matrix; use .page-break to force new page before Authorisation if previous sections overflow."
  },
  "pages": {
    "routes": [
      {"path": "/", "name": "PO List"},
      {"path": "/po/new", "name": "Create PO"},
      {"path": "/po/:id", "name": "Edit PO"}
    ],
    "po_list_layout": "Toolbar with search + supplier filter + New PO button; table listing POs with PO Number, Date, Supplier; pagination.",
    "po_editor_layout": "Two-column responsive form groups; matrix block full width; preview dialog with PODocument inside."
  },
  "fonts": {
    "load_via": "Google Fonts or local system; prefer Inter. Example: <link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap\" rel=\"stylesheet\">",
    "feature_settings": "font-feature-settings: 'tnum' 1, 'liga' 1;"
  },
  "instructions_to_main_agent": {
    "priority": [
      "Match exact print specs: A4, 12mm margins, monochrome, pt sizes.",
      "Use shadcn/ui for all interactive UI; use semantic HTML table for the print document with .po-* classes.",
      "All interactive and critical elements must include data-testid attributes.",
      "Do not apply universal transition: all. Only use transition-colors on buttons/links.",
      "No gradients inside the print document; app chrome can use subtle neutrals only.",
      "If matrix exceeds one page, let it break after full rows only (avoid-break on tbody rows)."
    ],
    "file_tasks": [
      "Add the CSS from print_css.snippet into a global print stylesheet or index.css bottom.",
      "Add tokens_and_tailwind.css_custom_properties to :root in index.css.",
      "Implement PODocument.js and POEditorPage.js using .js modules (not .tsx).",
      "Wire react-to-print in the preview dialog to export A4 PDF.",
      "Validate inputs with react-hook-form + zod in the editor scaffold (expand on provided basics).",
      "Use shadcn Calendar for dates inside Popover; never native <input type=\"date\"> for consistency."
    ],
    "qa_checklist": [
      "Printed PDF shows clean 12mm margin all sides; no clipping.",
      "Table headers repeat across pages; borders visible at 0.5–0.75pt.",
      "Text sizes: headers ~12–13pt; body 9–10pt; chips 9pt.",
      "Currency uses \u20B9 and thousand separators.",
      "Matrix totals correct for rows, columns, and grand total."
    ]
  },
  "general_ui_ux_guidelines": "- You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms\n- You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text\n- NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json\n\n **GRADIENT RESTRICTION RULE**\nNEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc\nNEVER use dark gradients for logo, testimonial, footer etc\nNEVER let gradients cover more than 20% of the viewport.\nNEVER apply gradients to text-heavy content or reading areas.\nNEVER use gradients on small UI elements (<100px width).\nNEVER stack multiple gradient layers in the same viewport.\n\n**ENFORCEMENT RULE:**\n    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors\n\n**How and where to use:**\n   • Section backgrounds (not content backgrounds)\n   • Hero section header content. Eg: dark to light to dark color\n   • Decorative overlays and accent elements only\n   • Hero section with 2-3 mild color\n   • Gradients creation can be done for any angle say horizontal, vertical or diagonal\n\n- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**\n\n</Font Guidelines>\n\n- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead. \n   \n- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.\n\n- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.\n   \n- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly\n    Eg: - if it implies playful/energetic, choose a colorful scheme\n           - if it implies monochrome/minimal, choose a black–white/neutral scheme\n\n**Component Reuse:**\n	- Prioritize using pre-existing components from src/components/ui when applicable\n	- Create new components that match the style and conventions of existing components when needed\n	- Examine existing components to understand the project's component patterns before creating new ones\n\n**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component\n\n**Best Practices:**\n	- Use Shadcn/UI as the primary component library for consistency and accessibility\n	- Import path: ./components/[component-name]\n\n**Export Conventions:**\n	- Components MUST use named exports (export const ComponentName = ...)\n	- Pages MUST use default exports (export default function PageName() {...})\n\n**Toasts:**\n  - Use `sonner` for toasts\"\n  - Sonner component are located in `/app/src/components/ui/sonner.tsx`\n\nUse 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals."
}