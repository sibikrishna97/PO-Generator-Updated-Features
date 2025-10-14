import React from 'react';
import { formatINR, formatQty } from '../utils/formatters';

export const PODocument = React.forwardRef(({ data }, ref) => {
  const { 
    logoUrl, 
    poNumber, 
    billTo,
    buyer, 
    supplier, 
    meta, 
    orderLines,
    matrix, 
    packing, 
    terms, 
    authorisation 
  } = data;

  // Calculate order summary totals
  const subtotal = orderLines?.reduce((sum, line) => {
    return sum + (Number(line.quantity) * Number(line.unit_price));
  }, 0) || 0;

  return (
    <div ref={ref} className="po-doc" data-testid="po-print-document">
      {/* Header */}
      <div className="flex items-start justify-between mb-3 avoid-break">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt="Company Logo" style={{ height: '28pt' }} />
          ) : (
            <div style={{ height: '28pt', width: '60pt', background: '#F5F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8pt' }}>Logo</div>
          )}
        </div>
        <div className="text-right">
          <div className="po-section-title">Purchase Order</div>
          <div className="text-[10pt]">PO No: <span className="font-medium">{poNumber}</span></div>
        </div>
      </div>

      {/* Top Address Band - Bill To & Buyer */}
      <div className="grid grid-cols-2 gap-6 mb-3 avoid-break">
        <div>
          <div className="po-section-title mb-1">Bill To (Invoice Party)</div>
          <div className="text-[9.5pt]">{billTo?.company}</div>
          {billTo?.address_lines?.map((line, idx) => (
            <div key={idx} className="text-[9.5pt]">{line}</div>
          ))}
          {billTo?.gstin && <div className="text-[9.5pt]">GSTIN: {billTo.gstin}</div>}
          {billTo?.contact_name && <div className="text-[9.5pt]">Contact: {billTo.contact_name}</div>}
          {billTo?.phone && <div className="text-[9.5pt]">Phone: {billTo.phone}</div>}
        </div>
        <div>
          <div className="po-section-title mb-1">Buyer</div>
          <div className="text-[9.5pt]">{buyer?.company}</div>
          {buyer?.address_lines?.map((line, idx) => (
            <div key={idx} className="text-[9.5pt]">{line}</div>
          ))}
          {buyer?.gstin && <div className="text-[9.5pt]">GSTIN: {buyer.gstin}</div>}
        </div>
      </div>

      {/* Supplier Block - Full Width */}
      <div className="mb-3 avoid-break">
        <div className="po-section-title mb-1">Supplier / Factory</div>
        <div className="text-[9.5pt]">
          <strong>{supplier?.company}</strong>
        </div>
        {supplier?.address_lines?.map((line, idx) => (
          <div key={idx} className="text-[9.5pt]">{line}</div>
        ))}
        <div className="flex gap-4 mt-1">
          {supplier?.gstin && <span className="text-[9.5pt]">GSTIN: {supplier.gstin}</span>}
          {supplier?.contact_name && <span className="text-[9.5pt]">Contact: {supplier.contact_name}</span>}
          {supplier?.phone && <span className="text-[9.5pt]">Phone: {supplier.phone}</span>}
        </div>
      </div>

      {/* Meta strip */}
      <div className="flex flex-wrap items-center gap-2 mb-3 avoid-break">
        {meta?.poDate && <span className="po-chip" data-testid="po-meta-po-date">PO Date: {meta.poDate}</span>}
        {meta?.deliveryDate && <span className="po-chip" data-testid="po-meta-delivery-date">Delivery: {meta.deliveryDate}</span>}
        {meta?.paymentTerms && <span className="po-chip" data-testid="po-meta-payment-terms">Payment: {meta.paymentTerms}</span>}
        {meta?.deliveryTerms && <span className="po-chip" data-testid="po-meta-delivery-terms">Delivery Terms: {meta.deliveryTerms}</span>}
      </div>

      {/* Order Summary */}
      {Array.isArray(orderLines) && orderLines.length > 0 && (
        <div className="mb-3 avoid-break">
          <div className="po-section-title mb-1">Order Summary</div>
          <table className="po-table">
            <thead>
              <tr>
                <th>Style Code</th>
                <th>Description</th>
                <th>Fabric & GSM</th>
                <th>Colours</th>
                <th>Size Range</th>
                <th className="text-right">Quantity</th>
                <th className="text-right">Unit Price</th>
                <th className="text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {orderLines.map((line, idx) => {
                const amount = Number(line.quantity) * Number(line.unit_price);
                return (
                  <tr key={idx} className="po-row">
                    <td>{line.style_code}</td>
                    <td style={{ whiteSpace: 'pre-wrap' }}>{line.product_description}</td>
                    <td>{line.fabric_gsm}</td>
                    <td>{line.colors?.join(', ')}</td>
                    <td>{line.size_range?.join(', ')}</td>
                    <td className="text-right">{formatQty(line.quantity)}</td>
                    <td className="text-right">{formatINR(line.unit_price)}</td>
                    <td className="text-right">{formatINR(amount)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="7" className="text-right font-semibold">Subtotal</td>
                <td className="text-right font-semibold">{formatINR(subtotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Size–Colour Matrix */}
      {matrix && matrix.sizes?.length > 0 && matrix.colors?.length > 0 && (
        <div className="mb-3 avoid-break">
          <div className="po-section-title mb-1">Size–Colour Breakdown</div>
          <table className="po-table">
            <thead>
              <tr>
                <th>Colour</th>
                {matrix.sizes.map((size, i) => (
                  <th key={i} className="text-right">{size}</th>
                ))}
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {matrix.colors.map((color, ri) => {
                const rowTotal = matrix.sizes.reduce((acc, size) => {
                  return acc + (Number(matrix.values?.[color]?.[size]) || 0);
                }, 0);
                return (
                  <tr key={ri} className="po-row">
                    <td>{color}</td>
                    {matrix.sizes.map((size, ci) => (
                      <td key={ci} className="text-right">
                        {Number(matrix.values?.[color]?.[size]) || 0}
                      </td>
                    ))}
                    <td className="text-right font-medium">{rowTotal}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td className="font-semibold">Total</td>
                {matrix.sizes.map((size, ci) => {
                  const colTotal = matrix.colors.reduce((acc, color) => {
                    return acc + (Number(matrix.values?.[color]?.[size]) || 0);
                  }, 0);
                  return (
                    <td key={ci} className="text-right font-semibold">{colTotal}</td>
                  );
                })}
                <td className="text-right font-semibold">{matrix.grandTotal || 0}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Packing Instructions */}
      {packing && Object.values(packing).some(v => v) && (
        <div className="mb-3 avoid-break">
          <div className="po-section-title mb-1">Packing Instructions</div>
          <div className="text-[9.5pt]">
            {packing.folding && <div><strong>Folding:</strong> {packing.folding}</div>}
            {packing.packing_type && <div><strong>Packing Type:</strong> {packing.packing_type}</div>}
            {packing.size_packing && <div><strong>Size & Packing:</strong> {packing.size_packing}</div>}
            {packing.polybag && <div><strong>Polybag:</strong> {packing.polybag}</div>}
            {packing.carton_bag_markings && <div style={{ whiteSpace: 'pre-wrap' }}><strong>Carton/Bag Markings:</strong> {packing.carton_bag_markings}</div>}
            {packing.packing_ratio && <div><strong>Packing Ratio:</strong> {packing.packing_ratio}</div>}
          </div>
        </div>
      )}

      {/* Other Terms */}
      {terms && Object.values(terms).some(v => v) && (
        <div className="mb-3 avoid-break">
          <div className="po-section-title mb-1">Other Terms</div>
          <div className="text-[9.5pt]">
            {terms.qc && <div style={{ whiteSpace: 'pre-wrap' }}><strong>QC:</strong> {terms.qc}</div>}
            {terms.labels_tags && <div style={{ whiteSpace: 'pre-wrap' }}><strong>Labels/Tags:</strong> {terms.labels_tags}</div>}
            {terms.shortage_excess && <div><strong>Shortage/Excess:</strong> {terms.shortage_excess}</div>}
            {terms.penalty && <div><strong>Penalty:</strong> {terms.penalty}</div>}
            {terms.notes && <div style={{ whiteSpace: 'pre-wrap' }}><strong>Additional Notes:</strong> {terms.notes}</div>}
          </div>
        </div>
      )}

      {/* Authorisation */}
      <div className="grid grid-cols-2 gap-6 mt-6 avoid-break">
        <div style={{ minHeight: '70pt' }} className="border border-[#D1D5DB] p-2">
          <div className="po-section-title mb-1">For Newline Apparel</div>
          {authorisation?.buyer_designation && (
            <div className="text-[9pt] mb-1">{authorisation.buyer_designation}</div>
          )}
          <div style={{ height: '36pt', borderBottom: '0.5pt solid #D1D5DB', marginBottom: '4pt' }} />
          <div className="text-[9pt]">
            {authorisation?.buyer_name ? `Name: ${authorisation.buyer_name}` : 'Authorised Signatory'}
          </div>
        </div>
        <div style={{ minHeight: '70pt' }} className="border border-[#D1D5DB] p-2">
          <div className="po-section-title mb-1">For Supplier/Factory</div>
          {authorisation?.supplier_designation && (
            <div className="text-[9pt] mb-1">{authorisation.supplier_designation}</div>
          )}
          <div style={{ height: '36pt', borderBottom: '0.5pt solid #D1D5DB', marginBottom: '4pt' }} />
          <div className="text-[9pt]">
            {authorisation?.supplier_name ? `Name: ${authorisation.supplier_name}` : 'Authorised Signatory'}
          </div>
        </div>
      </div>
    </div>
  );
});

PODocument.displayName = 'PODocument';