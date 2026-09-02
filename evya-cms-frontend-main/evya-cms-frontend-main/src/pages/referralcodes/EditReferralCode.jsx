import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ReloadIcon } from '@radix-ui/react-icons';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";
import { 
  getReferralDetails, 
  updateReferral,
  selectCurrentReferral,
  selectReferralStatus,
  selectReferralError,
  selectUpdateReferralStatus   
} from '@/store/reducers/referralCode/referralSlice';
import { fetchSites } from '@/store/reducers/sites/sitesSlice';

const MultiSelect = ({ options, selected, onChange }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
      {options.map(site => (
        <div key={site.siteId} className="flex items-center space-x-2">
          <Checkbox
            id={`site-${site.siteId}`}
            checked={selected.includes(site.siteId)}
            onCheckedChange={() => {
              const newSelected = selected.includes(site.siteId)
                ? selected.filter(id => id !== site.siteId)
                : [...selected, site.siteId];
              onChange(newSelected);
            }}
          />
          <Label htmlFor={`site-${site.siteId}`}>{site.sitename}</Label>
        </div>
      ))}
    </div>
  );
};

export default function EditReferralCode() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id } = useParams();

  const currentReferral = useSelector(selectCurrentReferral);
  // const status = useSelector(selectReferralStatus);
  const updateStatus = useSelector(selectUpdateReferralStatus);
  const error = useSelector(selectReferralError);
  const { list: sites } = useSelector((state) => state.sites);
  
  const [formData, setFormData] = useState({
    code: '',
    offerPercentage: '',
    validFrom: '',
    validTo: '',
    applyToAllSites: true,
    selectedSites: []
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (id) {
      dispatch(getReferralDetails(id));
      dispatch(fetchSites({ page: 0, size: 100 }));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (currentReferral) {
      setFormData({
        code: currentReferral.referralCode|| '',
        offerPercentage: currentReferral.offerPercentage?.toString() || '',
        validFrom: currentReferral.validFrom?.split('T')[0] || '',
        validTo: currentReferral.validTo?.split('T')[0] || '',
        applyToAllSites: currentReferral.applyToAllSites ?? true,
        selectedSites: currentReferral.sites?.map(s => s.siteId) || 
                     currentReferral.selectedSites || []
      });
    }
  }, [currentReferral]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCheckboxChange = (checked) => {
    setFormData(prev => ({ 
      ...prev, 
      applyToAllSites: checked,
      selectedSites: checked ? [] : prev.selectedSites 
    }));
  };

  const handleSiteSelection = (selected) => {
    setFormData(prev => ({ ...prev, selectedSites: selected }));
    if (formErrors.selectedSites) {
      setFormErrors(prev => ({ ...prev, selectedSites: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.code.trim()) errors.code = 'Code is required';
    if (!formData.offerPercentage) errors.offerPercentage = 'Offer percentage is required';
    if (isNaN(formData.offerPercentage)) {
      errors.offerPercentage = 'Must be a number';
    } else if (Number(formData.offerPercentage) < 1 || Number(formData.offerPercentage) > 100) {
      errors.offerPercentage = 'Must be between 1 and 100';
    }
    if (!formData.validFrom) errors.validFrom = 'Start date is required';
    if (!formData.validTo) errors.validTo = 'End date is required';
    if (new Date(formData.validTo) < new Date(formData.validFrom)) {
      errors.validTo = 'End date must be after start date';
    }
    if (!formData.applyToAllSites && formData.selectedSites.length === 0) {
      errors.selectedSites = 'Please select at least one site';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    const payload = {
      ...formData,
      offerPercentage: Number(formData.offerPercentage),
      sites: formData.applyToAllSites ? [] : formData.selectedSites
    };

    try {
      await dispatch(updateReferral({ id, ...payload })).unwrap();
      toast({
        title: "Success",
        description: "Referral code updated successfully",
      });
      navigate(`/referral-codes/${id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: error || "Failed to update referral code",
        variant: "destructive",
      });
    }
  };

  if (status === 'loading') {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-red-500">Error: {error}</div>
        <Button onClick={() => navigate('/referral-codes')} className="mt-4">
          Back to Referral Codes
        </Button>
      </div>
    );
  }

  if (!currentReferral) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-gray-600">Referral code not found</div>
        <Button onClick={() => navigate('/referral-codes')} className="mt-4">
          Back to Referral Codes
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="w-full max-w-4xl mx-auto">
        <Button 
          onClick={() => navigate(`/referral-codes/${id}`)}
          variant="outline"
          className="mb-4"
        >
          Back to Details
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Edit Referral Code</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Code Details</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Code *</Label>
                    <Input
                      id="code"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      placeholder="Enter referral code"
                    />
                    {formErrors.code && <p className="text-sm text-red-500">{formErrors.code}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="offerPercentage">Offer Percentage *</Label>
                    <Input
                      id="offerPercentage"
                      name="offerPercentage"
                      type="number"
                      min="1"
                      max="100"
                      value={formData.offerPercentage}
                      onChange={handleInputChange}
                      placeholder="e.g., 20"
                    />
                    {formErrors.offerPercentage && (
                      <p className="text-sm text-red-500">{formErrors.offerPercentage}</p>
                    )}
                  </div>
                </div>
              </div>
              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Validity Period</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="validFrom">Start Date *</Label>
                    <Input
                      id="validFrom"
                      name="validFrom"
                      type="date"
                      value={formData.validFrom}
                      onChange={handleInputChange}
                    />
                    {formErrors.validFrom && (
                      <p className="text-sm text-red-500">{formErrors.validFrom}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="validTo">End Date *</Label>
                    <Input
                      id="validTo"
                      name="validTo"
                      type="date"
                      value={formData.validTo}
                      onChange={handleInputChange}
                      min={formData.validFrom}
                    />
                    {formErrors.validTo && (
                      <p className="text-sm text-red-500">{formErrors.validTo}</p>
                    )}
                  </div>
                </div>
              </div>
              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Site Application</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="applyToAllSites"
                    checked={formData.applyToAllSites}
                    onCheckedChange={handleCheckboxChange}
                  />
                  <Label htmlFor="applyToAllSites">Apply to all sites</Label>
                </div>
                {!formData.applyToAllSites && (
                  <div className="space-y-2">
                    <Label>Select Sites *</Label>
                    {sites.length > 0 ? (
                      <MultiSelect
                        options={sites}
                        selected={formData.selectedSites}
                        onChange={handleSiteSelection}
                      />
                    ) : (
                      <p className="text-sm text-gray-500">Loading sites...</p>
                    )}
                    {formErrors.selectedSites && (
                      <p className="text-sm text-red-500">{formErrors.selectedSites}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-4 pt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate(`/referral-codes/${id}`)}
                >
                  Cancel
                </Button>
                {/* <Button type="submit" disabled={status === 'loading'}>
                  {status === 'loading' ? 'Saving...' : 'Save Changes'}
                </Button> */}
                <Button type="submit" disabled={updateStatus === "loading"}>
  {updateStatus === "loading" ? (
    <>
      <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
      Updating...
    </>
  ) : (
    "Save Changes"
  )}
</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}