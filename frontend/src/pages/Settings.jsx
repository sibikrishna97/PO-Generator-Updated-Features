import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { ArrowLeft, Upload, X, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Settings() {
  const navigate = useNavigate();
  const [logo, setLogo] = useState(null);
  const [logoFilename, setLogoFilename] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [defaultUnitPrice, setDefaultUnitPrice] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/settings`);
      if (response.data) {
        if (response.data.logo_base64) {
          setLogo(response.data.logo_base64);
          setLogoFilename(response.data.logo_filename);
        }
        setDefaultUnitPrice(response.data.default_unit_price || 0);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only PNG, JPG, and JPEG files are allowed');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await axios.post(`${API}/settings/logo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.status === 200 || response.status === 201) {
        setLogo(response.data.logo_base64);
        setLogoFilename(response.data.filename);
        setSelectedFile(null);
        
        // Clear file input
        const fileInput = document.getElementById('logo-upload');
        if (fileInput) fileInput.value = '';
        
        toast.success('Logo uploaded successfully! It will appear on all future POs.');
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to upload logo';
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to remove the logo?')) {
      return;
    }

    try {
      setDeleting(true);
      const response = await axios.delete(`${API}/settings/logo`);
      
      if (response.status === 200) {
        // Clear file input first
        const fileInput = document.getElementById('logo-upload');
        if (fileInput) fileInput.value = '';
        
        // Clear state
        setLogo(null);
        setLogoFilename(null);
        setSelectedFile(null);
        
        // Show success message
        toast.success('Logo removed successfully');
        
        // Force re-fetch to ensure UI is in sync
        await fetchSettings();
      }
    } catch (error) {
      console.error('Error deleting logo:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to remove logo';
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveDefaultPrice = async () => {
    try {
      setSaving(true);
      const response = await axios.put(`${API}/settings`, {
        default_unit_price: parseFloat(defaultUnitPrice) || 0
      });
      
      if (response.status === 200) {
        toast.success('Default unit price updated successfully');
      }
    } catch (error) {
      console.error('Error saving default price:', error);
      toast.error('Failed to save default unit price');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-[800px] mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" onClick={() => navigate('/')} data-testid="settings-back-button">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl md:text-2xl font-semibold">App Settings</h1>
        </div>

        {/* Logo Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle>Company Logo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Upload Company Logo</Label>
                <p className="text-sm text-neutral-500 mt-1 mb-3">
                  Upload your company logo (PNG, JPG, JPEG). It will automatically appear on all Purchase Orders.
                </p>
                
                {/* Current Logo Preview */}
                {logo && (
                  <div className="mb-4 p-4 border rounded-md bg-white">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span>Current Logo: {logoFilename}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleDelete}
                        disabled={deleting}
                        data-testid="delete-logo-button"
                      >
                        {deleting ? 'Removing...' : <X className="h-4 w-4" />}
                      </Button>
                    </div>
                    <div className="flex justify-center p-4 bg-neutral-50 rounded">
                      <img
                        src={logo}
                        alt="Company Logo"
                        style={{ maxHeight: '100px', maxWidth: '300px', objectFit: 'contain' }}
                      />
                    </div>
                  </div>
                )}

                {/* Upload New Logo */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="logo-upload"
                      data-testid="logo-file-input"
                    />
                    <label htmlFor="logo-upload">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => document.getElementById('logo-upload').click()}
                        data-testid="choose-file-button"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Choose File
                      </Button>
                    </label>
                    {selectedFile && (
                      <span className="text-sm text-neutral-600">{selectedFile.name}</span>
                    )}
                  </div>

                  {selectedFile && (
                    <Button
                      onClick={handleUpload}
                      disabled={uploading}
                      data-testid="upload-logo-button"
                    >
                      {uploading ? 'Uploading...' : 'Upload Logo'}
                    </Button>
                  )}
                </div>

                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> The uploaded logo will automatically appear on the top-right corner of all Purchase Orders. Recommended size: 35-45mm width for optimal print quality.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Settings can be added here in future */}
      </div>
    </div>
  );
}