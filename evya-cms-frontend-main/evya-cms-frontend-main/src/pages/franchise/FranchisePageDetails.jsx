import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from '@/components/ui/card';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
  validateName,
  validateMobileNumber,
  validateCity,
  validateZipCode,
  validateEmail,
  validateOrganizationName,
  validateUsername
} from '@/pages/validations/Validation';
import Loading from '@/users/Loading';
import BackButton from '@/users/BackButton';
import StatusButton from '@/users/StatusButton';
import { ReloadIcon } from '@radix-ui/react-icons';
import AxiosServices from '@/services/AxiosServices';
const FranchisePageDetails = () => {
  const { id, orgId, orgName } = useParams();
  const navigate = useNavigate();
  const [currentOwner, setCurrentOwner] = useState({ userDetails: null, sites: [] });
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;
  const totalPages = Math.ceil( currentOwner.sites.length/ itemsPerPage);

  const startIndex = (currentPage) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const currentSites = currentOwner.sites.slice(startIndex, endIndex);
  const [isSubmitting,setIsSubmitting]=useState(false);
  const [noteText, setNoteText] = useState('');
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [passwordChangeEnabled, setPasswordChangeEnabled] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [userStatus, setUserStatus] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  
  const [editFormData, setEditFormData] = useState({
    orgName: "",
    fullname: "",
    username: "",
    email: "",
    mobileNumber: "",
    rolename: "FranchiseOwner",
    password: "",
    confirmPassword: "",
    address: "",
    city: "",
    country: "",
    state: "",
    zipCode: "",
    enabled: true,
    passwordChange: false
  });
     
useEffect(() => {
      const errors = {};
    
      const fullNameError = validateName(editFormData.fullname);
      if (fullNameError) errors.fullname = fullNameError;
  
      const emailError = validateEmail(editFormData.email);
      if (emailError) errors.email = emailError;
  
      const userNameError = validateName(editFormData.username);
      if (userNameError) errors.username = userNameError;
    
      const mobileError = validateMobileNumber(editFormData.mobileNumber);
      if (mobileError) errors.mobileNumber = mobileError;
  
      const zipError = validateZipCode(editFormData.zipCode);
      if (zipError) errors.zipCode = zipError;
    
      const cityError = validateCity(editFormData.city);
      if (cityError) errors.city = cityError;

      const organizationNameError = validateOrganizationName(editFormData.orgName);
      if(organizationNameError) errors.orgName = organizationNameError;

      const usernameError = validateUsername(editFormData.username);
      if(userNameError) errors.username = usernameError;
    
      setFormErrors(errors);
    }, [editFormData]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
const normalizeStatus = (status) =>
  (status || '').toString().trim().toUpperCase();

const getStatusClasses = (status) => {
  switch (normalizeStatus(status)) {
    case 'ACTIVE':
      return 'bg-green-100 text-green-800 border-green-400';
    case 'INACTIVE':
      return 'bg-red-100 text-red-800 border-red-400';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-400';
  }
};

const handleUserStatusChange = async (newStatus) => {
  const enabled = newStatus === 'ACTIVE';

  try {
    setStatusLoading(true);

    await AxiosServices.updateUserStatus(id, enabled);

    setUserStatus(newStatus);

    setCurrentOwner(prev => ({
      ...prev,
      userDetails: {
        ...prev.userDetails,
        enabled,
      }
    }));

    toast({
      title: 'Success',
      description: 'User status updated successfully',
    });

  } catch (error) {
    toast({
      title: 'Error',
      description: error?.response?.data?.message || 'Failed to update status',
      variant: 'destructive',
    });

  } finally {
    setStatusLoading(false);
    setStatusDropdownOpen(false);
  }
};
useEffect(() => {
  const loadDetails = async () => {
    try {
      setLoading(true);
      const details = await fetchOwnerDetails(id, orgId);
      if (details) {
        setCurrentOwner(details);
        // Set initial status
        setUserStatus(details.userDetails.enabled ? 'ACTIVE' : 'INACTIVE');
      }
      setLoading(false);
    } catch (error) {
      console.error("Failed to load owner details", error);
      setLoading(false);
    }
  };

  loadDetails();
}, [id, orgId]);
  const handleSaveNote = () => {
    toast({
      title: "Note Saved",
      description: "Your note has been saved successfully",
    });
  };

 const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const fetchOwnerDetails = async (userId, orgId) => {
  try {
    const [userDetails, sites] = await Promise.all([
      AxiosServices.getUserDetails(userId),
      AxiosServices.getSitesByOrg(orgId)
    ]);

    console.log("User details from API:", userDetails);
    console.log("Enabled value:", userDetails.enabled);
    console.log("Enabled type:", typeof userDetails.enabled);
    
    return {
      userDetails,
      sites
    };
  } catch (error) {
    console.error('Error fetching owner details:', error);
    toast({
      title: "Error",
      description: error.message || "Failed to fetch owner details.",
      variant: "destructive",
    });
    return null;
  }
};

const handleUpdateOwner = async (e) => {
  e.preventDefault();
    
  if (Object.keys(formErrors).length > 0) {
    toast({
      title: "Validation Error",
      description: "Please fix all validation errors before submitting.",
      variant: "destructive",
    });
    return;
  }
  
  console.log("Submitting update data:", editFormData);
  
  try {
    setIsSubmitting(true);
    
    // Create payload WITHOUT the enabled field
    const { enabled, ...restPayload } = editFormData;
    const payload = {
      ...restPayload,
      rolename: "FranchiseOwner",
      passwordChange: passwordChangeEnabled
    };
    
    // Update user details (without status)
    const response = await AxiosServices.updateUser(id, payload);
    
    if (response.status === 200) {
      // If enabled status was changed, call the status update endpoint
      if (enabled !== currentOwner.userDetails?.enabled) {
        await AxiosServices.updateUserStatus(id, enabled);
      }
      
      toast({
        title: "Success",
        description: "Franchise owner updated successfully!",
      });
      
      setUserStatus(enabled ? 'ACTIVE' : 'INACTIVE');
      
      // Refresh user details
      const updatedDetails = await fetchOwnerDetails(id, orgId);
      if (updatedDetails) {
        // Ensure the enabled status is set correctly in the refreshed data
        updatedDetails.userDetails.enabled = enabled;
        setCurrentOwner(updatedDetails);
      }         
      setEditMode(false);
      setPasswordChangeEnabled(false);
    }
  } catch (error) {
    console.error('Error updating franchise owner:', error);
    toast({
      title: "Error",
      description: error.response?.data?.message || "Failed to update franchise owner.",
      variant: "destructive",
    });
  } finally {
    setIsSubmitting(false);
  }
};
  const handleEditClick = () => {
    if (!currentOwner.userDetails) return;
    const address = currentOwner.userDetails.address?.[0] || {};
    const enabled = userStatus === 'ACTIVE';
    setEditFormData({
      orgName: orgName || "",
      fullname: currentOwner.userDetails.fullname || "",
      username: currentOwner.userDetails.username || "",
      email: currentOwner.userDetails.email || "",
      mobileNumber: currentOwner.userDetails.mobileNumber || "",
      rolename: "FranchiseOwner",
      address: address.address || "",
      city: address.city || "",
      country: address.country || "",
      state: address.state || "",
      zipCode: address.zipCode || "",
      enabled: currentOwner.userDetails.enabled,
      password: "",
      confirmPassword: "",
      passwordChange: false
    });    
    setEditMode(true);
  };

  
useEffect(() => {
  console.log("editFormData.enabled changed:", editFormData.enabled);
}, [editFormData.enabled]);


useEffect(() => {
  if (currentOwner.userDetails) {
    const status = currentOwner.userDetails.enabled ? 'ACTIVE' : 'INACTIVE';
    setUserStatus(status);
  }
}, [currentOwner.userDetails]);

  if (loading) {
    return <div><Loading/></div>;
  }

  if (!currentOwner.userDetails) {
    return <div className="p-6">Franchise owner not found</div>;
  }

  if (editMode) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Edit Franchise Owner</h1>
        </div>        
        <Card className="p-6">
           <form onSubmit={handleUpdateOwner} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-orgName">Organization Name</Label>
                <Input 
                  id="edit-orgName" 
                  name="orgName" 
                  value={editFormData.orgName} 
                  onChange={handleEditInputChange} 
                  disabled 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-fullname">Full Name *</Label>
                <Input 
                  id="edit-fullname" 
                  name="fullname" 
                  value={editFormData.fullname} 
                  onChange={handleEditInputChange} 
                  required
                />
                {formErrors.fullname && <p className="text-sm text-red-500">{formErrors.fullname}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-username">Username</Label>
                <Input 
                  id="edit-username" 
                  name="username" 
                  value={editFormData.username} 
                  onChange={handleEditInputChange} 
                  disabled 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input 
                  id="edit-email" 
                  name="email" 
                  type="email" 
                  value={editFormData.email} 
                  onChange={handleEditInputChange} 
                  disabled 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-mobileNumber">Mobile Number *</Label>
                <Input 
                  id="edit-mobileNumber" 
                  name="mobileNumber" 
                  value={editFormData.mobileNumber} 
                  onChange={handleEditInputChange} 
                  required
                />
                {formErrors.mobileNumber && <p className="text-sm text-red-500">{formErrors.mobileNumber}</p>}
              </div>              
              <div className="space-y-2">
                <Label htmlFor="edit-address">Address *</Label>
                <Input 
                  id="edit-address" 
                  name="address" 
                  value={editFormData.address} 
                  onChange={handleEditInputChange} 
                  required
                />
                {formErrors.address && <p className="text-sm text-red-500">{formErrors.address}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-city">City *</Label>
                <Input 
                  id="edit-city" 
                  name="city" 
                  value={editFormData.city} 
                  onChange={handleEditInputChange} 
                  required
                />
                {formErrors.city && <p className="text-sm text-red-500">{formErrors.city}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-state">State *</Label>
                <Input 
                  id="edit-state" 
                  name="state" 
                  value={editFormData.state} 
                  onChange={handleEditInputChange} 
                  required
                />
                {formErrors.state && <p className="text-sm text-red-500">{formErrors.state}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-country">Country *</Label>
                <Input 
                  id="edit-country" 
                  name="country" 
                  value={editFormData.country} 
                  onChange={handleEditInputChange} 
                  required
                />
                {formErrors.country && <p className="text-sm text-red-500">{formErrors.country}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-zipCode">Zip Code *</Label>
                <Input 
                  id="edit-zipCode" 
                  name="zipCode" 
                  value={editFormData.zipCode} 
                  onChange={handleEditInputChange} 
                  required
                />
                {formErrors.zipCode && <p className="text-sm text-red-500">{formErrors.zipCode}</p>}
              </div>
           <div className="flex items-center space-x-2">
              <Checkbox 
                id="edit-enabled" 
                checked={editFormData.enabled === true}
                onCheckedChange={(checked) => {
                  setEditFormData(prev => ({
                    ...prev,
                    enabled: checked === true
                  }));
                }}
              />  
              <Label htmlFor="edit-enabled">Enabled</Label>
            </div>
            </div>
            <div className="flex justify-end gap-4 pt-4">
            <div className="flex justify-end gap-4 pt-4">
              <Button variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update"
                )}
              </Button>
            </div>
            </div>
          </form>
        </Card>
      </div>
    );
  }
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
         <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
        <div><h1 className="text-2xl font-bold">{orgName}</h1></div>
<div className="relative">
 <button
  className={`flex items-center px-4 py-1.5 border rounded-full transition 
    ${getStatusClasses(userStatus)}`}
  onClick={() => setStatusDropdownOpen(prev => !prev)}
  disabled={statusLoading}
>
  {statusLoading ? (
    <>
      <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
      Updating...
    </>
  ) : (
    <>
      {normalizeStatus(userStatus)}
      {statusDropdownOpen ? (
        <ChevronUp className="ml-2 h-4 w-4" />
      ) : (
        <ChevronDown className="ml-2 h-4 w-4" />
      )}
    </>
  )}
</button>

  {statusDropdownOpen && (
    <div className="absolute mt-2 w-44 bg-white shadow-lg rounded-md z-20 p-3">
      <p className="font-medium text-sm mb-2 text-gray-700">
        Select Status
      </p>
      {['ACTIVE', 'INACTIVE'].map((option) => (
        <button
          key={option}
          disabled={statusLoading}
          onClick={() => handleUserStatusChange(option)}
          className={`w-full text-left px-4 py-1.5 mb-1 rounded-full border transition ${
            option === 'ACTIVE'
              ? 'bg-green-100 text-green-800 border-green-400'
              : 'bg-red-100 text-red-800 border-red-400'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  )}
</div>  
      </div>
      </div>
        <div className="flex gap-2">
          <BackButton />
        </div>
      </div>
      
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Basic Details</TabsTrigger>
          <TabsTrigger value="sites">Sites</TabsTrigger>
           <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

       <TabsContent value="details">
          <div>
            <div>
              <div className="flex justify-between items-center mb-6">
                <div><h2 className="text-xl font-semibold mb-4 mt-4">Personal Information</h2></div>
                <Button onClick={handleEditClick} className="flex gap-2 w-24">Edit</Button>
              </div>
              <Card className="p-6 mb-6">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div>
                    <p className="font-semibold text-gray-600">Full Name</p>
                    <p className="font-medium">{currentOwner.userDetails.fullname || '-'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-600">Username</p>
                    <p className="font-medium">{currentOwner.userDetails.username || '-'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-600">Email</p>
                    <p className="font-medium">{currentOwner.userDetails.email || '-'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-600 mt-4">Mobile Number</p>
                    <p className="font-medium">{currentOwner.userDetails.mobileNumber || '-'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-600 mt-4">Status</p>
                    <p className="font-medium">
                      {currentOwner.userDetails.enabled ? (
                        <span className="text-green-600">Active</span>
                      ) : (
                        <span className="text-red-600">Inactive</span>
                      )}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">Address Information</h2>
            {currentOwner.userDetails.address && currentOwner.userDetails.address.length > 0 ? (
              <Card className="p-6 mb-6">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="font-semibold text-gray-600">Address</p>
                    <p className="font-medium">{currentOwner.userDetails.address[0].address || '-'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-600">City</p>
                    <p className="font-medium">{currentOwner.userDetails.address[0].city || '-'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-600">State</p>
                    <p className="font-medium">{currentOwner.userDetails.address[0].state || '-'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-600 mt-4">Country</p>
                    <p className="font-medium">{currentOwner.userDetails.address[0].country || '-'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-600 mt-4">Zip Code</p>
                    <p className="font-medium">{currentOwner.userDetails.address[0].zipCode || '-'}</p>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-6">
                <p>No address information available</p>
              </Card>
            )}
            <h2 className="text-xl font-semibold mt-8 mb-4">Additional Information</h2>
            <Card className="p-6 mb-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="font-semibold text-gray-600"> WhiteLabel Organisation Id</p>
                  <p className="font-medium">{ '-'}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-600">WhiteLabel Organisation Name</p>
                  <p className="font-medium">{ '-'}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-600">Organisation Id</p>
                  <p className="font-medium">{orgId || '-'}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-600">Organisation Name</p>
                  <p className="font-medium">{orgName || '-'}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-600">Gst Number</p>
                  <p className="font-medium">-</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-600 mt-4">Role Name</p>
                  <p className="font-medium">
                    {currentOwner.usersinroles?.length > 0 ? (currentOwner.usersinroles[0].role_id === 4
                    ? 'Franchise Owner'
                    : `Role ID: ${currentOwner.usersinroles[0].role_id}`)
                    : 'No role assigned'}
                  </p>
                </div>
                </div>
              </Card>
          </div>
        </TabsContent>
        <TabsContent value="notes">
          <div className="bg-white rounded-lg shadow p-6 mt-4">
            <h2 className="text-xl font-semibold mb-4">Notes</h2>
            <div className="space-y-4">
              <div>
                <Label className="font-semibold text-gray-600 mb-2">Write your note</Label>
                <textarea
                  className="w-full p-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                  rows={4}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Enter your notes here..."
                />
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleSaveNote}
                >
                  Save Note
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="sites">
          <div className="bg-white rounded-lg shadow p-6 mt-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Managed Sites</h2>
              <Button onClick={() => navigate('/add-site', {
                state: {
                  from: 'franchise', orgId, orgName, franchiseId: id}})}> Add New Site
              </Button>
            </div>
            {currentOwner.sites.length > 0 ? (
              <div>
                <Table className="border">
                  <TableHeader>
                    <TableRow>
                      {/* <TableHead>Site Id</TableHead> */}
                      <TableHead>Site Name</TableHead>
                      <TableHead>Manager Name</TableHead>
                      <TableHead>Manager Phone</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentSites.map(site => (
                      <TableRow key={site.id} onClick={()=>navigate(`/site/${site.id}`)}>
                        {/* <TableCell>{site.id}</TableCell> */}
                        <TableCell>{site.siteName}</TableCell>
                        <TableCell>{site.managerName || '-'}</TableCell>
                        <TableCell>{site.managerPhone || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
              </div>
            ) : (
              <Card className="p-6">
                <p>No sites assigned to this franchise owner</p>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
export default FranchisePageDetails;
