import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Edit, Trash2, Star } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Directory() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('buyers');
  const [buyers, setBuyers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [billToParties, setBillToParties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    company_name: '',
    address1: '',
    address2: '',
    address3: '',
    contact_name: '',
    phone: '',
    email: '',
    gstin: '',
    notes: '',
    is_default_buyer: false
  });

  useEffect(() => {
    fetchBuyers();
    fetchSuppliers();
    fetchBillToParties();
  }, []);

  const fetchBuyers = async () => {
    try {
      const response = await axios.get(`${API}/buyers`);
      setBuyers(response.data);
    } catch (error) {
      console.error('Error fetching buyers:', error);
      toast.error('Failed to load buyers');
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get(`${API}/suppliers`);
      setSuppliers(response.data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast.error('Failed to load suppliers');
    }
  };

  const fetchBillToParties = async () => {
    try {
      const response = await axios.get(`${API}/billto`);
      setBillToParties(response.data);
    } catch (error) {
      console.error('Error fetching bill-to parties:', error);
      toast.error('Failed to load bill-to parties');
    }
  };

  const handleOpenDialog = (item = null, type = 'buyer') => {
    if (item) {
      setEditMode(true);
      setCurrentItem(item);
      setFormData({
        company_name: item.company_name,
        address1: item.address1 || '',
        address2: item.address2 || '',
        address3: item.address3 || '',
        contact_name: item.contact_name || '',
        phone: item.phone || '',
        email: item.email || '',
        gstin: item.gstin || '',
        notes: item.notes || '',
        is_default_buyer: item.is_default_buyer || false
      });
    } else {
      setEditMode(false);
      setCurrentItem(null);
      setFormData({
        company_name: '',
        address1: '',
        address2: '',
        address3: '',
        contact_name: '',
        phone: '',
        email: '',
        gstin: '',
        notes: '',
        is_default_buyer: false
      });
    }
    setOpenDialog(true);
  };

  const handleSave = async () => {
    if (!formData.company_name.trim()) {
      toast.error('Company name is required');
      return;
    }

    try {
      setLoading(true);
      
      if (editMode) {
        // Update
        let endpoint;
        if (activeTab === 'buyers') endpoint = `${API}/buyers/${currentItem.id}`;
        else if (activeTab === 'suppliers') endpoint = `${API}/suppliers/${currentItem.id}`;
        else endpoint = `${API}/billto/${currentItem.id}`;
        
        await axios.patch(endpoint, formData);
        toast.success(`${activeTab === 'buyers' ? 'Buyer' : activeTab === 'suppliers' ? 'Supplier' : 'Bill-To'} updated successfully`);
      } else {
        // Create
        let endpoint;
        if (activeTab === 'buyers') endpoint = `${API}/buyers`;
        else if (activeTab === 'suppliers') endpoint = `${API}/suppliers`;
        else endpoint = `${API}/billto`;
        
        await axios.post(endpoint, formData);
        toast.success(`${activeTab === 'buyers' ? 'Buyer' : activeTab === 'suppliers' ? 'Supplier' : 'Bill-To'} created successfully`);
      }
      
      // Refresh data
      if (activeTab === 'buyers') {
        await fetchBuyers();
      } else if (activeTab === 'suppliers') {
        await fetchSuppliers();
      } else {
        await fetchBillToParties();
      }
      
      setOpenDialog(false);
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item) => {
    if (!confirm(`Are you sure you want to delete ${item.company_name}?`)) {
      return;
    }

    try {
      let endpoint;
      if (activeTab === 'buyers') endpoint = `${API}/buyers/${item.id}`;
      else if (activeTab === 'suppliers') endpoint = `${API}/suppliers/${item.id}`;
      else endpoint = `${API}/billto/${item.id}`;
      
      await axios.delete(endpoint);
      toast.success('Deleted successfully');
      
      // Refresh data
      if (activeTab === 'buyers') {
        await fetchBuyers();
      } else if (activeTab === 'suppliers') {
        await fetchSuppliers();
      } else {
        await fetchBillToParties();
      }
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Directory</h1>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Add {activeTab === 'buyers' ? 'Buyer' : activeTab === 'suppliers' ? 'Supplier' : 'Bill-To'}
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="buyers">Buyers</TabsTrigger>
            <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          </TabsList>

          {/* Buyers Tab */}
          <TabsContent value="buyers">
            <Card>
              <CardContent className="pt-6">
                {buyers.length === 0 ? (
                  <div className="text-center py-8 text-neutral-500">
                    No buyers found. Click "Add Buyer" to create one.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {buyers.map(buyer => (
                      <div 
                        key={buyer.id} 
                        className="flex items-center justify-between p-4 border rounded-md hover:bg-neutral-50"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{buyer.company_name}</h3>
                            {buyer.is_default_buyer && (
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            )}
                          </div>
                          <p className="text-sm text-neutral-600">
                            {buyer.address1} {buyer.address2 && `, ${buyer.address2}`}
                          </p>
                          {buyer.contact_name && (
                            <p className="text-sm text-neutral-500">Contact: {buyer.contact_name}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(buyer, 'buyer')}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(buyer)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Suppliers Tab */}
          <TabsContent value="suppliers">
            <Card>
              <CardContent className="pt-6">
                {suppliers.length === 0 ? (
                  <div className="text-center py-8 text-neutral-500">
                    No suppliers found. Click "Add Supplier" to create one.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {suppliers.map(supplier => (
                      <div 
                        key={supplier.id} 
                        className="flex items-center justify-between p-4 border rounded-md hover:bg-neutral-50"
                      >
                        <div className="flex-1">
                          <h3 className="font-semibold">{supplier.company_name}</h3>
                          <p className="text-sm text-neutral-600">
                            {supplier.address1} {supplier.address2 && `, ${supplier.address2}`}
                          </p>
                          {supplier.contact_name && (
                            <p className="text-sm text-neutral-500">Contact: {supplier.contact_name}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(supplier, 'supplier')}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(supplier)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add/Edit Dialog */}
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editMode ? 'Edit' : 'Add'} {activeTab === 'buyers' ? 'Buyer' : 'Supplier'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                  placeholder="Company Name"
                />
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="address1">Address Line 1</Label>
                  <Input
                    id="address1"
                    value={formData.address1}
                    onChange={(e) => setFormData({...formData, address1: e.target.value})}
                    placeholder="Street Address"
                  />
                </div>
                <div>
                  <Label htmlFor="address2">Address Line 2</Label>
                  <Input
                    id="address2"
                    value={formData.address2}
                    onChange={(e) => setFormData({...formData, address2: e.target.value})}
                    placeholder="City, State, Postal Code"
                  />
                </div>
                <div>
                  <Label htmlFor="address3">Address Line 3</Label>
                  <Input
                    id="address3"
                    value={formData.address3}
                    onChange={(e) => setFormData({...formData, address3: e.target.value})}
                    placeholder="Country"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact_name">Contact Name</Label>
                  <Input
                    id="contact_name"
                    value={formData.contact_name}
                    onChange={(e) => setFormData({...formData, contact_name: e.target.value})}
                    placeholder="Contact Person"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="Phone Number"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="gstin">GSTIN</Label>
                  <Input
                    id="gstin"
                    value={formData.gstin}
                    onChange={(e) => setFormData({...formData, gstin: e.target.value})}
                    placeholder="GST Number"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Additional notes"
                />
              </div>
              
              {activeTab === 'buyers' && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_default"
                    checked={formData.is_default_buyer}
                    onChange={(e) => setFormData({...formData, is_default_buyer: e.target.checked})}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="is_default" className="cursor-pointer">
                    Set as default buyer
                  </Label>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="secondary" onClick={() => setOpenDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
