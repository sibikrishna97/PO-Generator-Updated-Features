import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/table';
import { Plus, Search, FileText, Settings } from 'lucide-react';
import { formatDate } from '../utils/formatters';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function POList() {
  const navigate = useNavigate();
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');

  useEffect(() => {
    fetchPOs();
  }, []);

  const fetchPOs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (supplierFilter) params.supplier = supplierFilter;
      
      const response = await axios.get(`${API}/pos`, { params });
      setPos(response.data);
    } catch (error) {
      console.error('Error fetching POs:', error);
      toast.error('Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchPOs();
  };

  const handleRowClick = (poId) => {
    navigate(`/po/${poId}`);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-neutral-700" />
                <CardTitle className="text-xl md:text-2xl font-semibold">Purchase Orders</CardTitle>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => navigate('/directory')}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Directory
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => navigate('/settings')}
                  data-testid="po-list-settings-button"
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
                <Button
                  onClick={() => navigate('/po/new')}
                  data-testid="po-list-new-button"
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  New PO
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search Bar */}
            <div className="flex flex-col md:flex-row gap-3 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  placeholder="Search by PO Number or Supplier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                  data-testid="po-list-search-input"
                />
              </div>
              <Button
                variant="secondary"
                onClick={handleSearch}
                data-testid="po-list-search-button"
              >
                Search
              </Button>
            </div>

            {/* Table */}
            {loading ? (
              <div className="text-center py-12 text-neutral-500">Loading...</div>
            ) : pos.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-500 mb-4">No purchase orders found</p>
                <Button onClick={() => navigate('/po/new')} variant="secondary">
                  Create Your First PO
                </Button>
              </div>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <Table data-testid="po-list-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>PO Number</TableHead>
                      <TableHead>PO Date</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Delivery Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pos.map((po) => (
                      <TableRow
                        key={po.id}
                        className="cursor-pointer hover:bg-neutral-50"
                        onClick={() => handleRowClick(po.id)}
                        data-testid={`po-list-row-${po.po_number}`}
                      >
                        <TableCell className="font-medium">{po.po_number}</TableCell>
                        <TableCell>{formatDate(po.po_date)}</TableCell>
                        <TableCell>{po.supplier?.company || 'N/A'}</TableCell>
                        <TableCell>{formatDate(po.delivery_date)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowClick(po.id);
                            }}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}