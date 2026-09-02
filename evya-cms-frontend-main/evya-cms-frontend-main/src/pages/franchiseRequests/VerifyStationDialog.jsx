import React, { useState,useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { verifyStation } from '@/store/reducers/requests/RequestsSlice';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReloadIcon } from "@radix-ui/react-icons";
import { useToast } from "@/components/ui/use-toast";
import { validateAddress,validateEmail,validateMobileNumber,validatePortCapacity,validatePortType,validateStationName,validateConnectorType,validateSerialNumber } from '../validations/Validation';
export const VerifyStationDialog = ({
  open,
  onOpenChange,
  selectedStation,
  selectedSite,
  franchiseObj,
  onVerifySuccess
}) => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [verifyFormData, setVerifyFormData] = useState({
    franchiseName: "GreenCharge EV Pvt Ltd",
    siteName: "",
    stationName: "",
    capacity: "",
    connectorType: "",
    serialNumber: "",
    portType: "",
    status: "",
    email: "", 
    mobileNumber: "",
    address: "", 
  });

  const [formErrors, setFormErrors] = useState({});
  const [touched, setTouched] = useState({});


  useEffect(() => {
  const errors = {};

  if (verifyFormData.stationName) {
    const stationNameError = validateStationName(verifyFormData.stationName);
    if (stationNameError) errors.stationName = stationNameError;
  }

  if (verifyFormData.capacity) {
    const capacityError = validatePortCapacity(verifyFormData.capacity);
    if (capacityError) errors.capacity = capacityError;
  }

  if (verifyFormData.email) {
    const emailError = validateEmail(verifyFormData.email);
    if (emailError) errors.email = emailError;
  }

  if (verifyFormData.mobileNumber) {
    const mobileNumberError = validateMobileNumber(verifyFormData.mobileNumber);
    if (mobileNumberError) errors.mobileNumber = mobileNumberError;
  }
  if (verifyFormData.connectorType) {
    const connectorTypeError = validateConnectorType(verifyFormData.connectorType);
    if (connectorTypeError) errors.connectorType = connectorTypeError;
  }
   if (verifyFormData.serialNumber) {
    const serialNumberError = validateSerialNumber(verifyFormData.serialNumber);
    if (serialNumberError) errors.serialNumber = serialNumberError;
  }
    if (verifyFormData.portType) {
    const portTypeError = validatePortType(verifyFormData.portType);
    if (portTypeError) errors.portType = portTypeError;
  }  
    if (verifyFormData.address) {
    const addressError = validateAddress(verifyFormData.address);
    if (addressError) errors.address = addressError;
  } 

  setFormErrors(errors);
}, [verifyFormData]);

const validateVerifyForm = (formData) => {
  const errors = {};
  
  // Validate required fields
  if (!formData.stationName.trim()) {
    errors.stationName = 'Station name is required';
  } else {
    const stationNameError = validateStationName(formData.stationName);
    if (stationNameError) errors.stationName = stationNameError;
  }

  if (!formData.capacity.trim()) {
    errors.capacity = 'Capacity is required';
  } else {
    const capacityError = validatePortCapacity(formData.capacity);
    if (capacityError) errors.capacity = capacityError;
  }

  if (!formData.serialNumber.trim()) {
    errors.serialNumber = 'Serial number is required';
  } else {
    const serialNumberError = validateSerialNumber(formData.serialNumber);
    if (serialNumberError) errors.serialNumber = serialNumberError;
  }

  if (!formData.email.trim()) {
    errors.email = 'Email is required';
  } else {
    const emailError = validateEmail(formData.email);
    if (emailError) errors.email = emailError;
  }

  if (!formData.mobileNumber.trim()) {
    errors.mobileNumber = 'Mobile number is required';
  } else {
    const mobileNumberError = validateMobileNumber(formData.mobileNumber);
    if (mobileNumberError) errors.mobileNumber = mobileNumberError;
  }

  if (!formData.address.trim()) {
    errors.address = 'Address is required';
  } else {
    const addressError = validateAddress(formData.address);
    if (addressError) errors.address = addressError;
  }
   const isValid = Object.keys(errors).length === 0;
  return { isValid, errors };  
};

