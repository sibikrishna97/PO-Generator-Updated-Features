import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Separator } from '../components/ui/separator';
import { SizeColourMatrix } from '../components/SizeColourMatrix';
import { PODocument } from '../components/PODocument';
import { useReactToPrint } from 'react-to-print';
import { toast } from 'sonner';
import { Save, Printer, ArrowLeft, Plus, X, AlertCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const STATIC_BUYER = {
  company: 'Newline Apparel',
  address_lines: ['61, GKD Nagar, PN Palayam', 'Coimbatore – 641037', 'Tamil Nadu'],
  gstin: '33AABCN1234F1Z5'
};

export default function POEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const printRef = useRef();
  const [loading, setLoading] = useState(false);
  const [openPreview, setOpenPreview] = useState(false);

  // Form state
  const [poNumber, setPoNumber] = useState('');
  const [poDate, setPoDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTerms, setDeliveryTerms] = useState('Ex-factory, Tirupur');
  const [paymentTerms, setPaymentTerms] = useState('100% After QC and counting by Sree Rajkondal Export Enterprises');
  const [currency, setCurrency] = useState('INR');
  const [logoUrl, setLogoUrl] = useState('');

  // Supplier
  const [supplier, setSupplier] = useState({
    company: '',
    address_lines: ['', '', ''],
    gstin: '',
    contact_name: '',
    phone: '',
    email: ''
  });

  // Order Lines
  const [orderLines, setOrderLines] = useState([{
    style_code: '',
    product_description: '',
    fabric_gsm: '',
    colors: [],
    size_range: [],
    quantity: 0,
    unit_price: 0,
    unit: 'pcs'
  }]);

  // Matrix
  const [matrix, setMatrix] = useState({
    sizes: ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
    colors: ['Black', 'Grey Melange', 'Charcoal Melange'],
    values: {},
    grandTotal: 0
  });

  // Packing
  const [packing, setPacking] = useState({
    folding: '',
    packing_type: '',
    size_packing: '',
    carton_bag_markings: '',
    packing_ratio: '',
    polybag: ''
  });

  // Other Terms
  const [terms, setTerms] = useState({
    qc: '',
    labels_tags: '',
    shortage_excess: '',
    penalty: '',
    notes: ''
  });

  // Authorisation
  const [authorisation, setAuthorisation] = useState({
    buyer_designation: '',
    buyer_name: '',
    supplier_designation: '',
    supplier_name: ''
  });

  useEffect(() => {
    if (id && id !== 'new') {
      fetchPO();
    }
  }, [id]);

  const fetchPO = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/pos/${id}`);
      const po = response.data;
      
      setPoNumber(po.po_number);
      setPoDate(po.po_date);
      setDeliveryDate(po.delivery_date);
      setDeliveryTerms(po.delivery_terms);
      setPaymentTerms(po.payment_terms);
      setCurrency(po.currency);
      setLogoUrl(po.logo_url || '');
      setSupplier(po.supplier);
      setOrderLines(po.order_lines);
      setMatrix(po.size_colour_breakdown);
      setPacking(po.packing_instructions);
      setTerms(po.other_terms);
      setAuthorisation(po.authorisation);
    } catch (error) {
      console.error('Error fetching PO:', error);
      toast.error('Failed to load PO');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!poNumber.trim()) {
      toast.error('PO Number is required');
      return;
    }
    if (!poDate) {
      toast.error('PO Date is required');
      return;
    }
    if (!supplier.company.trim()) {
      toast.error('Supplier company name is required');
      return;
    }
    if (!deliveryTerms.trim()) {
      toast.error('Delivery Terms are required');
      return;
    }
    if (!paymentTerms.trim()) {
      toast.error('Payment Terms are required');
      return;
    }

    try {
      setLoading(true);
      const poData = {
        po_number: poNumber,
        po_date: poDate,
        supplier,
        delivery_date: deliveryDate,
        delivery_terms: deliveryTerms,
        payment_terms: paymentTerms,
        currency,
        order_lines: orderLines,
        size_colour_breakdown: matrix,
        packing_instructions: packing,
        other_terms: terms,
        authorisation,
        logo_url: logoUrl
      };

      if (id && id !== 'new') {
        await axios.put(`${API}/pos/${id}`, poData);
        toast.success('PO updated successfully');
      } else {
        const response = await axios.post(`${API}/pos`, poData);
        toast.success('PO created successfully');
        navigate(`/po/${response.data.id}`);
      }
    } catch (error) {
      console.error('Error saving PO:', error);
      toast.error('Failed to save PO');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    pageStyle: `
      @page { size: A4; margin: 12mm; }
      @media print {
        html, body { background: #fff !important; }
        body { font-family: Inter, Roboto, system-ui, -apple-system, Segoe UI, Helvetica Neue, Arial, Noto Sans, sans-serif; }
      }
    `
  });

  const addOrderLine = () => {
    setOrderLines([...orderLines, {
      style_code: '',
      product_description: '',
      fabric_gsm: '',
      colors: [],
      size_range: [],
      quantity: 0,
      unit_price: 0,
      unit: 'pcs'
    }]);
  };

  const removeOrderLine = (index) => {
    if (orderLines.length > 1) {
      setOrderLines(orderLines.filter((_, i) => i !== index));
    }
  };

  const updateOrderLine = (index, field, value) => {
    const updated = [...orderLines];
    updated[index] = { ...updated[index], [field]: value };
    setOrderLines(updated);
  };

  const updateSupplierAddress = (index, value) => {
    const updated = [...supplier.address_lines];
    updated[index] = value;
    setSupplier({ ...supplier, address_lines: updated });
  };

  // Check if matrix grand total matches order total
  const orderTotalQty = orderLines.reduce((sum, line) => sum + Number(line.quantity || 0), 0);
  const matrixMismatch = matrix.grandTotal !== orderTotalQty;

  const syncQuantities = () => {
    if (orderLines.length === 1) {
      const updated = [...orderLines];
      updated[0].quantity = matrix.grandTotal;
      setOrderLines(updated);
      toast.success('Quantities synced from matrix');
    } else {
      toast.info('Auto-sync works with single order line only');
    }
  };

  const prepareDocumentData = () => ({
    logoUrl,
    poNumber,
    buyer: STATIC_BUYER,
    supplier,
    meta: {
      poDate,
      deliveryDate,
      paymentTerms,
      deliveryTerms
    },
    orderLines,
    matrix,
    packing,
    terms,
    authorisation
  });

  if (loading && id && id !== 'new') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-neutral-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-[1100px] mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/')} data-testid="po-back-button">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl md:text-2xl font-semibold">
              {id && id !== 'new' ? 'Edit Purchase Order' : 'New Purchase Order'}
            </h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setOpenPreview(true)}
              data-testid="po-form-preview-button"
            >
              <Printer className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              data-testid="po-form-save-button"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        {/* Mismatch Warning */}
        {matrixMismatch && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-center justify-between" data-testid="matrix-mismatch-warning">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">
                Matrix total ({matrix.grandTotal}) doesn't match order quantity ({orderTotalQty})
              </span>
            </div>
            <Button size="sm" variant="secondary" onClick={syncQuantities} data-testid="sync-quantities-button">
              Sync from Matrix
            </Button>
          </div>
        )}

        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="po-number">PO Number *</Label>
                  <Input
                    id="po-number"
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    placeholder="NA/290925/1402"
                    data-testid="po-form-po-number-input"
                  />
                </div>
                <div>
                  <Label htmlFor="po-date">PO Date *</Label>
                  <Input
                    id="po-date"
                    type="date"
                    value={poDate}
                    onChange={(e) => setPoDate(e.target.value)}
                    data-testid="po-form-po-date"
                  />
                </div>
                <div>
                  <Label htmlFor="delivery-date">Delivery Date</Label>
                  <Input
                    id="delivery-date"
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    data-testid="po-form-delivery-date"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="payment-terms">Payment Terms *</Label>
                  <Input
                    id="payment-terms"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    data-testid="po-form-payment-terms"
                  />
                </div>
                <div>
                  <Label htmlFor="delivery-terms">Delivery Terms *</Label>
                  <Input
                    id="delivery-terms"
                    value={deliveryTerms}
                    onChange={(e) => setDeliveryTerms(e.target.value)}
                    data-testid="po-form-delivery-terms"
                  />
                </div>
              </div>
              <div className="mt-4">
                <Label htmlFor="logo-url">Logo URL (optional)</Label>
                <Input
                  id="logo-url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  data-testid="po-form-logo-url"
                />
              </div>
            </CardContent>
          </Card>

          {/* Supplier */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-4">Supplier / Factory Details</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="supplier-company">Company Name *</Label>
                  <Input
                    id="supplier-company"
                    value={supplier.company}
                    onChange={(e) => setSupplier({ ...supplier, company: e.target.value })}
                    placeholder="Sree Rajkondal Export Enterprises"
                    data-testid="po-form-supplier-company"
                  />
                </div>
                <div>
                  <Label>Address Lines</Label>
                  {supplier.address_lines.map((line, idx) => (
                    <Input
                      key={idx}
                      value={line}
                      onChange={(e) => updateSupplierAddress(idx, e.target.value)}
                      placeholder={`Address line ${idx + 1}`}
                      className="mt-2"
                      data-testid={`po-form-supplier-address-${idx}`}
                    />
                  ))}
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="supplier-gstin">GSTIN</Label>
                    <Input
                      id="supplier-gstin"
                      value={supplier.gstin}
                      onChange={(e) => setSupplier({ ...supplier, gstin: e.target.value })}
                      data-testid="po-form-supplier-gstin"
                    />
                  </div>
                  <div>
                    <Label htmlFor="supplier-contact">Contact Name</Label>
                    <Input
                      id="supplier-contact"
                      value={supplier.contact_name}
                      onChange={(e) => setSupplier({ ...supplier, contact_name: e.target.value })}
                      data-testid="po-form-supplier-contact"
                    />
                  </div>
                  <div>
                    <Label htmlFor="supplier-phone">Phone</Label>
                    <Input
                      id="supplier-phone"
                      value={supplier.phone}
                      onChange={(e) => setSupplier({ ...supplier, phone: e.target.value })}
                      data-testid="po-form-supplier-phone"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Lines */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Order Lines</h2>
                <Button size="sm" onClick={addOrderLine} data-testid="add-order-line-button">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Line
                </Button>
              </div>
              <div className="space-y-4">
                {orderLines.map((line, idx) => (
                  <div key={idx} className="p-4 border rounded-md space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">Line {idx + 1}</span>
                      {orderLines.length > 1 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeOrderLine(idx)}
                          data-testid={`remove-order-line-${idx}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <Label>Style Code</Label>
                        <Input
                          value={line.style_code}
                          onChange={(e) => updateOrderLine(idx, 'style_code', e.target.value)}
                          placeholder="M10691"
                          data-testid={`order-line-${idx}-style`}
                        />
                      </div>
                      <div>
                        <Label>Fabric & GSM</Label>
                        <Input
                          value={line.fabric_gsm}
                          onChange={(e) => updateOrderLine(idx, 'fabric_gsm', e.target.value)}
                          placeholder="70% Cotton 30% Polyester, 230 GSM"
                          data-testid={`order-line-${idx}-fabric`}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Product Description</Label>
                      <Textarea
                        value={line.product_description}
                        onChange={(e) => updateOrderLine(idx, 'product_description', e.target.value)}
                        placeholder="Men's shorts with matching functional draw-string..."
                        rows={2}
                        data-testid={`order-line-${idx}-description`}
                      />
                    </div>
                    <div className="grid md:grid-cols-3 gap-3">
                      <div>
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          min="0"
                          value={line.quantity}
                          onChange={(e) => updateOrderLine(idx, 'quantity', parseInt(e.target.value) || 0)}
                          data-testid={`order-line-${idx}-quantity`}
                        />
                      </div>
                      <div>
                        <Label>Unit Price</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.unit_price}
                          onChange={(e) => updateOrderLine(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                          data-testid={`order-line-${idx}-price`}
                        />
                      </div>
                      <div>
                        <Label>Total</Label>
                        <Input
                          value={(line.quantity * line.unit_price).toFixed(2)}
                          disabled
                          className="bg-neutral-50"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Size-Colour Matrix */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-4">Size–Colour Breakdown</h2>
              <SizeColourMatrix
                sizes={matrix.sizes}
                colors={matrix.colors}
                values={matrix.values}
                onChange={setMatrix}
              />
              <div className="mt-3 text-sm text-neutral-600">
                Grand Total: <span className="font-semibold text-lg">{matrix.grandTotal}</span> pieces
              </div>
            </CardContent>
          </Card>

          {/* Packing Instructions */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-4">Packing Instructions</h2>
              <div className="space-y-3">
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <Label>Folding</Label>
                    <Input
                      value={packing.folding}
                      onChange={(e) => setPacking({ ...packing, folding: e.target.value })}
                      placeholder="Flat fold, front side facing up"
                      data-testid="packing-folding"
                    />
                  </div>
                  <div>
                    <Label>Packing Type</Label>
                    <Input
                      value={packing.packing_type}
                      onChange={(e) => setPacking({ ...packing, packing_type: e.target.value })}
                      placeholder="Bag packing"
                      data-testid="packing-type"
                    />
                  </div>
                </div>
                <div>
                  <Label>Size & Packing</Label>
                  <Input
                    value={packing.size_packing}
                    onChange={(e) => setPacking({ ...packing, size_packing: e.target.value })}
                    placeholder="Master polybag / 5 pieces / size"
                    data-testid="packing-size"
                  />
                </div>
                <div>
                  <Label>Polybag</Label>
                  <Input
                    value={packing.polybag}
                    onChange={(e) => setPacking({ ...packing, polybag: e.target.value })}
                    placeholder="Master poly only"
                    data-testid="packing-polybag"
                  />
                </div>
                <div>
                  <Label>Carton/Bag Markings</Label>
                  <Textarea
                    value={packing.carton_bag_markings}
                    onChange={(e) => setPacking({ ...packing, carton_bag_markings: e.target.value })}
                    placeholder="Each bag to be numbered..."
                    rows={2}
                    data-testid="packing-markings"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Other Terms */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-4">Other Terms</h2>
              <div className="space-y-3">
                <div>
                  <Label>QC</Label>
                  <Textarea
                    value={terms.qc}
                    onChange={(e) => setTerms({ ...terms, qc: e.target.value })}
                    placeholder="100% inspection by factory and Sree Rajkondal Export Enterprises"
                    rows={2}
                    data-testid="terms-qc"
                  />
                </div>
                <div>
                  <Label>Labels/Tags</Label>
                  <Textarea
                    value={terms.labels_tags}
                    onChange={(e) => setTerms({ ...terms, labels_tags: e.target.value })}
                    placeholder="Branding label, placements, motifs..."
                    rows={2}
                    data-testid="terms-labels"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <Label>Shortage/Excess</Label>
                    <Input
                      value={terms.shortage_excess}
                      onChange={(e) => setTerms({ ...terms, shortage_excess: e.target.value })}
                      placeholder="600 pieces +5% acceptable"
                      data-testid="terms-shortage"
                    />
                  </div>
                  <div>
                    <Label>Penalty</Label>
                    <Input
                      value={terms.penalty}
                      onChange={(e) => setTerms({ ...terms, penalty: e.target.value })}
                      placeholder="Delay beyond agreed date..."
                      data-testid="terms-penalty"
                    />
                  </div>
                </div>
                <div>
                  <Label>Additional Notes</Label>
                  <Textarea
                    value={terms.notes}
                    onChange={(e) => setTerms({ ...terms, notes: e.target.value })}
                    rows={2}
                    data-testid="terms-notes"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Authorisation */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-4">Authorisation</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-3">For Newline Apparel</h3>
                  <div className="space-y-3">
                    <div>
                      <Label>Designation</Label>
                      <Input
                        value={authorisation.buyer_designation}
                        onChange={(e) => setAuthorisation({ ...authorisation, buyer_designation: e.target.value })}
                        placeholder="Director"
                        data-testid="auth-buyer-designation"
                      />
                    </div>
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={authorisation.buyer_name}
                        onChange={(e) => setAuthorisation({ ...authorisation, buyer_name: e.target.value })}
                        placeholder="Authorised Signatory"
                        data-testid="auth-buyer-name"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-3">For Supplier/Factory</h3>
                  <div className="space-y-3">
                    <div>
                      <Label>Designation</Label>
                      <Input
                        value={authorisation.supplier_designation}
                        onChange={(e) => setAuthorisation({ ...authorisation, supplier_designation: e.target.value })}
                        placeholder="Manager"
                        data-testid="auth-supplier-designation"
                      />
                    </div>
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={authorisation.supplier_name}
                        onChange={(e) => setAuthorisation({ ...authorisation, supplier_name: e.target.value })}
                        placeholder="Authorised Signatory"
                        data-testid="auth-supplier-name"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Dialog */}
        <Dialog open={openPreview} onOpenChange={setOpenPreview}>
          <DialogContent className="max-w-[900px] max-h-[90vh] overflow-y-auto" data-testid="po-preview-dialog">
            <DialogHeader>
              <DialogTitle>Print Preview</DialogTitle>
            </DialogHeader>
            <div className="border rounded bg-white p-6">
              <PODocument ref={printRef} data={prepareDocumentData()} />
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setOpenPreview(false)}>Close</Button>
              <Button onClick={handlePrint} data-testid="po-export-pdf-button">
                <Printer className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}