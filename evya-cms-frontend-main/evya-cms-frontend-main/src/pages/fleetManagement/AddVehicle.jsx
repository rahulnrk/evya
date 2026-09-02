import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDispatch, useSelector } from 'react-redux';
import { addVehicleToFleet, resetVehicleStatus, fetchFleets } from '@/store/reducers/fleet/FleetSlice';
import { toast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ReloadIcon } from "@radix-ui/react-icons";
import { validateVehicleNumber } from '../validations/Validation';

const AddVehicle = ({ open,
  onOpenChange,
  onVehicleAdded,
  fleetId: propFleetId,
  fleetName
}) => {
  const { fleetId: paramFleetId } = useParams();
  const dispatch = useDispatch();
  const { addVehicleStatus, addVehicleError, fleets } = useSelector((state) => state.fleet);
  const { user } = useSelector((state) => state.authentication);

  const initialFleetId = propFleetId || paramFleetId || '';

  const [formData, setFormData] = useState({
    vehicleNumber: '', 
    model: '', 
    capacityKw: '', 
    driver: '', 
    location: '', 
    batteryLeft: '', 
    bookings: '0', 
    status: 'ACTIVE', 
    fleetId: initialFleetId
  });

  const [errors, setErrors] = useState({});
useEffect(() => {
  if (addVehicleStatus === 'succeeded') {
    toast({
      title: 'Success',
      description: 'Vehicle added successfully!',
      variant: 'default',
    });

    if (onVehicleAdded) onVehicleAdded();
    onOpenChange(false);
    dispatch(resetVehicleStatus());
  }

  if (addVehicleStatus === 'failed') {
    const errorMessage =
      addVehicleError?.response?.data?.message ||
      addVehicleError?.message ||
      'Failed to add vehicle';
    if (errorMessage.toLowerCase().includes("vehicle")) {
      setErrors({ vehicleNumber: errorMessage });
    }

    toast({
      title: 'Error',
      description: errorMessage,
      variant: 'destructive',
    });

    dispatch(resetVehicleStatus());
  }
}, [addVehicleStatus, addVehicleError, dispatch, toast, onVehicleAdded, onOpenChange]);


  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fleetId) {
      newErrors.fleetId = 'Fleet ID is required';
    }
    const vehicleNumberError = validateVehicleNumber(formData.vehicleNumber);
    if (vehicleNumberError) {
      newErrors.vehicleNumber = vehicleNumberError;
    }

    if (!formData.model) {
      newErrors.model = 'Model is required';
    }
    if (!formData.capacityKw || parseFloat(formData.capacityKw) <= 0) {
      newErrors.capacityKw = 'Valid capacity is required';
    }
    if (!formData.driver) {
      newErrors.driver = 'Driver is required';
    }
    if (!formData.location) {
      newErrors.location = 'Location is required';
    }
    if (!formData.batteryLeft || 
        parseFloat(formData.batteryLeft) < 0 || 
        parseFloat(formData.batteryLeft) > 100) {
      newErrors.batteryLeft = 'Battery percentage must be between 0-100';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
  const { name, value } = e.target;

  setFormData(prev => ({ ...prev, [name]: value }));

  if (name === "vehicleNumber") {
    const error = validateVehicleNumber(value);
    setErrors(prev => ({ ...prev, vehicleNumber: error }));
    return;
  }

  if (errors[name]) {
    setErrors(prev => ({ ...prev, [name]: '' }));
  }
};

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };


  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const vehicleData = {
      vehicleNumber: formData.vehicleNumber,
      model: formData.model,
      capacityKw: parseFloat(formData.capacityKw),
      driver: formData.driver,
      location: formData.location,
      batteryLeft: parseFloat(formData.batteryLeft),
      bookings: parseInt(formData.bookings) || 0,
      status: formData.status,
    };
    
    dispatch(addVehicleToFleet({ 
      fleetId: formData.fleetId, 
      vehicleForm: vehicleData
    }));
  };
  
  return (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Add New Vehicle</DialogTitle>
      </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Fleet Name</Label>
                <Input
                  value={fleetName || ''}
                  readOnly
                  disabled
                  className="cursor-not-allowed bg-gray-100 text-gray-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehiclenumber">Vehicle Number *</Label>
                <Input 
                  id="vehicleNumber" 
                  name="vehicleNumber" 
                  value={formData.vehicleNumber} 
                  onChange={handleChange} 
                  className={errors.vehicleNumber ? 'border-red-500' : ''}
                />
                {errors.vehicleNumber && (
                  <p className="text-red-500 text-sm">{errors.vehicleNumber}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model *</Label>
                <Input 
                  id="model" 
                  name="model" 
                  value={formData.model} 
                  onChange={handleChange} 
                  className={errors.model ? 'border-red-500' : ''}
                />
                {errors.model && (
                  <p className="text-red-500 text-sm">{errors.model}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacityKw">Capacity (kW) *</Label>
                <Input 
                  id="capacityKw" 
                  name="capacityKw" 
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.capacityKw} 
                  onChange={handleChange} 
                  className={errors.capacityKw ? 'border-red-500' : ''}
                />
                {errors.capacityKw && (
                  <p className="text-red-500 text-sm">{errors.capacityKw}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="driver">Driver *</Label>
                <Input 
                  id="driver" 
                  name="driver" 
                  value={formData.driver} 
                  onChange={handleChange} 
                  className={errors.driver ? 'border-red-500' : ''}
                />
                {errors.driver && (
                  <p className="text-red-500 text-sm">{errors.driver}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input 
                  id="location" 
                  name="location" 
                  value={formData.location} 
                  onChange={handleChange} 
                  className={errors.location ? 'border-red-500' : ''}
                />
                {errors.location && (
                  <p className="text-red-500 text-sm">{errors.location}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="batteryLeft">Battery Left (%) *</Label>
                <Input 
                  id="batteryLeft" 
                  name="batteryLeft" 
                  type="number" 
                  min="0" 
                  max="100" 
                  value={formData.batteryLeft} 
                  onChange={handleChange} 
                  className={errors.batteryLeft ? 'border-red-500' : ''}
                />
                {errors.batteryLeft && (
                  <p className="text-red-500 text-sm">{errors.batteryLeft}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Status *</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => handleSelectChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="CHARGING">Charging</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

            </div>
               <div className="flex justify-end space-x-4 pt-4">
              <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={addVehicleStatus === 'loading'}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={addVehicleStatus === 'loading'}
          >
            {addVehicleStatus === 'loading' ? (
              <>
                <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              'Add Vehicle'
            )}
          </Button>
        </div>
            </form>
    </DialogContent>
  </Dialog>
);
};

export default AddVehicle;