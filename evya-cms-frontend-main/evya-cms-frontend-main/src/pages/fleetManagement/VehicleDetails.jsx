import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom'; 
import { Button } from '@/components/ui/button';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVehicleDetails, resetFleetDetails, updateFleetVehicle } from '@/store/reducers/fleet/FleetSlice';
import { toast } from '@/components/ui/use-toast';
import BackButton from '@/components/ui/BackButton';
import { Card, CardContent } from "@/components/ui/card";
import Loading from '@/users/Loading';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReloadIcon } from '@radix-ui/react-icons';
const VehicleDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); 
  const dispatch = useDispatch();
  const { currentVehicle, status, error } = useSelector((state) => state.fleet);
  const [editMode, setEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fleetFromState = location.state?.fleet;

  const [editForm, setEditForm] = useState({
    vehicleNumber: '',
    model: '',
    capacityKw: '',
    driver: '',
    location: '',
    batteryLeft: '',
    bookings: '',
    status: ''
  });

useEffect(() => {
  console.log('URL param id:', id); // Check what id is from URL
  if (id) {
    dispatch(fetchVehicleDetails(String(id)));
  }
}, [dispatch, id]);

useEffect(() => {
  console.log('Current Vehicle:', currentVehicle); // Check what's in currentVehicle
  console.log('Current Vehicle Number:', currentVehicle?.vehicleNumber); // Check vehicleNumber specifically
  
  if (currentVehicle) {
    setEditForm({
      vehicleNumber: currentVehicle.vehicleNumber || '',
      model: currentVehicle.model || '',
      capacityKw: currentVehicle.capacityKw || '',
      driver: currentVehicle.driver || '',
      location: currentVehicle.location || '',
      batteryLeft: currentVehicle.batteryLeft || '',
      bookings: currentVehicle.bookings || '',
      status: currentVehicle.status || ''
    });
  }
}, [currentVehicle]);

  useEffect(() => {
    if (currentVehicle) {
      setEditForm({
        vehicleNumber: currentVehicle.vehicleNumber || '',
        model: currentVehicle.model || '',
        capacityKw: currentVehicle.capacityKw || '',
        driver: currentVehicle.driver || '',
        location: currentVehicle.location || '',
        batteryLeft: currentVehicle.batteryLeft || '',
        bookings: currentVehicle.bookings || '',
        status: currentVehicle.status || ''
      });
    }
  }, [currentVehicle]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditVehicle = () => {
    setEditMode(true);
  };
const handleDeleteConfirm = async () => {
  if (vehicleToDelete && id) {
    try {
      console.log('Deleting vehicle:', vehicleToDelete); // Add debug
      console.log('Vehicle Number:', vehicleToDelete.vehicleNumber); // Add debug
      
      await dispatch(deleteVehicleFromFleet({ 
        fleetId: id, 
        vehicleNumber: vehicleToDelete.vehicleNumber  // Make sure this is vehicleNumber
      })).unwrap();
      
      dispatch(fetchFleetVehicles(id));
      
      toast({
        title: 'Success',
        description: 'Vehicle deleted successfully',
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete vehicle',
        variant: 'destructive',
      });
    }
  }
  setDeleteDialogOpen(false);
  setVehicleToDelete(null);
};
const handleSave = async () => {
  try {
    setIsSubmitting(true);

    // DEBUG: Log what we have
    console.log('currentVehicle in handleSave:', currentVehicle);
    console.log('editForm.vehicleNumber:', editForm.vehicleNumber);
    console.log('URL param id:', id);

    // FIRST: Try to get vehicleNumber from currentVehicle
    let vehicleNumber = currentVehicle?.vehicleNumber;
    
    // SECOND: If not found, try from editForm
    if (!vehicleNumber) {
      vehicleNumber = editForm.vehicleNumber;
    }
    
    // THIRD: If still not found, try from URL params
    if (!vehicleNumber) {
      vehicleNumber = id;
    }
    
    // FINAL: If still undefined, throw error
    if (!vehicleNumber || vehicleNumber === 'undefined') {
      throw new Error(`Vehicle number is undefined. 
        currentVehicle.vehicleNumber: ${currentVehicle?.vehicleNumber}
        editForm.vehicleNumber: ${editForm.vehicleNumber}
        URL id: ${id}`);
    }

    console.log('Using vehicleNumber for update:', vehicleNumber);

    const payload = {
      ...editForm,
      capacityKw: Number(editForm.capacityKw),
      batteryLeft: Number(editForm.batteryLeft),
      bookings: Number(editForm.bookings),
    };



    await dispatch(
      updateFleetVehicle({
        vehicleNumber: vehicleNumber,
        vehicleData: payload,
      })
    ).unwrap();

    // refresh fleet vehicles
    if (fleetFromState?.id) {
      dispatch(fetchVehicleDetails(fleetFromState.id));
    }

    toast({
      title: "Success",
      description: "Vehicle details updated successfully",
    });

    setEditMode(false);

    navigate(`/fleet/${fleetFromState?.id}`, {
      state: { activeTab: "vehicles" },
    });

  } catch (error) {
    console.error("Update failed:", error);

    toast({
      title: "Error",
      description: error?.message || "Failed to update vehicle details",
      variant: "destructive",
    });
  } finally {
    setIsSubmitting(false);
  }
};



  const handleCancel = () => {
    if (currentVehicle) {
      setEditForm({
        vehicleNumber: currentVehicle.vehicleNumber || '',
        model: currentVehicle.model || '',
        capacityKw: currentVehicle.capacityKw || '',
        driver: currentVehicle.driver || '',
        location: currentVehicle.location || '',
        batteryLeft: currentVehicle.batteryLeft || '',
        bookings: currentVehicle.bookings || '',
        status: currentVehicle.status || ''
      });
    }
    setEditMode(false);
  };

  if (status === 'loading') {
    return <Loading />;
  }

  if (status === 'failed' || !currentVehicle) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold">Vehicle Not Found</h1>
        <BackButton />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Vehicle Details - {currentVehicle.vehicleNumber}</h1>
        <div className="flex gap-2">
          <BackButton />
        </div>
      </div>

      {editMode ? (
        // EDIT MODE - Two Column Layout
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Edit Vehicle</h1>
          </div>
          
          <Card className="p-6">
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehiclenumber">Vehicle ID</Label>
                  <Input
                    id="vehiclenumber"
                    name="vehicleNumber"
                    value={editForm.vehicleNumber}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    name="model"
                    value={editForm.model}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacityKw">Capacity (kW)</Label>
                  <Input
                    id="capacityKw"
                    name="capacityKw"
                    type="number"
                    value={editForm.capacityKw}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="driver">Driver</Label>
                  <Input
                    id="driver"
                    name="driver"
                    value={editForm.driver}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    name="location"
                    value={editForm.location}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batteryLeft">Battery Left (%)</Label>
                  <Input
                    id="batteryLeft"
                    name="batteryLeft"
                    type="number"
                    min="0"
                    max="100"
                    value={editForm.batteryLeft}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bookings">Bookings</Label>
                  <Input
                    id="bookings"
                    name="bookings"
                    value={editForm.bookings}
                    onChange={handleInputChange}
                  />
                </div>
                {/* <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Input
                    id="status"
                    name="status"
                    value={editForm.status}
                    onChange={handleInputChange}
                  />
                </div> */}

            <div className="space-y-2">
                  <Label>Status *</Label>
                  <Select 
                    value={editForm.status} 
                    onValueChange={(value) => handleInputChange({ target: { name: 'status', value } })}
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
              
           <div className="flex justify-end gap-4 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : (
        // VIEW MODE - Two Column Layout with Cards
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Vehicle Information</TabsTrigger>
            <TabsTrigger value="additional">Additional Information</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details">
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Vehicle Information</h2>
                <Button
                  size="sm"
                  onClick={handleEditVehicle}
                  className="px-4 py-3 text-base"

                >
                  Edit
                </Button>
              </div>             
              <Card className="p-6 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold text-gray-600">Vehicle Number</p>
                    <p className="font-medium">{currentVehicle.vehicleNumber || '-'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-600">Model</p>
                    <p className="font-medium">{currentVehicle.model || '-'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-600 mt-4">Capacity (kW)</p>
                    <p className="font-medium">{currentVehicle.capacityKw || '-'} kW</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-600 mt-4">Driver</p>
                    <p className="font-medium">{currentVehicle.driver || '-'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-600 mt-4">Location</p>
                    <p className="font-medium">{currentVehicle.location || '-'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-600 mt-4">Battery Left</p>
                    <p className="font-medium">{currentVehicle.batteryLeft || '-'}%</p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="additional">
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Additional Information</h2>
              </div>
              
              <Card className="p-6 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold text-gray-600">Bookings</p>
                    <p className="font-medium">{currentVehicle.bookings || '-'}</p>
                  </div>
                <div>
                  <p className="font-semibold text-gray-600">Status</p>
                  <p className="font-medium">
                    {currentVehicle.status ? (
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        currentVehicle.status.toUpperCase() === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800'
                          : currentVehicle.status.toUpperCase() === 'CHARGING'
                          ? 'bg-blue-100 text-blue-800'
                          : currentVehicle.status.toUpperCase() === 'MAINTENANCE'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {currentVehicle.status}
                      </span>
                    ) : (
                      '-'
                    )}
                  </p>
                </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default VehicleDetails;