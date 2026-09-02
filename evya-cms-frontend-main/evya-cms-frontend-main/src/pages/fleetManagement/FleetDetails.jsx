import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import AddVehicle from './AddVehicle';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchFleetDetails, 
  fetchFleetVehicles, 
  deleteVehicleFromFleet,
  resetFleetDetails,
  updateFleet,
} from '@/store/reducers/fleet/FleetSlice';
import { toast } from '@/components/ui/use-toast';
import BackButton from '@/components/ui/BackButton';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronDown, ChevronUp } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  InfoIcon, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Edit, 
  AlertCircle
} from 'lucide-react';
import Loading from '@/users/Loading';

const FleetDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); 
  const defaultTab = location.state?.activeTab || "details";

  const dispatch = useDispatch();
  const { 
    fleets, 
    error, 
    deleteFleetStatus,
    currentFleet, 
    fleetVehicles, 
    fleetDetailsStatus,
    fleetDetailsError,
    status,
    updateFleetStatus
  } = useSelector((state) => state.fleet);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedFleet, setEditedFleet] = useState(null);
  const fleetFromState = location.state?.fleet;

  const [addVehicleOpen, setAddVehicleOpen] = useState(false); 
  const [activeTab, setActiveTab] = useState('info');
 const initialFleet = location.state?.fleet || currentFleet;
const [fleetStatus, setFleetStatus] = useState(initialFleet?.status || "Active");

  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);


const handleFleetStatusChange = async (newStatus) => {
  if (!currentFleet?.id) return;
  setUpdatingStatus(true);

  try {
    setUpdatingStatus(true);
    const normalizedStatus =
      newStatus.toUpperCase() === "ACTIVE"
        ? "ACTIVE"
        : "INACTIVE";

    const fleetData = {
      status: normalizedStatus,
    };

    // Update in Redux
    await dispatch(
      updateFleet({
        id: currentFleet.id,
        fleetData,
      })
    ).unwrap();

    setFleetStatus(newStatus);
    setEditedFleet(prev => ({ ...prev, status: normalizedStatus }));
    
    dispatch(fetchFleetDetails(id));
    
    setDropdownOpen(false);

    toast({
      title: "Success",
      description: `Fleet status updated to ${newStatus}`,
    });
  } catch (err) {
    console.error("Status update failed:", err);

    toast({
      title: "Error",
      description: "Failed to update fleet status",
      variant: "destructive",
    });
  } finally {
    setUpdatingStatus(false);
  }
};

useEffect(() => {
  if (id) {
    dispatch(fetchFleetDetails(id));
    dispatch(fetchFleetVehicles(id));
  }

  return () => {
    dispatch(resetFleetDetails());
  };
}, [dispatch, id]);

  useEffect(() => {
    if (id) {
      dispatch(fetchFleetDetails(id));
      dispatch(fetchFleetVehicles(id));
    }

    return () => {
      dispatch(resetFleetDetails());
    };
  }, [dispatch, id]);

  useEffect(() => {
    if (currentFleet) {
      setEditedFleet({ ...currentFleet });
    }
  }, [currentFleet]);

  useEffect(() => {
  if (currentFleet?.status) {
    setFleetStatus(
      currentFleet.status.charAt(0) +
        currentFleet.status.slice(1).toLowerCase()
    );
    // setLocalFleet(currentFleet);
  }
}, [currentFleet]);

