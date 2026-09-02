import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate} from 'react-router-dom';
import { fetchSiteDetails, updateSite } from '@/store/reducers/sites/sitesSlice';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";
import Loading from '@/users/Loading';
import { ReloadIcon } from "@radix-ui/react-icons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  validateSiteName,
  validateManagerEmail,
  validateManagerName,
  validateManagerPhone,
  validateLatitude,
  validateLongitude,
  validateTimezone,
} from '@/pages/validations/Validation';

export default function EditSite() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id } = useParams();

  const validateForm = () => {
    const newErrors = {
      siteName: validateSiteName(formData.siteName),
      managerName: validateManagerName(formData.managerName),
      managerEmail: validateManagerEmail(formData.managerEmail),
      managerPhone: validateManagerPhone(formData.managerPhone),
      address: formData.location.address.trim() ? '' : 'Address is required',
      latitude: validateLatitude(formData.location.latitude),
      longitude: validateLongitude(formData.location.longitude),
      timezone: validateTimezone(formData.operations.timezone),
      openingTime: formData.operations.openingTime ? '' : 'Opening time is required',
      closeTime: formData.operations.closeTime ? '' : 'Closing time is required'
    };

    setFormErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== "");
  };

  const { currentSite, siteDetailsStatus, siteDetailsError, updateSiteStatus } = useSelector((state) => state.sites);
  const [formErrors, setFormErrors] = useState({});
  const[update,setUpdate]=useState('');
  const [formData, setFormData] = useState({
    siteName: '',
    managerName: '',
    managerEmail: '',
    managerPhone: '',
    location: {
      address: '',
      latitude: '',
      longitude: ''
    },
    operations: {
      openingTime: '',
      closeTime: '',
      timezone: '',
      siteStatus: true
    },
    facilities: {
      parking: false,
      wifi: false,
      food: false,
      restrooms: false
    }
  });

  useEffect(() => {
    const errors = {};
    const siteNameError = validateSiteName(formData.siteName);
    if (siteNameError) errors.siteName = siteNameError;
    
    const managerNameError = validateManagerName(formData.managerName);
    if (managerNameError) errors.managerName = managerNameError;

    const managerEmailError = validateManagerEmail(formData.managerEmail);
    if (managerEmailError) errors.managerEmail = managerEmailError;

    const managerPhoneError = validateManagerPhone(formData.managerPhone);
    if (managerPhoneError) errors.managerPhone = managerPhoneError;
    
    const latitudeError = validateLatitude(formData.location.latitude);
    if (latitudeError) errors.latitude = latitudeError;

    const longitudeError = validateLongitude(formData.location.longitude);
    if (longitudeError) errors.longitude = longitudeError;

    const timezoneError = validateTimezone(formData.operations.timezone);
    if (timezoneError) errors.timezone = timezoneError;

    setFormErrors(errors);
  }, [formData]);

  useEffect(() => {
    if (!id || isNaN(id)) {
      navigate('/sites');
      return;
    }
    dispatch(fetchSiteDetails(id));
  }, [dispatch, id, navigate]);

  useEffect(() => {
    if (currentSite) {
      setFormData({
        siteName: currentSite.siteName || '',
        managerName: currentSite.managerName || '',
        managerEmail: currentSite.managerEmail || '',
        managerPhone: currentSite.managerPhone || '',
        location: {
          address: currentSite.address || '',
          latitude: currentSite.latitude || '',
          longitude: currentSite.longitude || ''
        },
        operations: {
          openingTime: currentSite.openingTime || '',
          closeTime: currentSite.closeTime || '',
          timezone: currentSite.timezone || '',
          siteStatus: currentSite.siteStatus ?? true
        },
        facilities: {
          parking: currentSite.parking || false,
          wifi: currentSite.wifi || false,
          food: currentSite.food || false,
          restrooms: currentSite.restrooms || false
        }
      });
    }
  }, [currentSite]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNestedChange = (section, e) => {
    if (typeof e === 'string') {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          timezone: e,
        },
      }));
    } else {
      const { name, value } = e.target;
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [name]: value,
        },
      }));
    }
  };

  const handleCheckboxChange = (section, name, checked) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [name]: checked,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const isValid = validateForm();
    if (!isValid) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }

    try {
      setUpdate('loading');
      const updateData = {
        siteName: formData.siteName,
        managerName: formData.managerName,
        managerEmail: formData.managerEmail,
        managerPhone: formData.managerPhone,
        address: formData.location.address,
        latitude: formData.location.latitude,
        longitude: formData.location.longitude,
        openingTime: formData.operations.openingTime,
        closeTime: formData.operations.closeTime,
        timezone: formData.operations.timezone,
        siteStatus: formData.operations.siteStatus,
        parking: formData.facilities.parking,
        wifi: formData.facilities.wifi,
        food: formData.facilities.food,
        restrooms: formData.facilities.restrooms
      };

      await dispatch(updateSite(id, updateData));
      
      toast({
        title: "Success",
        description: "Site updated successfully",
        variant: "default",
      });
 setUpdate('');
      navigate(`/site/${id}`);
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update site",
        variant: "destructive",
      });
    }
  };

  if (siteDetailsStatus === 'loading') {
    return <div className="flex justify-center items-center h-64"><Loading /></div>;
  }

  if (siteDetailsStatus === 'failed') {
    return <div className="p-4 text-red-500">Error: {typeof siteDetailsError === 'string' ? siteDetailsError : 'An error occurred'}</div>;
  }

  if (!currentSite) {
    return <div className="p-4">No site data found</div>;
  }

