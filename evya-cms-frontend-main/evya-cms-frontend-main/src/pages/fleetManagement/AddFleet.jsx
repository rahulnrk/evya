import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDispatch, useSelector } from 'react-redux';
import { addFleet, resetAddFleetStatus } from '@/store/reducers/fleet/FleetSlice';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReloadIcon } from "@radix-ui/react-icons";
import { validateEmail,validateName,validateMobileNumber,validateLocation } from '../validations/Validation';

const AddFleet = ({
  open,
  onOpenChange,
  onFleetAdded
}) => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { addFleetStatus, addFleetError } = useSelector((state) => state.fleet);
  const { user } = useSelector((state) => state.authentication);
  const [ formErrors, setFormErrors ] = useState({});
  const [touched,setTouched] = useState({
      fleetName: false,
      ownerName: false,
      ownerEmail: false,
      ownerPhone: false,
      baseLocation: false
  });

  const [formData, setFormData] = useState({
    fleetName: '', 
    ownerName: '',
    ownerEmail: '', 
    ownerPhone: '', 
    baseLocation: '', 
    status: 'ACTIVE', 
    orgId: user?.orgId || ''
  });

  useEffect(() => {
    console.log('Add fleet status:', addFleetStatus);
    console.log('Add fleet error:', addFleetError);

    if (addFleetStatus === 'succeeded') {
      toast({
        title: 'Success',
        description: 'Fleet added successfully!',
        variant: 'default',
      });
      if (onFleetAdded) {
        onFleetAdded();
      }
      onOpenChange(false);
      dispatch(resetAddFleetStatus());
    }

if (addFleetStatus === 'failed') {
  console.log('Full addFleetError object:', addFleetError);
  
  // The error is now directly the string from error.response?.data
  const errorMessage = addFleetError || 'Failed to add fleet';
  
  console.log('Error message extracted:', errorMessage);
  
  const lowerCaseError = String(errorMessage).toLowerCase();
  
  if (lowerCaseError.includes("email") && 
      (lowerCaseError.includes("already") || lowerCaseError.includes("exists"))) {
    setFormErrors(prev => ({ 
      ...prev, 
      ownerEmail: "Email already exists" 
    }));
    
    toast({
      title: 'Duplicate Email',
      description: errorMessage,
      variant: 'destructive',
    });
  } 
  else if ((lowerCaseError.includes("mobile") || lowerCaseError.includes("phone")) &&
           (lowerCaseError.includes("already") || lowerCaseError.includes("exists"))) {
    setFormErrors(prev => ({ 
      ...prev, 
      ownerPhone: "Mobile number already exists" 
    }));
    
    toast({
      title: 'Duplicate Mobile Number',
      description: errorMessage,
      variant: 'destructive',
    });
  } 
  else {
    toast({
      title: 'Error',
      description: errorMessage,
      variant: 'destructive',
    });
  }

  dispatch(resetAddFleetStatus());
}

  }, [addFleetStatus, addFleetError, dispatch, toast, onFleetAdded, onOpenChange]);

  useEffect(() => {
  const errors = {};
  if (validateName(formData.fleetName)) errors.fleetName = validateName(formData.fleetName);
  if (validateName(formData.ownerName)) errors.ownerName = validateName(formData.ownerName);
  if (validateEmail(formData.ownerEmail)) errors.ownerEmail = validateEmail(formData.ownerEmail);
  if (validateMobileNumber(formData.ownerPhone)) errors.ownerPhone = validateMobileNumber(formData.ownerPhone);
  if (validateLocation(formData.baseLocation)) errors.baseLocation = validateLocation(formData.baseLocation);
  setFormErrors(errors);
}, [formData]);

useEffect(() => {
  const errors = {};

  // Only add to errors if validation returns a string (error message)
  const fleetNameError = validateName(formData.fleetName);
  if (fleetNameError) errors.fleetName = fleetNameError;

  const ownerNameError = validateName(formData.ownerName);
  if (ownerNameError) errors.ownerName = ownerNameError;

  const emailError = validateEmail(formData.ownerEmail);
  if (emailError) errors.ownerEmail = emailError;

  const mobileError = validateMobileNumber(formData.ownerPhone);
  if (mobileError) errors.ownerPhone = mobileError;

  const locationError = validateLocation(formData.baseLocation);
  if (locationError) errors.baseLocation = locationError;

  setFormErrors(errors);
}, [formData]);

const handleBlur = (e) => {
  const { name } = e.target;
  setTouched(prev => ({ ...prev, [name]: true }));
};

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

 const handleSubmit = (e) => {
  e.preventDefault();
  
  // Mark all fields as touched
  setTouched({
    fleetName: true,
    ownerName: true,
    ownerEmail: true,
    ownerPhone: true,
    baseLocation: true
  });

  // Check for validation errors
  if (Object.keys(formErrors).length > 0) {
    toast({ title: "Validation Error", description: "Please fix validation errors", variant: "destructive" });
    return;
  }

  dispatch(addFleet(formData));
};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Fleet</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fleetName">Fleet Name *</Label>
              <Input 
                id="fleetName" 
                name="fleetName" 
                value={formData.fleetName} 
                onChange={handleChange} 
                required 
                disabled={addFleetStatus === 'loading'}
                onBlur={handleBlur}
              />
              {touched.fleetName && formErrors.fleetName && (
                <p className="text-sm text-red-500">{formErrors.fleetName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownerName">Owner Name *</Label>
              <Input 
                id="ownerName" 
                name="ownerName" 
                value={formData.ownerName} 
                onChange={handleChange} 
                required 
                disabled={addFleetStatus === 'loading'}
                onBlur={handleBlur}
              />
              {touched.ownerName && formErrors.ownerName && (
                <p className="text-sm text-red-500"> {formErrors.ownerName}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerEmail">Owner Email *</Label>
              <Input 
                id="ownerEmail" 
                name="ownerEmail" 
                type="email"
                value={formData.ownerEmail} 
                onChange={handleChange} 
                required 
                disabled={addFleetStatus === 'loading'}
                onBlur={handleBlur}
              />
              {touched.ownerEmail && formErrors.ownerEmail && (
                <p className="text-sm text-red-500"> {formErrors.ownerEmail}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownerPhone">Owner Phone *</Label>
              <Input 
                id="ownerPhone" 
                name="ownerPhone" 
                type="tel"
                value={formData.ownerPhone} 
                onChange={handleChange} 
                required 
                disabled={addFleetStatus === 'loading'}
                onBlur={handleBlur}
              />
              {touched.ownerPhone && formErrors.ownerPhone && (
                <p className="text-sm text-red-500"> {formErrors.ownerPhone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="baseLocation">Address *</Label>
              <Input 
                id="baseLocation" 
                name="baseLocation" 
                value={formData.baseLocation} 
                onChange={handleChange} 
                required 
                disabled={addFleetStatus === 'loading'}
                onBlur={handleBlur}
              />
              {touched.baseLocation && formErrors.baseLocation && (
                <p className="text-sm text-red-500"> {formErrors.baseLocation}</p>
              )}
            </div>
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={addFleetStatus === 'loading'}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={addFleetStatus === 'loading'}
            >
              {addFleetStatus === 'loading' ? (
                <>
                  <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Fleet'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddFleet;

//Fleet.