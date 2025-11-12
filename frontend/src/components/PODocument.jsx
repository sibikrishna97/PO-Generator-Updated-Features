import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatINR, formatQty } from '../utils/formatters';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const PODocument = React.forwardRef(({ data }, ref) => {
  const { 
    docType = 'PO',
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

  const [settingsLogo, setSettingsLogo] = useState(null);

  useEffect(() => {
    fetchLogo();
  }, []);

  const fetchLogo = async () => {
    try {
      const response = await axios.get(`${API}/settings/logo`);
      if (response.data.logo_base64) {
        setSettingsLogo(response.data.logo_base64);
      }
    } catch (error) {
      console.error('Error fetching logo:', error);
    }
  };

  // Calculate order summary totals
  const subtotal = orderLines?.reduce((sum, line) => {
    return sum + (Number(line.quantity) * Number(line.unit_price));
  }, 0) || 0;

  // Auto-populate colours and sizes from matrix
  // Handle both old format (strings) and new format (objects with name/unitPrice)
  const matrixColours = matrix?.colors?.map(c => typeof c === 'string' ? c : c.name).join(', ') || '';
  const matrixSizeRange = matrix?.sizes?.join(', ') || '';

  return (
    <div ref={ref} className="po-doc" data-testid="po-print-document">
      {/* Use table structure for repeating header */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead className="po-repeating-header">
          <tr>
            <td colSpan="2" style={{ border: 'none', padding: '0', paddingBottom: '8px' }}>
              {/* Header - Title left, Logo right - Repeats on every page */}
              <div className="flex items-start justify-between" style={{ borderBottom: '1px solid #E5E7EB', paddingBottom: '8px' }}>
                <div>
                  <div className="po-section-title" style={{ fontSize: '14pt' }}>
                    {docType === 'PI' ? 'Proforma Invoice' : 'Purchase Order'}
                  </div>
                  <div className="text-[10pt] mt-1">
                    {docType === 'PI' ? 'PI' : 'PO'} No: <span className="font-medium">{poNumber}</span>
                  </div>
                </div>
                <div className="flex items-center">
                  {settingsLogo ? (
                    <img 
                      src={settingsLogo} 
                      alt="Company Logo" 
                      style={{ 
                        maxHeight: '38pt', 
                        maxWidth: '120pt', 
                        width: 'auto',
                        height: 'auto',
                        objectFit: 'contain' 
                      }} 
                    />
                  ) : (
                    <div style={{ 
                      height: '38pt', 
                      width: '100pt', 
                      border: '1px dashed #D1D5DB', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '8pt',
                      color: '#9CA3AF',
                      textAlign: 'center',
                      padding: '4px'
                    }}>
                      Upload Logo in Settings
                    </div>
                  )}
                </div>
              </div>
            </td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan="2" style={{ border: 'none', padding: '0' }}>
              <div style={{ paddingTop: '12px' }}>

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

      {/* Second Row - Supplier & PO Meta side by side */}
      <div className="grid grid-cols-2 gap-4 mb-3 avoid-break">
        {/* Supplier Block - Same size as Bill To */}
        <div style={{ border: '0.75pt solid #D1D5DB', borderRadius: '4px', padding: '8px' }}>
          <div className="po-section-title mb-2" style={{ fontSize: '10pt' }}>Supplier / Factory (Ship From)</div>
          <div className="text-[9pt] font-medium">{supplier?.company}</div>
          {supplier?.address_lines?.map((line, idx) => (
            <div key={idx} className="text-[9pt]">{line}</div>
          ))}
          {supplier?.gstin && <div className="text-[9pt] mt-1">GSTIN: {supplier.gstin}</div>}
          {supplier?.contact_name && <div className="text-[9pt]">Contact: {supplier.contact_name}</div>}
          {supplier?.phone && <div className="text-[9pt]">Phone: {supplier.phone}</div>}
        </div>

        {/* PO Meta Details - As Rows */}
        <div style={{ border: '0.75pt solid #D1D5DB', borderRadius: '4px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', height: '100%' }}>
            <tbody>
              <tr>
                <td style={{ width: '40%', fontSize: '9pt', fontWeight: '600', padding: '6px', border: '0.5pt solid #D1D5DB', backgroundColor: '#F5F5F7' }}>PO Date</td>
                <td style={{ fontSize: '9pt', padding: '6px', border: '0.5pt solid #D1D5DB' }}>{meta?.poDate || 'N/A'}</td>
              </tr>
              <tr>
                <td style={{ width: '40%', fontSize: '9pt', fontWeight: '600', padding: '6px', border: '0.5pt solid #D1D5DB', backgroundColor: '#F5F5F7' }}>Delivery Date</td>
                <td style={{ fontSize: '9pt', padding: '6px', border: '0.5pt solid #D1D5DB' }}>{meta?.deliveryDate || 'N/A'}</td>
              </tr>
              <tr>
                <td style={{ width: '40%', fontSize: '9pt', fontWeight: '600', padding: '6px', border: '0.5pt solid #D1D5DB', backgroundColor: '#F5F5F7' }}>Payment Terms</td>
                <td style={{ fontSize: '9pt', padding: '6px', border: '0.5pt solid #D1D5DB' }}>{meta?.paymentTerms || 'N/A'}</td>
              </tr>
              <tr>
                <td style={{ width: '40%', fontSize: '9pt', fontWeight: '600', padding: '6px', border: '0.5pt solid #D1D5DB', backgroundColor: '#F5F5F7' }}>Delivery Terms</td>
                <td style={{ fontSize: '9pt', padding: '6px', border: '0.5pt solid #D1D5DB' }}>{meta?.deliveryTerms || 'N/A'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Summary - Full Bordered Table (No Pricing) */}
      {Array.isArray(orderLines) && orderLines.length > 0 && (
        <div className="mb-3 avoid-break" style={{ border: '0.75pt solid #D1D5DB', borderRadius: '4px', overflow: 'hidden' }}>
          <div className="po-section-title" style={{ fontSize: '11pt', fontWeight: '600', padding: '8px', paddingBottom: '4px' }}>Order Summary</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#F5F5F7' }}>
                <th style={{ fontSize: '9.5pt', fontWeight: '600', padding: '6px', border: '0.5pt solid #D1D5DB', textAlign: 'left' }}>Style Code</th>
                <th style={{ fontSize: '9.5pt', fontWeight: '600', padding: '6px', border: '0.5pt solid #D1D5DB', textAlign: 'left' }}>Description</th>
                <th style={{ fontSize: '9.5pt', fontWeight: '600', padding: '6px', border: '0.5pt solid #D1D5DB', textAlign: 'left' }}>Fabric & GSM</th>
                <th style={{ fontSize: '9.5pt', fontWeight: '600', padding: '6px', border: '0.5pt solid #D1D5DB', textAlign: 'left' }}>Colours</th>
                <th style={{ fontSize: '9.5pt', fontWeight: '600', padding: '6px', border: '0.5pt solid #D1D5DB', textAlign: 'left' }}>Size Range</th>
                <th style={{ fontSize: '9.5pt', fontWeight: '600', padding: '6px', border: '0.5pt solid #D1D5DB', textAlign: 'right' }}>Quantity</th>
              </tr>
            </thead>
            <tbody>
              {orderLines.map((line, idx) => (
                <tr key={idx}>
                  <td style={{ fontSize: '9pt', padding: '6px', border: '0.5pt solid #D1D5DB' }}>{line.style_code}</td>
                  <td style={{ fontSize: '9pt', padding: '6px', border: '0.5pt solid #D1D5DB', whiteSpace: 'pre-wrap' }}>{line.product_description}</td>
                  <td style={{ fontSize: '9pt', padding: '6px', border: '0.5pt solid #D1D5DB' }}>{line.fabric_gsm}</td>
                  <td style={{ fontSize: '9pt', padding: '6px', border: '0.5pt solid #D1D5DB' }}>{matrixColours}</td>
                  <td style={{ fontSize: '9pt', padding: '6px', border: '0.5pt solid #D1D5DB' }}>{matrixSizeRange}</td>
                  <td style={{ fontSize: '9pt', padding: '6px', border: '0.5pt solid #D1D5DB', textAlign: 'right' }}>{formatQty(line.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Size–Colour Breakdown - Full Width Table with Pricing */}
      {matrix && matrix.sizes?.length > 0 && matrix.colors?.length > 0 && (
        <div className="mb-3 avoid-break" style={{ border: '0.75pt solid #D1D5DB', borderRadius: '4px', overflow: 'hidden' }}>
          <div className="po-section-title" style={{ fontSize: '11pt', fontWeight: '600', padding: '8px', paddingBottom: '4px' }}>Size–Colour Breakdown (with Pricing)</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#F5F5F7' }}>
                <th style={{ fontSize: '9.5pt', fontWeight: '600', padding: '6px 8px', border: '0.5pt solid #D1D5DB', textAlign: 'left', minWidth: '100px' }}>Colour</th>
                {matrix.sizes.map((size, i) => (
                  <th key={i} style={{ fontSize: '9.5pt', fontWeight: '600', padding: '6px 8px', border: '0.5pt solid #D1D5DB', textAlign: 'right', minWidth: '50px' }}>{size}</th>
                ))}
                <th style={{ fontSize: '9.5pt', fontWeight: '600', padding: '6px 8px', border: '0.5pt solid #D1D5DB', textAlign: 'right', minWidth: '55px' }}>Quantity</th>
                <th style={{ fontSize: '9.5pt', fontWeight: '600', padding: '6px 8px', border: '0.5pt solid #D1D5DB', textAlign: 'right', minWidth: '70px' }}>Unit Price</th>
                <th style={{ fontSize: '9.5pt', fontWeight: '600', padding: '6px 8px', border: '0.5pt solid #D1D5DB', textAlign: 'right', minWidth: '85px' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {matrix.colors.map((colorData, ri) => {
                const colorName = typeof colorData === 'string' ? colorData : colorData.name;
                const unitPrice = typeof colorData === 'string' ? 0 : (colorData.unitPrice || colorData.unit_price || 0);
                const rowQty = matrix.sizes.reduce((acc, size) => {
                  return acc + (Number(matrix.values?.[colorName]?.[size]) || 0);
                }, 0);
                const rowAmount = rowQty * unitPrice;
                
                return (
                  <tr key={ri}>
                    <td style={{ fontSize: '9pt', padding: '6px 8px', border: '0.5pt solid #D1D5DB' }}>{colorName}</td>
                    {matrix.sizes.map((size, ci) => (
                      <td key={ci} style={{ fontSize: '9pt', padding: '6px 8px', border: '0.5pt solid #D1D5DB', textAlign: 'right' }}>
                        {Number(matrix.values?.[colorName]?.[size]) || 0}
                      </td>
                    ))}
                    <td style={{ fontSize: '9pt', padding: '6px 8px', border: '0.5pt solid #D1D5DB', textAlign: 'right', fontWeight: '500' }}>{rowQty}</td>
                    <td style={{ fontSize: '9pt', padding: '6px 8px', border: '0.5pt solid #D1D5DB', textAlign: 'right' }}>{formatINR(unitPrice)}</td>
                    <td style={{ fontSize: '9pt', padding: '6px 8px', border: '0.5pt solid #D1D5DB', textAlign: 'right', fontWeight: '500' }}>{formatINR(rowAmount)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ fontWeight: '600', backgroundColor: '#F5F5F7' }}>
                <td style={{ fontSize: '9.5pt', padding: '6px 8px', border: '0.5pt solid #D1D5DB' }}>Total</td>
                {matrix.sizes.map((size, ci) => {
                  const colTotal = matrix.colors.reduce((acc, colorData) => {
                    const colorName = typeof colorData === 'string' ? colorData : colorData.name;
                    return acc + (Number(matrix.values?.[colorName]?.[size]) || 0);
                  }, 0);
                  return (
                    <td key={ci} style={{ fontSize: '9.5pt', padding: '6px 8px', border: '0.5pt solid #D1D5DB', textAlign: 'right' }}>{colTotal}</td>
                  );
                })}
                <td style={{ fontSize: '9.5pt', padding: '6px 8px', border: '0.5pt solid #D1D5DB', textAlign: 'right' }}>{matrix.grandTotal || 0}</td>
                <td style={{ fontSize: '9.5pt', padding: '6px 8px', border: '0.5pt solid #D1D5DB', textAlign: 'center' }}>—</td>
                <td style={{ fontSize: '9.5pt', padding: '6px 8px', border: '0.5pt solid #D1D5DB', textAlign: 'right' }}>
                  {formatINR(
                    matrix.colors.reduce((acc, colorData) => {
                      const colorName = typeof colorData === 'string' ? colorData : colorData.name;
                      const unitPrice = typeof colorData === 'string' ? 0 : (colorData.unitPrice || colorData.unit_price || 0);
                      const rowQty = matrix.sizes.reduce((sum, size) => sum + (Number(matrix.values?.[colorName]?.[size]) || 0), 0);
                      return acc + (rowQty * unitPrice);
                    }, 0)
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
          
          {/* Totals Summary Bar */}
          <div style={{ padding: '10px 12px', backgroundColor: '#F9FAFB', borderTop: '0.75pt solid #D1D5DB', display: 'flex', justifyContent: 'flex-end', gap: '30px', fontSize: '10pt', fontWeight: '600' }}>
            <div>
              <span style={{ color: '#6B7280' }}>Total Quantity: </span>
              <span>{matrix.grandTotal || 0} pieces</span>
            </div>
            <div>
              <span style={{ color: '#6B7280' }}>Total Amount: </span>
              <span style={{ color: '#2563EB' }}>
                {formatINR(
                  matrix.colors.reduce((acc, colorData) => {
                    const colorName = typeof colorData === 'string' ? colorData : colorData.name;
                    const unitPrice = typeof colorData === 'string' ? 0 : (colorData.unitPrice || colorData.unit_price || 0);
                    const rowQty = matrix.sizes.reduce((sum, size) => sum + (Number(matrix.values?.[colorName]?.[size]) || 0), 0);
                    return acc + (rowQty * unitPrice);
                  }, 0)
                )}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Packing Instructions - Full Width Rows */}
      {packing && Object.values(packing).some(v => v) && (
        <div className="mb-3 avoid-break" style={{ border: '0.75pt solid #D1D5DB', borderRadius: '4px', overflow: 'hidden' }}>
          <div className="po-section-title" style={{ fontSize: '11pt', fontWeight: '600', padding: '8px', paddingBottom: '4px' }}>Packing Instructions</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {packing.folding_instruction && (
                <tr>
                  <td style={{ fontSize: '9.5pt', fontWeight: '600', padding: '6px', border: '0.5pt solid #D1D5DB', width: '25%', verticalAlign: 'top' }}>Folding Instruction</td>
                  <td style={{ fontSize: '9pt', padding: '6px', border: '0.5pt solid #D1D5DB', whiteSpace: 'pre-wrap' }}>{packing.folding_instruction}</td>
                </tr>
              )}
              {packing.packing_instruction && (
                <tr>
                  <td style={{ fontSize: '9.5pt', fontWeight: '600', padding: '6px', border: '0.5pt solid #D1D5DB', width: '25%', verticalAlign: 'top' }}>Packing Instruction</td>
                  <td style={{ fontSize: '9pt', padding: '6px', border: '0.5pt solid #D1D5DB', whiteSpace: 'pre-wrap' }}>{packing.packing_instruction}</td>
                </tr>
              )}
              {packing.carton_bag_markings && (
                <tr>
                  <td style={{ fontSize: '9.5pt', fontWeight: '600', padding: '6px', border: '0.5pt solid #D1D5DB', width: '25%', verticalAlign: 'top' }}>Carton / Bag Markings</td>
                  <td style={{ fontSize: '9pt', padding: '6px', border: '0.5pt solid #D1D5DB', whiteSpace: 'pre-wrap' }}>{packing.carton_bag_markings}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Other Terms - Two Column Table */}
      {terms && Object.values(terms).some(v => v) && (
        <div className="mb-3 avoid-break" style={{ border: '0.75pt solid #D1D5DB', borderRadius: '4px', overflow: 'hidden' }}>
          <div className="po-section-title" style={{ fontSize: '11pt', fontWeight: '600', padding: '8px', paddingBottom: '4px' }}>Other Terms</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {terms.qc && (
                <tr>
                  <td style={{ fontSize: '9.5pt', fontWeight: '600', padding: '6px', border: '0.5pt solid #D1D5DB', width: '20%', verticalAlign: 'top' }}>QC</td>
                  <td style={{ fontSize: '9pt', padding: '6px', border: '0.5pt solid #D1D5DB', whiteSpace: 'pre-wrap' }}>{terms.qc}</td>
                </tr>
              )}
              {terms.labels_tags && (
                <tr>
                  <td style={{ fontSize: '9.5pt', fontWeight: '600', padding: '6px', border: '0.5pt solid #D1D5DB', width: '20%', verticalAlign: 'top' }}>Labels/Tags</td>
                  <td style={{ fontSize: '9pt', padding: '6px', border: '0.5pt solid #D1D5DB', whiteSpace: 'pre-wrap' }}>{terms.labels_tags}</td>
                </tr>
              )}
              {terms.shortage_excess && (
                <tr>
                  <td style={{ fontSize: '9.5pt', fontWeight: '600', padding: '6px', border: '0.5pt solid #D1D5DB', width: '20%', verticalAlign: 'top' }}>Shortage/Excess</td>
                  <td style={{ fontSize: '9pt', padding: '6px', border: '0.5pt solid #D1D5DB' }}>{terms.shortage_excess}</td>
                </tr>
              )}
              {terms.penalty && (
                <tr>
                  <td style={{ fontSize: '9.5pt', fontWeight: '600', padding: '6px', border: '0.5pt solid #D1D5DB', width: '20%', verticalAlign: 'top' }}>Penalty</td>
                  <td style={{ fontSize: '9pt', padding: '6px', border: '0.5pt solid #D1D5DB' }}>{terms.penalty}</td>
                </tr>
              )}
              {terms.notes && (
                <tr>
                  <td style={{ fontSize: '9.5pt', fontWeight: '600', padding: '6px', border: '0.5pt solid #D1D5DB', width: '20%', verticalAlign: 'top' }}>Additional Notes</td>
                  <td style={{ fontSize: '9pt', padding: '6px', border: '0.5pt solid #D1D5DB', whiteSpace: 'pre-wrap' }}>{terms.notes}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Authorisation - Bordered boxes with equal padding */}
      <div className="grid grid-cols-2 gap-4 mt-6 avoid-break">
        <div style={{ 
          minHeight: '75pt', 
          border: '0.75pt solid #D1D5DB', 
          borderRadius: '4px',
          padding: '10px'
        }}>
          <div className="po-section-title mb-2" style={{ fontSize: '10pt', fontWeight: '600' }}>
            For {authorisation?.buyer_company || 'Buyer'}
          </div>
          {authorisation?.buyer_designation && (
            <div className="text-[9pt] mb-1">{authorisation.buyer_designation}</div>
          )}
          <div style={{ height: '38pt', borderBottom: '0.5pt solid #D1D5DB', marginBottom: '6pt', marginTop: '8pt' }} />
          <div className="text-[9pt]">
            {authorisation?.buyer_name ? `Name: ${authorisation.buyer_name}` : 'Authorised Signatory'}
          </div>
        </div>
        <div style={{ 
          minHeight: '75pt', 
          border: '0.75pt solid #D1D5DB', 
          borderRadius: '4px',
          padding: '10px'
        }}>
          <div className="po-section-title mb-2" style={{ fontSize: '10pt', fontWeight: '600' }}>
            For {authorisation?.supplier_company || 'Supplier/Factory'}
          </div>
          {authorisation?.supplier_designation && (
            <div className="text-[9pt] mb-1">{authorisation.supplier_designation}</div>
          )}
          <div style={{ height: '38pt', borderBottom: '0.5pt solid #D1D5DB', marginBottom: '6pt', marginTop: '8pt' }} />
          <div className="text-[9pt]">
            {authorisation?.supplier_name ? `Name: ${authorisation.supplier_name}` : 'Authorised Signatory'}
          </div>
        </div>
      </div>

              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
});

PODocument.displayName = 'PODocument';