return (
  <div className="p-6">

    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">Edit Site</h1>
    </div>
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Site Information */}
        <h2 className="text-lg font-semibold">Site Information</h2>

        <div className="grid grid-cols-2 gap-4">

          <div className="space-y-2">
            <Label>Site Name *</Label>
            <Input
              name="siteName"
              value={formData.siteName}
              onChange={handleChange}
            />
            {formErrors.siteName && (
              <p className="text-sm text-red-500">{formErrors.siteName}</p>
            )}
          </div>

        </div>

        {/* Manager Information */}
        <h2 className="text-lg font-semibold pt-4">Manager Information</h2>

        <div className="grid grid-cols-2 gap-4">

          <div className="space-y-2">
            <Label>Manager Name *</Label>
            <Input
              name="managerName"
              value={formData.managerName}
              onChange={handleChange}
            />
            {formErrors.managerName && (
              <p className="text-sm text-red-500">{formErrors.managerName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Email *</Label>
            <Input
              type="email"
              name="managerEmail"
              value={formData.managerEmail}
              onChange={handleChange}
            />
            {formErrors.managerEmail && (
              <p className="text-sm text-red-500">{formErrors.managerEmail}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Phone *</Label>
            <Input
              name="managerPhone"
              value={formData.managerPhone}
              onChange={handleChange}
            />
            {formErrors.managerPhone && (
              <p className="text-sm text-red-500">{formErrors.managerPhone}</p>
            )}
          </div>

        </div>

        {/* Location */}
        <h2 className="text-lg font-semibold pt-4">Location</h2>

        <div className="grid grid-cols-2 gap-4">

          <div className="space-y-2 col-span-2">
            <Label>Address *</Label>
            <Textarea
              name="address"
              value={formData.location.address}
              onChange={(e) => handleNestedChange('location', e)}
            />
          </div>

          <div className="space-y-2">
            <Label>Latitude *</Label>
            <Input
              name="latitude"
              value={formData.location.latitude}
              onChange={(e) => handleNestedChange('location', e)}
            />
            {formErrors.latitude && (
              <p className="text-sm text-red-500">{formErrors.latitude}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Longitude *</Label>
            <Input
              name="longitude"
              value={formData.location.longitude}
              onChange={(e) => handleNestedChange('location', e)}
            />
            {formErrors.longitude && (
              <p className="text-sm text-red-500">{formErrors.longitude}</p>
            )}
          </div>

        </div>

        {/* Operations */}
        <h2 className="text-lg font-semibold pt-4">Operations</h2>

        <div className="grid grid-cols-2 gap-4">

          <div className="space-y-2">
            <Label>Opening Time *</Label>
            <Input
              type="time"
              name="openingTime"
              value={formData.operations.openingTime}
              onChange={(e) => handleNestedChange('operations', e)}
            />
          </div>

          <div className="space-y-2">
            <Label>Closing Time *</Label>
            <Input
              type="time"
              name="closeTime"
              value={formData.operations.closeTime}
              onChange={(e) => handleNestedChange('operations', e)}
            />
          </div>

          <div className="space-y-2">
            <Label>Timezone *</Label>

            <Select
              value={formData.operations.timezone}
              onValueChange={(value) =>
                handleNestedChange("operations", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>

             <SelectContent>
            <SelectItem value="IST">IST (Indian Standard Time)</SelectItem>
             <SelectItem value="UTC">UTC (Coordinated Universal Time)</SelectItem> 
             <SelectItem value="EST">EST (Eastern Standard Time)</SelectItem> 
             <SelectItem value="PST">PST (Pacific Standard Time)</SelectItem> 
             </SelectContent>
            </Select>

            {formErrors.timezone && (
              <p className="text-sm text-red-500">{formErrors.timezone}</p>
            )}
          </div>

        </div>

        {/* Facilities */}
        <h2 className="text-lg font-semibold pt-4">Facilities</h2>

        <div className="grid grid-cols-4 gap-4">

          {['parking','wifi','food','restrooms'].map((facility) => (

            <div key={facility} className="flex items-center gap-2">

              <input
                type="checkbox"
                checked={formData.facilities[facility]}
                onChange={(e) =>
                  handleCheckboxChange(
                    "facilities",
                    facility,
                    e.target.checked
                  )
                }
              />

              <Label className="capitalize">
                {facility}
              </Label>

            </div>

          ))}

        </div>

        {/* Update Button */}

       <div className="flex justify-end gap-3 pt-4">
         <Button variant="outline" onClick={() => navigate(-1)}>
        Cancel
      </Button>

  <Button
    type="submit"
    disabled={updateSiteStatus === 'loading' || update === 'loading'}
  >
    {updateSiteStatus === 'loading' || update === 'loading' ? (
      <div className="flex items-center gap-2">
        <ReloadIcon className="h-4 w-4 animate-spin" />
        Updating...
      </div>
    ) : (
      "Update"
    )}
  </Button>

</div>

      </form>

    </Card>

  </div>
);
}