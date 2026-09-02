import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { InfoIcon, Trash2, TrendingUp } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFleets, deleteFleet } from '@/store/reducers/fleet/FleetSlice';
import { useNavigate, } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import AddFleet from './AddFleet'; 
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,  
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Loading from '@/users/Loading';

const FleetManagement = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { fleets, status, loading, error, deleteFleetStatus } = useSelector((state) => state.fleet);
  const { totalPages } = useSelector((state) => state.fleet);
  const { user } = useSelector((state) => state.authentication);
  const [addFleetOpen, setAddFleetOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;
  const [search, setSearch] = useState ("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fleetToDelete, setFleetToDelete] = useState(null);

 useEffect(() => {
  console.log('Dispatching fetchFleets with:', {
    orgId: user?.orgId,
    page: currentPage,
    size: pageSize,
    search
  });
  
  dispatch(fetchFleets({ 
    orgId: user?.orgId,
    page: currentPage,
    size: pageSize,
    search
  })).then((result) => {
    console.log('Fetch fleets result:', result);
    if (result.payload) {
      console.log('Fleets data structure:', result.payload);
      console.log('Fleets array:', result.payload.fleets || result.payload.content);
    }
  });
}, [dispatch, user?.orgId, currentPage, pageSize, search]);

  const handleDeleteClick = (fleet) => {
  setFleetToDelete(fleet);
  setDeleteDialogOpen(true);
};

// Handle delete confirmation
const handleDeleteConfirm = async () => {
  if (fleetToDelete && fleetToDelete.id) {
    try {
      await dispatch(deleteFleet(fleetToDelete.id)).unwrap();
      
      toast({
        title: 'Success',
        description: 'Fleet deleted successfully',
        variant: 'default',
      });
      
      // Refresh the fleets list
      dispatch(fetchFleets({ 
        orgId: user?.orgId,
        page: currentPage,
        size: pageSize,
        search
      }));
    } catch (error) {
      toast({
        title: 'Error',
        description: error || 'Failed to delete fleet',
        variant: 'destructive',
      });
    }
  }
  setDeleteDialogOpen(false);
  setFleetToDelete(null);
};

// Handle delete cancellation
const handleDeleteCancel = () => {
  setDeleteDialogOpen(false);
  setFleetToDelete(null);
};
const handleFleetAdded = () => {
    dispatch(fetchFleets({ 
      orgId: user?.orgId,
      page: currentPage,
      size: pageSize
    }));
    toast({
      title: 'Success',
      description: 'Fleet added successfully!',
      variant: 'default',
    });
  };
  const fleetsArray = Array.isArray(fleets) ? fleets : [];


  if (status === 'failed') {
    return (
      <div className="container mx-auto p-4">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
  <div className="container mx-auto p-4">
  <div className="flex justify-between items-center mb-2">
    <h1 className="text-2xl font-bold">Fleet Management</h1>

    <div className="flex gap-3">
      {/* <Button onClick={() => navigate('/fleet/revenue')}>
        <TrendingUp className="h-4 w-4 mr-2" />
        View Revenue
      </Button> */}

      <Button onClick={() => setAddFleetOpen(true)}>
        Add Fleet
      </Button>
    </div>
  </div>
  <div className="w-full mb-4">
    <Input
      placeholder="Search by Name, Mobile, Email, Location..."
      value={search}
      onChange={(e) => {
        setSearch(e.target.value);
        setCurrentPage(0);
      }}
      className="w-full"
    />
  </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fleet Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Owner Name</TableHead>
              <TableHead>Owner Email</TableHead>
              <TableHead>Owner Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            { status === "loading" ? (
              <TableRow>
                <TableCell  colSpan={8} className="text-center py-4">
                  <Loading / >
                </TableCell>
              </TableRow> ) :
              fleetsArray.map(fleet => (
              <TableRow key={fleet.id}>
                <TableCell>{fleet.fleetName || 'N/A'}</TableCell>
                <TableCell>{fleet.baseLocation || 'N/A'}</TableCell>
                <TableCell>{fleet.ownerName || 'N/A'}</TableCell>
                <TableCell>{fleet.ownerEmail || 'N/A'}</TableCell>
                <TableCell>{fleet.ownerPhone || 'N/A'}</TableCell>
                <TableCell>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    (fleet.status || '').toUpperCase() === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                    (fleet.status || '').toUpperCase() === 'MAINTENANCE' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {fleet.status || 'UNKNOWN'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/fleet/${fleet.id}`, { state: fleet })}
                    >
                      <InfoIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(fleet)}
                      disabled={deleteFleetStatus === 'loading'}
                    >
                      <Trash2 className="h-4 w-4 text-black-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {fleetsArray.length === 0 && (
              <TableRow>
                <TableCell colSpan="8" className="text-center text-muted-foreground py-6">
                  No fleets found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
       <AddFleet
        open={addFleetOpen}
        onOpenChange={setAddFleetOpen}
        onFleetAdded={handleFleetAdded}
      />
    <div className="flex items-center justify-center gap-2 py-4">
  <Button
  variant="outline"
  size="sm"
  onClick={() => setCurrentPage(prev => prev - 1)}
  disabled={currentPage === 0}
>
  Previous
</Button>

<div className="px-3 py-1 bg-green-600 text-white rounded">
   {currentPage + 1}
</div>

<Button
  variant="outline"
  size="sm"
  onClick={() => setCurrentPage(prev => prev + 1)}
  disabled={currentPage + 1 >= totalPages}
>
  Next
</Button>

</div>
{deleteDialogOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg max-w-md">
      <h3 className="text-lg font-semibold mb-2">Delete Fleet?</h3>
      <p className="text-muted-foreground mb-4">
        Are you sure you want to delete {fleetToDelete?.fleetName}?
        This action cannot be undone.
      </p>
      <div className="flex justify-end space-x-3">
        <Button variant="outline" onClick={handleDeleteCancel}>
          Cancel
        </Button>
        <Button 
          variant="destructive" 
          onClick={handleDeleteConfirm}
          disabled={deleteFleetStatus === 'loading'}
        >
          {deleteFleetStatus === 'loading' ? 'Deleting...' : 'Delete'}
        </Button>
      </div>
    </div>
  </div>
)}
 </div>
    
  );
};

export default FleetManagement;