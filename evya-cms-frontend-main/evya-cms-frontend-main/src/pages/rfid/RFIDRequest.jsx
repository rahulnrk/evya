import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRfidRequests } from '@/store/reducers/rfid/rfidSlice';
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PenLine, Trash } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { activateRfid, deleteRfid } from '@/store/reducers/rfid/rfidSlice';
import ActivateRfidDialog from './RFIDActivate';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import AxiosServices from '@/services/AxiosServices';
import Loading from '@/users/Loading';

export default function RFIDRequests() {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { 
    list = [], 
    loading, 
    error, 
    totalElements,
    actionLoading,
    actionError,
    actionSuccess
  } = useSelector((state) => state.rfidRequest);
   const { user } = useSelector(state => state.authentication);
  const [globalFilter, setGlobalFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil((totalElements || 0) / pageSize));

  const [isActivateDialogOpen, setIsActivateDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  const [activeTab, setActiveTab] = useState("requests");
  const [rfidSearchInput, setRfidSearchInput] = useState('');
  const [searchedRfid, setSearchedRfid] = useState(null);

  useEffect(() => {
    dispatch(fetchRfidRequests({
      page: currentPage,
      size: pageSize,
      orgId:user?.orgId,
      filter: globalFilter || null
    }));
  }, [dispatch, currentPage, globalFilter]);

  useEffect(() => {
    if (actionSuccess) {
      toast({
        title: "Success",
        description: "Operation completed successfully",
      });
      dispatch(fetchRfidRequests({
        page: currentPage,
        size: pageSize,
        orgId:user?.orgId,
        filter: globalFilter || null,
        
      }));
    }
    if (actionError) {
      toast({
        variant: "destructive",
        title: "Error",
        description: actionError,
      });
    }
  }, [actionSuccess, actionError, toast]);

  //for copilot
  useEffect(() => {
    const handleOpenActivate = () => {
        // Find the first pending request (or simply the first request in the list)
        if (list && list.length > 0) {
            const firstRequest = list[0];
            setSelectedRequest(firstRequest);
            setIsActivateDialogOpen(true);
        } else {
            toast({
                title: "No pending requests",
                description: "There are no RFID requests to activate.",
                variant: "destructive",
            });
        }
    };
    window.addEventListener('openActivateRfidDialog', handleOpenActivate);
    return () => window.removeEventListener('openActivateRfidDialog', handleOpenActivate);
}, [list, toast]);

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleRfidSearch = async () => {
  try {
    const match = await AxiosServices.getRfidCard(rfidSearchInput);
    
    setSearchedRfid(match.data);
  } catch (error) {
    console.error('Error fetching RFID data:', error);
  }
};

console.log('searchedRfid',searchedRfid);
  const handleActivate = (request) => {
    setSelectedRequest(request);
    setIsActivateDialogOpen(true);
  };

  const handleActivateSubmit = async (payload) => {
    await dispatch(activateRfid(payload));
    setIsActivateDialogOpen(false);
    setSelectedRequest(null);
  };

  const handleDelete = async (id) => {
    const confirm = window.confirm('Are you sure you want to delete this RFID request?');
    if (confirm) {
      await dispatch(deleteRfid(id));
      dispatch(fetchRfidRequests({
        page: currentPage,
        size: pageSize,
        filter: globalFilter || null
      }));
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleRfidStatusChange = async (rfId, newStatus) => {
    try {
      await AxiosServices.updateRfidStatus(rfId);

      toast({
        title: "Success",
        description: `RFID status updated to ${newStatus}`,
      });

      handleRfidSearch();
    } catch (error) {
      console.error('Error updating RFID status:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update RFID status",
        variant: "destructive",
      });
    }
  };
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">RFID Management</h1>


{/* // All rfid request data */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="requests">RFID Requests</TabsTrigger>
          <TabsTrigger value="single">Search RFID</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <Input
            placeholder="Search By Name, Phone, Email, RFID"
            value={globalFilter}
            onChange={(e) => {
              setGlobalFilter(e.target.value);
              setCurrentPage(0);
            }}
            className="mb-4"
          />         
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-100">
                  <TableHead>First Name</TableHead>
                  <TableHead>Last Name</TableHead>
                  <TableHead>Date Generated</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Count</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Order Id</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
               {loading ? ( 
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-4"> 
                    <Loading />
                  </TableCell>
                </TableRow> 
                ):list && list.length > 0 ? (
                list.map((request) => (
                  <TableRow key={request.id} className="hover:bg-slate-50">
                    <TableCell>{request.firstName}</TableCell>
                    <TableCell>{request.lastName}</TableCell>
                    <TableCell>{formatDate(request.dateGenerated)}</TableCell>
                    <TableCell>{request.mobile}</TableCell>
                    <TableCell>{request.rfidCount}</TableCell>
                    <TableCell>{request.email}</TableCell>
                    <TableCell>{request.orderId}</TableCell>
                    <TableCell>{request.address}</TableCell>
                    <TableCell>{request.status}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0" 
                          onClick={() => handleActivate(request)} 
                          disabled={actionLoading}
                        >
                          <PenLine className="h-4 w-4 text-500" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0" 
                          onClick={() => handleDelete(request.id)} 
                          disabled={actionLoading}
                        >
                          <Trash className="h-4 w-4 text-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-4">
                    No RFID requests
                  </TableCell>
                </TableRow>
              )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-center gap-2 py-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handlePageChange(currentPage - 1)} 
              disabled={currentPage === 0}
            >
              Previous
            </Button>
            {[...Array(totalPages)].map((_, index) => (
              <Button 
                key={index} 
                variant={index === currentPage ? "default" : "outline"} 
                size="sm" 
                onClick={() => handlePageChange(index)}
              >
                {index + 1}
              </Button>
            ))}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handlePageChange(currentPage + 1)} 
              disabled={currentPage + 1 === totalPages}
            >
              Next
            </Button>
          </div>
        </TabsContent>


{/* // single rfid search */}
    <TabsContent value="single">
  <div className="space-y-4">
    <div className="flex gap-2 items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
      <Input
        className="flex-1 h-10 px-3 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder="Search RFID ID or Hex..."
        value={rfidSearchInput}
        onChange={(e) => setRfidSearchInput(e.target.value)}
      />
      <Button 
        onClick={handleRfidSearch}
      >
        Search
      </Button>
    </div>
    {searchedRfid && searchedRfid !=="No Rfid Found"? (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h3 className="font-medium text-gray-800">RFID Details</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          <div className="space-y-1">
            <p className="text-sm text-gray-500">RFID ID</p>
            <p className="font-medium text-gray-900">{searchedRfid[0].rfId}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">RFID Hex</p>
            <p className="font-medium text-gray-900">{searchedRfid[0].rfidHex}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Status</p>
            <div className="flex items-center gap-2">
              <p className={`font-medium ${
                searchedRfid[0].rfidStatus === 'Active' 
                  ? "bg-green-100 text-green-800 border-green-400"
                  : 'bg-red-100 text-red-800 border-red-400'
              }`}>
                {searchedRfid[0].rfidStatus}
              </p>
              {searchedRfid[0].rfidStatus === 'Inactive' ? (
                <Button
                  size="sm"
                  className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700"
                  onClick={() => handleRfidStatusChange(searchedRfid[0].rfId, 'Active')}
                >
                  Activate
                </Button>
              ) : searchedRfid[0].rfidStatus === 'Active' ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-3 text-xs border-gray-300 hover:bg-gray-50"
                  onClick={() => handleRfidStatusChange(searchedRfid[0].rfId, 'inactive')}
                >
                  Deactivate
                </Button>
              ) : null}
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Expiry Date</p>
            <p className="font-medium text-gray-900">{formatDate(searchedRfid[0].expiryDate)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Full Name</p>
            <p className="font-medium text-gray-900">{searchedRfid[0].fullname}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Username</p>
            <p className="font-medium text-gray-900">{searchedRfid[0].username}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium text-gray-900">{searchedRfid[0].email}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Phone</p>
            <p className="font-medium text-gray-900">{searchedRfid[0].phone}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Mobile Number</p>
            <p className="font-medium text-gray-900">{searchedRfid[0].mobileNumber}</p>
          </div>
        </div>
      </div>
    ) : rfidSearchInput && searchedRfid ==="No Rfid Found" ? (
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
        <p className="text-red-500 font-medium">No RFID found matching your search</p>
      </div>
    ) : (
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
        <p className="text-gray-500">
          Enter RFID ID or Hex to search
        </p>
      </div>
    )}
  </div>
</TabsContent>
      </Tabs>
      {selectedRequest && (
        <ActivateRfidDialog
          open={isActivateDialogOpen}
          onOpenChange={(open) => {
            setIsActivateDialogOpen(open);
            if (!open) setSelectedRequest(null);
          }}
          requestData={selectedRequest}
          onSubmit={handleActivateSubmit}
        />
      )}
    </div>
  );
}