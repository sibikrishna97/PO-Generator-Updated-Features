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
      {/* Header - Logo and Title on same line */}
      <div className="flex items-center justify-between mb-4 avoid-break">
        <div className="flex items-center gap-4">
          {logoUrl ? (
            <img src={logoUrl} alt="Company Logo" style={{ height: '32pt', width: 'auto' }} />
          ) : (
            <div style={{ 
              height: '32pt', 
              width: '80pt', 
              border: '1px dashed #D1D5DB', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '8pt',
              color: '#9CA3AF'
            }}>
              Logo Here
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="po-section-title" style={{ fontSize: '14pt' }}>Purchase Order</div>
          <div className="text-[10pt] mt-1">PO No: <span className="font-medium">{poNumber}</span></div>
        </div>
      </div>

      {/* Top Address Band - Bill To & Buyer with borders */}
      <div className="grid grid-cols-2 gap-4 mb-3 avoid-break">
        <div style={{ border: '0.75pt solid #D1D5DB', borderRadius: '4px', padding: '8px' }}>
          <div className="po-section-title mb-2" style={{ fontSize: '10pt' }}>Bill To (Invoice Party)</div>
          <div className="text-[9pt] font-medium">{billTo?.company}</div>
          {billTo?.address_lines?.map((line, idx) => (
            <div key={idx} className="text-[9pt]">{line}</div>
          ))}
          {billTo?.gstin && <div className="text-[9pt] mt-1">GSTIN: {billTo.gstin}</div>}
          {billTo?.contact_name && <div className="text-[9pt]">Contact: {billTo.contact_name}</div>}
          {billTo?.phone && <div className="text-[9pt]">Phone: {billTo.phone}</div>}
        </div>
        <div style={{ border: '0.75pt solid #D1D5DB', borderRadius: '4px', padding: '8px', backgroundColor: '#FAFAFA' }}>
          <div className="po-section-title mb-2" style={{ fontSize: '10pt' }}>Buyer</div>
          <div className="text-[9pt] font-medium">{buyer?.company}</div>
          {buyer?.address_lines?.map((line, idx) => (
            <div key={idx} className="text-[9pt]">{line}</div>
          ))}
          {buyer?.gstin && <div className="text-[9pt] mt-1">GSTIN: {buyer.gstin}</div>}
        </div>
      </div>

      {/* Supplier Block - Full Width with border */}
      <div className="mb-3 avoid-break" style={{ border: '0.75pt solid #D1D5DB', borderRadius: '4px', padding: '8px' }}>
        <div className="po-section-title mb-2" style={{ fontSize: '10pt' }}>Supplier / Factory (Ship From)</div>
        <div className="text-[9pt] font-medium">{supplier?.company}</div>
        {supplier?.address_lines?.map((line, idx) => (
          <div key={idx} className="text-[9pt]">{line}</div>
        ))}
        <div className="flex gap-4 mt-1 text-[9pt]">
          {supplier?.gstin && <span>GSTIN: {supplier.gstin}</span>}
          {supplier?.contact_name && <span>Contact: {supplier.contact_name}</span>}
          {supplier?.phone && <span>Phone: {supplier.phone}</span>}
        </div>
      </div>

      {/* PO Meta Details - Table Format */}
      <div className="mb-3 avoid-break">
        <table className="po-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th style={{ width: '25%', fontSize: '9pt' }}>PO Date</th>
              <th style={{ width: '25%', fontSize: '9pt' }}>Delivery Date</th>
              <th style={{ width: '25%', fontSize: '9pt' }}>Payment Terms</th>
              <th style={{ width: '25%', fontSize: '9pt' }}>Delivery Terms</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ fontSize: '9pt' }}>{meta?.poDate || 'N/A'}</td>
              <td style={{ fontSize: '9pt' }}>{meta?.deliveryDate || 'N/A'}</td>
              <td style={{ fontSize: '9pt' }}>{meta?.paymentTerms || 'N/A'}</td>
              <td style={{ fontSize: '9pt' }}>{meta?.deliveryTerms || 'N/A'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Order Summary */}
      {Array.isArray(orderLines) && orderLines.length > 0 && (
        <div className="mb-3 avoid-break">
          <div className="po-section-title mb-2" style={{ fontSize: '11pt', fontWeight: '600' }}>Order Summary</div>
          <table className="po-table">
            <thead>
              <tr>
                <th style={{ fontSize: '9.5pt' }}>Style Code</th>
                <th style={{ fontSize: '9.5pt' }}>Description</th>
                <th style={{ fontSize: '9.5pt' }}>Fabric & GSM</th>
                <th style={{ fontSize: '9.5pt' }}>Colours</th>
                <th style={{ fontSize: '9.5pt' }}>Size Range</th>
                <th style={{ fontSize: '9.5pt', textAlign: 'right' }}>Quantity</th>
                <th style={{ fontSize: '9.5pt', textAlign: 'right' }}>Unit Price</th>
                <th style={{ fontSize: '9.5pt', textAlign: 'right' }}>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {orderLines.map((line, idx) => {
                const amount = Number(line.quantity) * Number(line.unit_price);
                return (
                  <tr key={idx} className="po-row">
                    <td style={{ fontSize: '9pt' }}>{line.style_code}</td>
                    <td style={{ fontSize: '9pt', whiteSpace: 'pre-wrap' }}>{line.product_description}</td>
                    <td style={{ fontSize: '9pt' }}>{line.fabric_gsm}</td>
                    <td style={{ fontSize: '9pt' }}>{line.colors?.join(', ') || 'N/A'}</td>
                    <td style={{ fontSize: '9pt' }}>{line.size_range?.join(', ') || 'N/A'}</td>
                    <td style={{ fontSize: '9pt', textAlign: 'right' }}>{formatQty(line.quantity)}</td>
                    <td style={{ fontSize: '9pt', textAlign: 'right' }}>{formatINR(line.unit_price)}</td>
                    <td style={{ fontSize: '9pt', textAlign: 'right' }}>{formatINR(amount)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="7" style={{ fontSize: '9.5pt', textAlign: 'right', fontWeight: '600' }}>Subtotal</td>
                <td style={{ fontSize: '9.5pt', textAlign: 'right', fontWeight: '600' }}>{formatINR(subtotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Size–Colour Breakdown */}
      {matrix && matrix.sizes?.length > 0 && matrix.colors?.length > 0 && (
        <div className="mb-3 avoid-break" style={{ borderTop: '1pt solid #D1D5DB', paddingTop: '8px' }}>
          <div className="po-section-title mb-2" style={{ fontSize: '11pt', fontWeight: '600' }}>Size–Colour Breakdown</div>
          <table className="po-table">
            <thead>
              <tr>
                <th style={{ fontSize: '9.5pt' }}>Colour</th>
                {matrix.sizes.map((size, i) => (
                  <th key={i} style={{ fontSize: '9.5pt', textAlign: 'right' }}>{size}</th>
                ))}
                <th style={{ fontSize: '9.5pt', textAlign: 'right', fontWeight: '600' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {matrix.colors.map((color, ri) => {
                const rowTotal = matrix.sizes.reduce((acc, size) => {
                  return acc + (Number(matrix.values?.[color]?.[size]) || 0);
                }, 0);
                return (
                  <tr key={ri} className="po-row">
                    <td style={{ fontSize: '9pt' }}>{color}</td>
                    {matrix.sizes.map((size, ci) => (
                      <td key={ci} style={{ fontSize: '9pt', textAlign: 'right' }}>
                        {Number(matrix.values?.[color]?.[size]) || 0}
                      </td>
                    ))}
                    <td style={{ fontSize: '9pt', textAlign: 'right', fontWeight: '500' }}>{rowTotal}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ fontWeight: '600' }}>
                <td style={{ fontSize: '9.5pt' }}>Total</td>
                {matrix.sizes.map((size, ci) => {
                  const colTotal = matrix.colors.reduce((acc, color) => {
                    return acc + (Number(matrix.values?.[color]?.[size]) || 0);
                  }, 0);
                  return (
                    <td key={ci} style={{ fontSize: '9.5pt', textAlign: 'right' }}>{colTotal}</td>
                  );
                })}
                <td style={{ fontSize: '9.5pt', textAlign: 'right' }}>{matrix.grandTotal || 0}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Packing Instructions - Table Format */}
      {packing && Object.values(packing).some(v => v) && (
        <div className="mb-3 avoid-break" style={{ borderTop: '1pt solid #D1D5DB', paddingTop: '8px' }}>
          <div className="po-section-title mb-2" style={{ fontSize: '11pt', fontWeight: '600' }}>Packing Instructions</div>
          <table className="po-table">
            <thead>
              <tr>
                <th style={{ fontSize: '9.5pt', width: '18%' }}>Folding</th>
                <th style={{ fontSize: '9.5pt', width: '18%' }}>Packing Type</th>
                <th style={{ fontSize: '9.5pt', width: '20%' }}>Size & Packing</th>
                <th style={{ fontSize: '9.5pt', width: '16%' }}>Polybag</th>
                <th style={{ fontSize: '9.5pt', width: '28%' }}>Carton/Bag Markings</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontSize: '9pt', verticalAlign: 'top' }}>{packing.folding || '-'}</td>
                <td style={{ fontSize: '9pt', verticalAlign: 'top' }}>{packing.packing_type || '-'}</td>
                <td style={{ fontSize: '9pt', verticalAlign: 'top' }}>{packing.size_packing || '-'}</td>
                <td style={{ fontSize: '9pt', verticalAlign: 'top' }}>{packing.polybag || '-'}</td>
                <td style={{ fontSize: '9pt', verticalAlign: 'top', whiteSpace: 'pre-wrap' }}>{packing.carton_bag_markings || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Other Terms - Two Column Table */}
      {terms && Object.values(terms).some(v => v) && (
        <div className="mb-3 avoid-break" style={{ borderTop: '1pt solid #D1D5DB', paddingTop: '8px' }}>
          <div className="po-section-title mb-2" style={{ fontSize: '11pt', fontWeight: '600' }}>Other Terms</div>
          <table className="po-table">
            <tbody>
              {terms.qc && (
                <tr>
                  <td style={{ fontSize: '9.5pt', fontWeight: '600', width: '20%', verticalAlign: 'top' }}>QC</td>
                  <td style={{ fontSize: '9pt', whiteSpace: 'pre-wrap' }}>{terms.qc}</td>
                </tr>
              )}
              {terms.labels_tags && (
                <tr>
                  <td style={{ fontSize: '9.5pt', fontWeight: '600', width: '20%', verticalAlign: 'top' }}>Labels/Tags</td>
                  <td style={{ fontSize: '9pt', whiteSpace: 'pre-wrap' }}>{terms.labels_tags}</td>
                </tr>
              )}
              {terms.shortage_excess && (
                <tr>
                  <td style={{ fontSize: '9.5pt', fontWeight: '600', width: '20%', verticalAlign: 'top' }}>Shortage/Excess</td>
                  <td style={{ fontSize: '9pt' }}>{terms.shortage_excess}</td>
                </tr>
              )}
              {terms.penalty && (
                <tr>
                  <td style={{ fontSize: '9.5pt', fontWeight: '600', width: '20%', verticalAlign: 'top' }}>Penalty</td>
                  <td style={{ fontSize: '9pt' }}>{terms.penalty}</td>
                </tr>
              )}
              {terms.notes && (
                <tr>
                  <td style={{ fontSize: '9.5pt', fontWeight: '600', width: '20%', verticalAlign: 'top' }}>Additional Notes</td>
                  <td style={{ fontSize: '9pt', whiteSpace: 'pre-wrap' }}>{terms.notes}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Authorisation - Bordered boxes */}
      <div className="grid grid-cols-2 gap-4 mt-6 avoid-break">
        <div style={{ 
          minHeight: '70pt', 
          border: '0.75pt solid #D1D5DB', 
          borderRadius: '4px',
          padding: '10px'
        }}>
          <div className="po-section-title mb-2" style={{ fontSize: '10pt', fontWeight: '600' }}>For Newline Apparel</div>
          {authorisation?.buyer_designation && (
            <div className="text-[9pt] mb-1">{authorisation.buyer_designation}</div>
          )}
          <div style={{ height: '36pt', borderBottom: '0.5pt solid #D1D5DB', marginBottom: '6pt', marginTop: '8pt' }} />
          <div className="text-[9pt]">
            {authorisation?.buyer_name ? `Name: ${authorisation.buyer_name}` : 'Authorised Signatory'}
          </div>
        </div>
        <div style={{ 
          minHeight: '70pt', 
          border: '0.75pt solid #D1D5DB', 
          borderRadius: '4px',
          padding: '10px'
        }}>
          <div className="po-section-title mb-2" style={{ fontSize: '10pt', fontWeight: '600' }}>For Supplier/Factory</div>
          {authorisation?.supplier_designation && (
            <div className="text-[9pt] mb-1">{authorisation.supplier_designation}</div>
          )}
          <div style={{ height: '36pt', borderBottom: '0.5pt solid #D1D5DB', marginBottom: '6pt', marginTop: '8pt' }} />
          <div className="text-[9pt]">
            {authorisation?.supplier_name ? `Name: ${authorisation.supplier_name}` : 'Authorised Signatory'}
          </div>
        </div>
      </div>
    </div>
  );
});

PODocument.displayName = 'PODocument';