// Add this useEffect to sync the currentFleet status
useEffect(() => {
  if (currentFleet && fleetStatus) {
    const formattedStatus = 
      currentFleet.status === 'ACTIVE' ? 'Active' :
      currentFleet.status === 'INACTIVE' ? 'Inactive' :
      currentFleet.status;
    
    if (fleetStatus !== formattedStatus) {
      setFleetStatus(formattedStatus);
    }
  }
}, [currentFleet, fleetStatus]);

  const handleRefresh = () => {
    if (id) {
      dispatch(fetchFleetDetails(id));
      dispatch(fetchFleetVehicles(id));
    }
  };

  const handleAddVehicle = () => {
  setAddVehicleOpen(true); 
  };

  const handleRefreshVehicles = () => {
    if (id) {
      dispatch(fetchFleetVehicles(id));
    }
  };
  const handleEditFleet = () => {
  setIsEditing(true);
  };

  const handleSaveFleet = async () => {
    try {
      const fleetDataToUpdate = {
        fleetName: editedFleet.fleetName,
        ownerName: editedFleet.ownerName,
        ownerEmail: editedFleet.ownerEmail,
        ownerPhone: editedFleet.ownerPhone,
        baseLocation: editedFleet.baseLocation,
        status: editedFleet.status
      };
      
      await dispatch(updateFleet({ 
        id: currentFleet.id, 
        fleetData: fleetDataToUpdate 
      })).unwrap();
      
      toast({
        title: 'Success',
        description: 'Fleet updated successfully',
        variant: 'default',
      });
      
      setIsEditing(false);
      dispatch(fetchFleetDetails(id));
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update fleet',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteClick = (vehicle) => {
    setVehicleToDelete(vehicle);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (vehicleToDelete && id) {
      try {
        await dispatch(deleteVehicleFromFleet({ 
          fleetId: id, 
          vehicleNumber: vehicleToDelete.vehicleNumber 
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

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setVehicleToDelete(null);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditedFleet(currentFleet ? { ...currentFleet } : null);
  };

  const handleInputChange = (field, value) => {
    setEditedFleet(prev => ({
      ...prev,
      [field]: value
    }));
  };


  if (fleetDetailsStatus === 'loading') {
    return (
      <div className="container mx-auto p-4">
        
        <Loading />
      </div>
    );
  }

  if (fleetDetailsStatus === 'failed') {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Error Loading Fleet</h1>
          <BackButton />
        </div>
        
        <Card className="mb-4">
          <CardContent className="p-6">
            <div className="flex items-center text-red-600 mb-4">
              <AlertCircle className="h-6 w-6 mr-2" />
              <h3 className="text-lg font-semibold">Error Details</h3>
            </div>
            <div className="space-y-2">
              <p><strong>Error Message:</strong> {fleetDetailsError || 'Unknown error'}</p>
              <p><strong>Fleet ID:</strong> {id}</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button onClick={handleRefresh} className="mr-2">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button variant="outline" onClick={() => navigate('/fleet')}>
            Back to Fleets
          </Button>
        </div>
      </div>
    );
  }

  if (fleetDetailsStatus === 'succeeded' && (!currentFleet || Object.keys(currentFleet).length === 0)) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Fleet Not Found</h1>
          <BackButton />
        </div>
        
        <Card className="mb-4">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Fleet with ID <strong>{id}</strong> could not be found.
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-center gap-2">
          <Button onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
          <Button variant="outline" onClick={() => navigate('/fleet')}>
            Back to Fleets
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
    <div className="flex justify-between items-center mb-6">
  <div className="flex items-center gap-4">  {/* wrap name + status */}
    <h1 className="text-2xl font-bold">{currentFleet?.fleetName || 'Unknown Fleet'}</h1>
   <div className="relative">
  <button
    className={`flex items-center px-4 py-1.5 border rounded-full transition ${
      fleetStatus === "Active"
        ? "bg-green-100 text-green-800 border-green-400"
        : "bg-red-200 text-red-800 border-red-400"
    } ${updatingStatus ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    onClick={() => !updatingStatus && setDropdownOpen(prev => !prev)}
    disabled={updatingStatus}
  >
    {updatingStatus ? (
      <>
        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
        Updating...
      </>
    ) : (
      fleetStatus
    )}
    {dropdownOpen ? (
      <ChevronUp className="ml-2 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-2 h-4 w-4" />
    )}
  </button>
  
  {dropdownOpen && (
    <div className="absolute mt-2 w-48 bg-white shadow-lg rounded-md z-50 p-3">
      {["Active", "Inactive"].map(option => (
        <button
          key={option}
          className={`w-full text-left px-4 py-1.5 mb-1 rounded-full border transition ${
            option === "Active"
              ? "bg-green-100 text-green-800 border-green-400 hover:bg-green-200"
              : "bg-red-200 text-red-800 border-red-400 hover:bg-red-300"
          }`}
          onClick={() => {
            handleFleetStatusChange(option);
            setDropdownOpen(false);
          }}
        >
          {option}
        </button>
      ))}
    </div>
  )}
</div>
  </div>
  <BackButton /> 
</div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Tabs */}
        <TabsList className="grid w-full grid-cols-2 font-bold text-sm mb-6">
          <TabsTrigger value="info">Fleet Info</TabsTrigger>
          <TabsTrigger value="vehicles">
            Vehicles ({fleetVehicles?.length || 0})
          </TabsTrigger>
        </TabsList>
      <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {activeTab === 'info' ? 'Fleet Information' : 'Fleet Vehicles'}
            </h2>

            {/* Right-side action button */}
            {activeTab === 'info' && !isEditing && (
              <Button onClick={handleEditFleet}>
                Edit
              </Button>
            )}

            {activeTab === 'vehicles' && (
              <Button onClick={handleAddVehicle}>
                <Plus className="h-4 w-4 mr-2" />
                Add Vehicle
              </Button>
            )}
          </div>
          
        <TabsContent value="info">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
               <div>
                  <p className="text-sm text-muted-foreground">Fleet Name</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedFleet.fleetName || ''}
                      onChange={(e) => handleInputChange('fleetName', e.target.value)}
                      className="w-full mt-1 p-2 border rounded"
                    />
                  ) : (
                    <p className="font-medium">{currentFleet?.fleetName || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Owner Name</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedFleet.ownerName || ''}
                      onChange={(e) => handleInputChange('ownerName', e.target.value)}
                      className="w-full mt-1 p-2 border rounded"
                    />
                  ) : (
                    <p className="font-medium">{currentFleet?.ownerName || 'N/A'}</p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Owner Email</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedFleet.ownerEmail || ''}
                      onChange={(e) => handleInputChange('ownerEmail', e.target.value)}
                      className="w-full mt-1 p-2 border rounded"
                    />
                  ) : (
                    <p className="font-medium">{currentFleet?.ownerEmail || 'N/A'}</p>
                  )}
                </div>
                   <div>
                  <p className="text-sm text-muted-foreground">Owner Phone</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedFleet.ownerPhone || ''}
                      onChange={(e) => handleInputChange('ownerPhone', e.target.value)}
                      className="w-full mt-1 p-2 border rounded"
                    />
                  ) : (
                    <p className="font-medium">{currentFleet?.ownerPhone || 'N/A'}</p>
                  )}
                </div>
                  <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedFleet.baseLocation || ''}
                      onChange={(e) => handleInputChange('baseLocation', e.target.value)}
                      className="w-full mt-1 p-2 border rounded"
                    />
                  ) : (
                    <p className="font-medium">{currentFleet?.baseLocation || 'N/A'}</p>
                  )}
                </div>
               {/* Status */}
            <div>
              <p className="text-sm text-muted-foreground">Status</p>

              {isEditing ? (
                <select
                  value={editedFleet.status || ''}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full mt-1 p-2 border rounded"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              ) : (
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    (currentFleet?.status || '').toUpperCase() === 'ACTIVE'
                      ? 'bg-green-100 text-green-800'
                      : (currentFleet?.status || '').toUpperCase() === 'MAINTENANCE'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {currentFleet?.status || 'N/A'}
                </span>
              )}
            </div>
      <div className="md:col-span-2">
  <p className="text-sm text-muted-foreground">Number of Vehicles</p>

  {isEditing ? (
    <>
      <input
        type="text"
        value={fleetVehicles?.length || 0}
        readOnly
        disabled
        className="w-full mt-1 px-3 py-2 border rounded bg-gray-100 text-gray-700 cursor-not-allowed"
      />

      {/* Action buttons */}
      <div className="flex justify-end gap-3 mt-6 pt-4">
        <Button variant="outline" onClick={handleEditCancel}>
          Cancel
        </Button>

        <Button
          onClick={handleSaveFleet}
          disabled={updateFleetStatus === 'loading'}
        >
          {updateFleetStatus === 'loading' ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </>
  ) : (
    <p className="font-medium mt-1">
      {fleetVehicles?.length || 0}
    </p>
  )}
</div>


              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vehicles">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">  
              </div>
              
              {status === 'loading' ? (
                <Loading />
              ) : (
                <Table>
  <TableHeader>
    <TableRow>
      <TableHead>Vehicle Number</TableHead>
      <TableHead>Model</TableHead>
      <TableHead>Driver</TableHead>
      <TableHead>Battery Left</TableHead>
      <TableHead>Capacity (kW)</TableHead>
      <TableHead>Location</TableHead>
      <TableHead>Bookings</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {fleetVehicles && Array.isArray(fleetVehicles) && fleetVehicles.map(vehicle => (
      <TableRow key={vehicle.id}>  {/* Use vehicle.id for key */}
        <TableCell>{vehicle.vehicleNumber || 'N/A'}</TableCell>  {/* Fixed: vehicleNumber */}
        <TableCell>{vehicle.model || 'N/A'}</TableCell>
        <TableCell>{vehicle.driver || 'N/A'}</TableCell>
        <TableCell>{vehicle.batteryLeft !== undefined ? `${vehicle.batteryLeft}%` : 'N/A'}</TableCell>
        <TableCell>{vehicle.capacityKw !== undefined ? `${vehicle.capacityKw} kW` : 'N/A'}</TableCell>
        <TableCell>{vehicle.location || 'N/A'}</TableCell>
        <TableCell>{vehicle.bookings !== undefined ? vehicle.bookings : 'N/A'}</TableCell>
        <TableCell>
          <span className={`px-2 py-1 rounded-full text-xs ${
            (vehicle.status || '').toUpperCase() === 'ACTIVE' ? 'bg-green-100 text-green-800' :
            (vehicle.status || '').toUpperCase() === 'CHARGING' ? 'bg-blue-100 text-blue-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {vehicle.status || 'UNKNOWN'}
          </span>
        </TableCell>
        <TableCell>
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() =>
                navigate(`/vehicle/${vehicle.vehicleNumber}`, {  // Use vehicleNumber in URL
                  state: { vehicle, fleet: currentFleet },
                })
              }
            >
              <InfoIcon className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleDeleteClick(vehicle)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    ))}
    {(!Array.isArray(fleetVehicles) || fleetVehicles.length === 0) && (
      <TableRow>
        <TableCell colSpan="9" className="text-center text-muted-foreground py-6">
          No vehicles found for this fleet.
        </TableCell>
      </TableRow>
    )}
  </TableBody>
</Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
     <AddVehicle
          open={addVehicleOpen}
          onOpenChange={setAddVehicleOpen}
          onVehicleAdded={handleRefreshVehicles}
          fleetId={id} 
          fleetName={currentFleet?.fleetName}
        />

      {deleteDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md">
            <h3 className="text-lg font-semibold mb-2">Delete Vehicle?</h3>
            <p className="text-muted-foreground mb-4">
              Are you sure you want to delete {vehicleToDelete?.model} (ID: {vehicleToDelete?.vehicleId})?
            </p>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={handleDeleteCancel}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteConfirm}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FleetDetails;