const handleBlur = (field) => {
  setTouched(prev => ({
    ...prev,
    [field]: true
  }));
};
  const handleVerifyFormChange = (e) => {
    const { name, value } = e.target;
    setVerifyFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleVerifySelectChange = (name, value) => {
    setVerifyFormData((prev) => ({ ...prev, [name]: value }));
  };

// In your handleVerifySubmit function
const handleVerifySubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);

  // Validate form...

  try {
    // Build the station data in EXACT format expected by backend
    const stationData = {
      ev_stations: [
        {
          site_name: verifyFormData.siteName,
          station_name: verifyFormData.stationName,
          franchise_name: verifyFormData.franchiseName,
          address: verifyFormData.address,
          coordinates: {
            latitude: (selectedSite?.latitude || selectedSite?.locations?.[0]?.latitude || "0").toString(),
            longitude: (selectedSite?.longitude || selectedSite?.locations?.[0]?.longitude || "0").toString()
          },
          capacity: verifyFormData.capacity,
          number_of_chargers: 1, // Assuming 1 charger per station
          application_number: `APP_${Date.now()}`,
          connectorType: verifyFormData.connectorType,
          portType: verifyFormData.portType,
          email: verifyFormData.email,
          mobileNumber: verifyFormData.mobileNumber,
          serialNumber: verifyFormData.serialNumber,
          // Add default values for other required fields
          district: "Unknown",
          registration_date: new Date().toISOString().split('T')[0],
          registration: `REG_${Date.now()}`,
          icon: "default_icon.png"
        }
      ]
    };

    console.log("Sending station data:", JSON.stringify(stationData, null, 2));
    
    // Call the existing endpoint
    await axios.post('http://localhost:8080/station/verify-and-import', stationData);
    
    // Handle success...
  } catch (error) {
    // Handle error...
  }
};
  // Initialize form when station is selected
  React.useEffect(() => {
    if (selectedStation) {
      setVerifyFormData({
        franchiseName: selectedStation.franchiseName || "GreenCharge EV Pvt Ltd",
        siteName: selectedStation.siteName || "",
        stationName: selectedStation.stationName || "",
        capacity: selectedStation.capacity || "",
        connectorType: selectedStation.connectorType || "",
        serialNumber: selectedStation.serialNumber || "",
        portType: selectedStation.portType || "",
        status: selectedStation.status || "Verified",
        email: selectedStation.email || franchiseObj?.email || "", 
        mobileNumber: selectedStation.mobileNumber || franchiseObj?.phoneNumber || "", 
        address: selectedStation.address || selectedSite?.address || selectedSite?.locations?.[0]?.address || "", 
      });
    }
  },[open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Verify Station</DialogTitle>
        </DialogHeader>
    
        <form onSubmit={handleVerifySubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Franchise Name (Readonly) */}
            <div className="space-y-2">
              <Label htmlFor="verify-franchiseName">Franchise Name</Label>
              <Input
                id="verify-franchiseName"
                name="franchiseName"
                value={verifyFormData.franchiseName}
                onChange={handleVerifyFormChange} // ADD THIS
                // readOnly
                // className="bg-gray-100"
              />
            </div>

            {/* Site Name (Readonly) */}
            <div className="space-y-2">
              <Label htmlFor="verify-siteName">Site Name</Label>
              <Input
                id="verify-siteName"
                name="siteName"
                value={verifyFormData.siteName}
                onChange={handleVerifyFormChange} // ADD THIS
                // readOnly
                // className="bg-gray-100"
              />
            </div>

            {/* Station Name */}
            <div className="space-y-2">
              <Label htmlFor="verify-stationName">Station Name</Label>
              <Input
                id="verify-stationName"
                name="stationName"
                value={verifyFormData.stationName}
                onChange={handleVerifyFormChange}
                onBlur={() => handleBlur('stationName')}
                placeholder="Enter station name"
                required
                className={formErrors.stationName && touched.stationName ? 'border-red-500' : ''}
              />
              {formErrors.stationName && touched.stationName && (
                <p className="text-xs text-red-500 mt-1">{formErrors.stationName}</p>
            )}
            </div>

            {/* Capacity */}
            <div className="space-y-2">
              <Label htmlFor="verify-capacity">Capacity (kW)</Label>
              <Input
                id="verify-capacity"
                name="capacity"
                value={verifyFormData.capacity}
                onChange={handleVerifyFormChange}
                onBlur={() => handleBlur('capacity')}
                placeholder="Enter capacity"
                required
                className={formErrors.capacity && touched.capacity ? 'border-red-500' : ''}
              />
               {formErrors.capacity && touched.capacity && (
                <p className="text-xs text-red-500 mt-1">{formErrors.capacity}</p>
            )}
            </div>

            {/* Connector Type */}
            <div className="space-y-2">
              <Label htmlFor="verify-connectorType">Connector Type</Label>
              <Input
                id="verify-connectorType"
                name="connectorType"
                value={verifyFormData.connectorType}
                onChange={handleVerifyFormChange}
                onBlur={() => handleBlur('connectorType')}
                placeholder="Enter connector type (e.g., CCS2, CHAdeMO)"
                className={formErrors.connectorType && touched.connectorType ? 'border-red-500' : ''}
              />
              {formErrors.connectorType && touched.connectorType && (
                <p className="text-xs text-red-500 mt-1">{formErrors.connectorType}</p>
            )}
            </div>

            {/* Serial Number */}
            <div className="space-y-2">
              <Label htmlFor="verify-serialNumber">Serial Number</Label>
              <Input
                id="verify-serialNumber"
                name="serialNumber"
                value={verifyFormData.serialNumber}
                onChange={handleVerifyFormChange}
                onBlur={() => handleBlur('serialNumber')}
                placeholder="Enter serial number"
                className={formErrors.serialNumber && touched.serialNumber ? 'border-red-500' : ''}
                required
              />
              {formErrors.serialNumber && touched.serialNumber && (
                <p className="text-xs text-red-500 mt-1">{formErrors.serialNumber}</p>
            )}
            </div>

            {/* Port Type */}
            <div className="space-y-2">
              <Label htmlFor="verify-portType">Port Type</Label>
              <Input
                id="verify-portType"
                name="portType"
                value={verifyFormData.portType}
                onChange={handleVerifyFormChange}
                onBlur={() => handleBlur('portType')}
                placeholder="Enter port type (e.g., AC, DC Fast)"
                className={formErrors.portType && touched.portType ? 'border-red-500' : ''}
              />
              {formErrors.portType && touched.portType && (
                <p className="text-xs text-red-500 mt-1">{formErrors.portType}</p>
            )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="verify-email">Email</Label>
              <Input
                id="verify-email"
                name="email"
                type="email"
                value={verifyFormData.email}
                onChange={handleVerifyFormChange}
                onBlur={() => handleBlur('email')}
                placeholder="Enter email address"
                className={formErrors.email && touched.email ? 'border-red-500' : ''}
                required
              />
              {formErrors.email && touched.email && (
                <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>
            )}
            </div>

            {/* Mobile Number */}
            <div className="space-y-2">
              <Label htmlFor="verify-mobileNumber">Mobile Number</Label>
              <Input
                id="verify-mobileNumber"
                name="mobileNumber"
                value={verifyFormData.mobileNumber}
                onChange={handleVerifyFormChange}
                onBlur={() => handleBlur('mobileNumber')}
                placeholder="Enter mobile number"
                className={formErrors.mobileNumber && touched.mobileNumber ? 'border-red-500' : ''}
                required
              />
              {formErrors.mobileNumber && touched.mobileNumber && (
                <p className="text-xs text-red-500 mt-1">{formErrors.mobileNumber}</p>
            )}
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="verify-status">Status</Label>
              <Input
                id="verify-status"
                value="Approved"
                readOnly
                className="bg-slate-100 font-semibold text-green-700"
              />
            </div>
            {/* Address */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="verify-addreAddressss">Address</Label>
              <Input
                id="verify-address"
                name="address"
                value={verifyFormData.address}
                onChange={handleVerifyFormChange}
                onBlur={() => handleBlur('address')}
                placeholder="Enter complete address"
                className={formErrors.address && touched.address ? 'border-red-500' : ''}
                required
              />
              {formErrors.address && touched.address && (
                <p className="text-xs text-red-500 mt-1">{formErrors.address}</p>
            )}
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Station"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
//VERIFY STATION COMPONENT..