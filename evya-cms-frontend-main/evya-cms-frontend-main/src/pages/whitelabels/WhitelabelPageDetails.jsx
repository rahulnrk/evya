import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ReloadIcon } from '@radix-ui/react-icons';
import { validateName, validateMobileNumber, validateCity, validateZipCode, validateEmail, validateUsername } from '@/pages/validations/Validation';
import axios from 'axios';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import BackButton from '@/users/BackButton';
import Loading from '@/users/Loading';
import StatusButton from '@/users/StatusButton';
import AxiosServices from '@/services/AxiosServices';
import { ChevronDown, ChevronUp } from 'lucide-react';

const WhitelabelPageDetails = () => {
  // const { id,orgId,orgName } = useParams();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  console.log(currentUser);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [isSubmitting,setIsSubmitting]=useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [passwordChangeEnabled, setPasswordChangeEnabled] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [editFormErrors, setEditFormErrors] = useState({});
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [userStatus, setUserStatus] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const { id, orgId, orgName } = useParams();
  
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

  const [editFormData, setEditFormData] = useState({
    orgName: '',
    fullname: '',
    username: '',
    email: '',
    mobileNumber: '',
    rolename: 'WhiteLabel',
    password: 'ghfhj',
    confirmPassword: 'ghfhj',
    address: '',
    city: '',
    country: '',
    state: '',
    zipCode: '',
    enabled: false,
  });
  const [data, setData] = useState([]);
  const [franchiseOwners, setFranchiseOwners] = useState([]); 
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(franchiseOwners.length / itemsPerPage);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
// Calculate start and end index
const startIndex = (currentPage - 1) * itemsPerPage;
const endIndex = startIndex + itemsPerPage;

  // Fetch user details
  const fetchUserDetails = async (userId) => {
    try {
      const response=await AxiosServices.getUserDetails(userId);
      return response;
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast({
        title: 'Error',
        description: `Failed to fetch user details: ${error.message}`,
        variant: 'destructive',
      });
      return null;
    }
  };

    const [formData, setFormData] = useState({
        orgName: "",
        fullname: "",
        username: "",
        email: "",
        mobileNumber: "",
        rolename: "FranchiseOwner",
        address: "",
        city: "Hyderabad",
        country: "India",
        state: "Telangana",
        zipCode: "",
        orgId: orgId || ""
      });
      
        useEffect(() => {
        if (!editMode) return;
        const errors = {};
      
        const fullNameError = validateName(editFormData.fullname);
        if (fullNameError) errors.fullname = fullNameError;
      
        const usernameError = validateUsername(editFormData.username);
        if (usernameError) errors.username = usernameError;
      
        const emailError = validateEmail(editFormData.email);
        if (emailError) errors.email = emailError;
      
        const mobileError = validateMobileNumber(editFormData.mobileNumber);
        if (mobileError) errors.mobileNumber = mobileError;
      
        const zipError = validateZipCode(editFormData.zipCode);
        if (zipError) errors.zipCode = zipError;
      
        const cityError = validateCity(editFormData.city);
        if (cityError) errors.city = cityError;
      
        setEditFormErrors(errors);
      }, [editFormData, editMode]);
      
 useEffect(() => {
        const errors = {};      
        const fullNameError = validateName(formData.fullname);
        if (fullNameError) errors.fullname = fullNameError;
      
        const usernameError = validateUsername(formData.username);
        if (usernameError) errors.username = usernameError;
      
        const emailError = validateEmail(formData.email);
        if (emailError) errors.email = emailError;
      
        const mobileError = validateMobileNumber(formData.mobileNumber);
        if (mobileError) errors.mobileNumber = mobileError;
      
        const zipError = validateZipCode(formData.zipCode);
        if (zipError) errors.zipCode = zipError;
      
        const cityError = validateCity(formData.city);
        if (cityError) errors.city = cityError;
      
        setFormErrors(errors);
      }, [formData]);
      
  // Fetch white label list
  const fetchWhiteLabels = async () => {
    try {
      const response = await axios.get('http://localhost:8800/services/userprofile/');
      const responseData = response.data;

      console.log('API Response (whitelabelList):', responseData);

      if (!responseData || !Array.isArray(responseData.whitelabels)) {
        console.error('Expected an array in responseData.whitelabels but received:', responseData);
        toast({
          title: 'Error',
          description: 'Invalid data format received for white label users.',
          variant: 'destructive',
        });
        setData([]);
        return;
      }

      const filteredUsers = responseData.whitelabels.filter(
        (user) => user.org_id === user.wl_org_id
      );
      setData(filteredUsers);
    } catch (error) {
      setData([]);
    }
  };

  // Fetch franchise owners by organization ID
const fetchFranchiseOwners = async (orgId) => {
  try {
    const owners = await AxiosServices.getFranchiseOwnersByOrg(orgId);
    console.log('Franchise Owners:', owners);
    
    if (Array.isArray(owners)) {
      setFranchiseOwners(owners);

       const ownersWithOrg = owners.map(owner => ({
        ...owner,
        whiteLabelOrgName: owner.whiteLabelOrgName || orgName
      }));
      setFranchiseOwners(ownersWithOrg);
    } else {
      console.error('Expected an array of franchise owners but received:', owners);
      toast({
        title: 'Error',
        description: 'Invalid data format received for franchise owners.',
        variant: 'destructive',
      });
      setFranchiseOwners([]);
    }
  } catch (error) {
    setFranchiseOwners([]);
  }
};

useEffect(() => {
    const loadDetails = async () => {
      setLoading(true);
      const details = await fetchUserDetails(id);
      if (details) {
        setCurrentUser(details);
      }
      await fetchWhiteLabels();
      await fetchFranchiseOwners(orgId);
      setLoading(false);
    };
    loadDetails();
  }, [id]);


  useEffect(() => {
  if (currentUser) {
    setUserStatus(currentUser.enabled ? 'ACTIVE' : 'INACTIVE');
  }
}, [currentUser]);

//for copilot
// Add this useEffect to listen for edit events from Copilot
useEffect(() => {
  const handleOpenEditDialog = () => {
    if (currentUser) {
      setEditMode(true);
      // Pre-fill the edit form with current user data
      setEditFormData({
        orgName: orgName || '',
        fullname: currentUser.fullname || '',
        username: currentUser.username || '',
        email: currentUser.email || '',
        mobileNumber: currentUser.mobileNumber || '',
        address: currentUser.address?.[0]?.address || '',
        city: currentUser.address?.[0]?.city || '',
        country: currentUser.address?.[0]?.country || '',
        state: currentUser.address?.[0]?.state || '',
        zipCode: currentUser.address?.[0]?.zipCode || '',
        enabled: currentUser.enabled || false,
        rolename: 'WhiteLabel',
      });
    }
  };

  window.addEventListener('openEditWhitelabelDialog', handleOpenEditDialog);
  
  return () => {
    window.removeEventListener('openEditWhitelabelDialog', handleOpenEditDialog);
  };
}, [currentUser, orgName]);


 const handleAddFranchiseOwner = async (e) => {
  e.preventDefault();
  const errors = {};

  const requiredFields = {
    orgName: 'Organization Name',
    fullname: 'Full Name',
    username: 'Username',
    email: 'Email',
    mobileNumber: 'Mobile Number',
    address: 'Address',
    city: 'City',
    state: 'State',
    zipCode: 'Zip Code'
  };

  Object.entries(requiredFields).forEach(([field, name]) => {
    if (!formData[field]?.trim()) {
      errors[field] = `${name} is required`;
    }
  });

  const fullNameError = validateName(formData.fullname);
  if (fullNameError) errors.fullname = fullNameError;

  const usernameError = validateUsername(formData.username);
  if (usernameError) errors.username = usernameError;

  const emailError = validateEmail(formData.email);
  if (emailError) errors.email = emailError;

  const mobileError = validateMobileNumber(formData.mobileNumber);
  if (mobileError) errors.mobileNumber = mobileError;

  const zipError = validateZipCode(formData.zipCode);
  if (zipError) errors.zipCode = zipError;

  const cityError = validateCity(formData.city);
  if (cityError) errors.city = cityError;

  setFormErrors(errors);

  if (Object.keys(errors).length > 0) {
    toast({
      title: "Validation Error",
      description:  Object.values(errors).filter(Boolean).join(", "),
      variant: "destructive",
    });
    return;
  }

  try {
    setIsSubmitting(true);
    const payload = {
      address: formData.address,
      city: formData.city,
      confirmPassword: 'ghfhj',
      country: formData.country || "India",
      email: formData.email,
      fullname: formData.fullname,
      mobileNumber: formData.mobileNumber,
      orgId: orgId,
      orgName: formData.orgName,
      password: 'ghfhj',
      rolename: "FranchiseOwner",
      state: formData.state,
      username: formData.username,
      zipCode: formData.zipCode
    };

    console.log("Submitting payload:", payload);

    const response = await AxiosServices.addFranchise(payload);
    
    if (response.data.message === "FranchiseOwner Successfully Created") {
      toast({
        title: "Success",
        description: "Franchise owner added successfully!",
      });
      await fetchFranchiseOwners(orgId);
      setIsAddDialogOpen(false);
      resetForm();
    }
  } catch (error) {
    console.log(error);
    let errorMessage = "Failed to add site";
    
    if (error.response?.data.includes('ConstraintViolationException') || 
        error.response?.data.includes('could not execute statement')) {
      errorMessage = "Mobile Number already exists. Please choose a different Number.";
    } else if (error.response?.data) {
      errorMessage = error.response?.data;
    }
    toast({
      title: "Error",
      description: errorMessage || "Failed to add. Please try again.",
      variant: "destructive",
    });
  } finally {
    setIsSubmitting(false);
  }
};

    const resetForm = () => {
      setFormData({
        orgName: "",
        fullname: "",
        username: "",
        email: "",
        mobileNumber: "",
        rolename: "FranchiseOwner",
        address: "",
        city: "Hyderabad",
        country: "India",
        state: "",
        zipCode: "",
        orgId: orgId
      });
    };

    const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));

     if (name === 'password') {
    setEditFormErrors(prev => ({
      ...prev,
      password: validatePassword(value),
      confirmPassword: validateConfirmPassword(value, editFormData.confirmPassword)
    }));
  } else if (name === 'confirmPassword') {
    setEditFormErrors(prev => ({
      ...prev,
      confirmPassword: validateConfirmPassword(editFormData.password, value)
    }));
  }else{
    const validators = {
      fullname: validateName,
      mobileNumber: validateMobileNumber,
      password: validatePassword,
      confirmPassword: () => validateConfirmPassword(editFormData.password, value),
      city: validateCity,
      zipCode: validateZipCode,
      address: (val) => validateRequiredField(val, 'address'),
      country: (val) => validateRequiredField(val, 'country'),
      state: (val) => validateRequiredField(val, 'state'),
    };
  }
  };

  const handleEditUser = () => {
    if (!currentUser) {
      toast({
        title: 'Error',
        description: 'User data is not loaded yet.',
        variant: 'destructive',
      });
      return;
    }
    setEditFormData({
      orgName: orgName || '',
      fullname: currentUser.fullname || '',
      username: currentUser.username || '',
      email: currentUser.email || '',
      mobileNumber: currentUser.mobileNumber || '',
      address: currentUser.address?.[0]?.address || '',
      city: currentUser.address?.[0]?.city || '',
      country: currentUser.address?.[0]?.country || '',
      state: currentUser.address?.[0]?.state || '',
      zipCode: currentUser.address?.[0]?.zipCode || '',
      enabled: currentUser.enabled || false,
      orgName: '',
      rolename: 'WhiteLabel',
    });
    setEditMode(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
 if (Object.keys(editFormErrors).length > 0) {
    toast({
      title: 'Validation Error',
      description: Object.values(editFormErrors).filter(Boolean).join(", "),
      variant: 'destructive',
    });
    return;
  }
    try {
      setIsSubmitting(true);
      const payload = {
        ...editFormData,
        rolename: 'WhiteLabel',
        passwordChange: passwordChangeEnabled,
      };

      const response=await AxiosServices.updateUser(id,payload)
      if (response.status === 200) {
        toast({
          title: 'Success',
          description: 'White label updated successfully!',
        });
        await fetchWhiteLabels();
        setEditMode(false);
        setEditFormData({
          orgName: '',
          fullname: '',
          username: '',
          email: '',
          mobileNumber: '',
          rolename: 'WhiteLabel',
          address: '',
          city: '',
          country: '',
          state: '',
          zipCode: '',
          enabled: false,
        });
        setPasswordChangeEnabled(false);
        const updatedUser = await fetchUserDetails(id);
        setCurrentUser(updatedUser);
        setUserStatus(updatedUser.enabled ? 'ACTIVE' : 'INACTIVE');

      }
    } catch (error) {
      console.error('Error updating white label:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update white label.',
        variant: 'destructive',
      });
    }
     finally {
      setIsSubmitting(false);
    }
  };
const handleUserStatusChange = async (newStatus) => {
  const enabled = newStatus === 'ACTIVE';

  try {
    setStatusLoading(true);
    await AxiosServices.updateUserStatus(id, enabled);
    setUserStatus(newStatus);
    setCurrentUser((prev) => ({
      ...prev,
      enabled,
    }));

    toast({
      title: 'Success',
      description: 'User status updated successfully',
    });
  } catch (error) {
    toast({
      title: 'Error',
      description:
        error?.response?.data?.message || 'Failed to update status',
      variant: 'destructive',
    });
  } finally {
       setStatusLoading(false);  // stop loading
    setStatusDropdownOpen(false);

  }
};

  if (loading) {
    return <div ><Loading/></div>;
  }

  if (!currentUser) {
    return <div className="p-6">User not found</div>;
  }

  if (editMode) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Edit User</h1>
        </div>
        <Card className="p-6">
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-orgName">Organization Name</Label>
                <Input
                  id="edit-orgName"
                  name="orgName"
                  value={orgName}
                  onChange={handleEditInputChange}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-fullname">Full Name</Label>
                <Input
                  id="edit-fullname"
                  name="fullname"
                  value={editFormData.fullname}
                  onChange={handleEditInputChange}
                />
                {editFormErrors.fullname && (  <p className="text-xs text-red-500 mt-1">{editFormErrors.fullname}</p>)}
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
                <Label htmlFor="edit-mobileNumber">Mobile Number</Label>
                <Input
                  id="edit-mobileNumber"
                  name="mobileNumber"
                  value={editFormData.mobileNumber}
                  onChange={handleEditInputChange}
                />
                {editFormErrors.mobileNumber && (  <p className="text-xs text-red-500 mt-1">{editFormErrors.mobileNumber}</p>)}
              </div>        
              <div className="space-y-2">
                <Label htmlFor="edit-address">Address</Label>
                <Input
                  id="edit-address"
                  name="address"
                  value={editFormData.address}
                  onChange={handleEditInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-city">City</Label>
                <Input
                  id="edit-city"
                  name="city"
                  value={editFormData.city}
                  onChange={handleEditInputChange}
                />
                {editFormErrors.city && (  <p className="text-xs text-red-500 mt-1">{editFormErrors.city}</p>)}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-state">State</Label>
                <Input
                  id="edit-state"
                  name="state"
                  value={editFormData.state}
                  onChange={handleEditInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-country">Country</Label>
                <Input
                  id="edit-country"
                  name="country"
                  value={editFormData.country}
                  onChange={handleEditInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-zipCode">Zip Code</Label>
                <Input
                  id="edit-zipCode"
                  name="zipCode"
                  value={editFormData.zipCode}
                  onChange={handleEditInputChange}
                />
                {editFormErrors.zipCode && (  <p className="text-xs text-red-500 mt-1">{editFormErrors.zipCode}</p>)}
              </div>
              {/* <div className="flex items-center space-x-2">
            <Checkbox
                checked={editFormData.enabled}
                onCheckedChange={(checked) => {
                  const enabled = Boolean(checked);

                  setEditFormData((prev) => ({
                    ...prev,
                    enabled,
                  }));
                  setUserStatus(enabled ? 'ACTIVE' : 'INACTIVE');
                }}
              />
              <Label htmlFor="edit-enabled">Enabled</Label>
              </div> */}
            </div>
            <div className="flex justify-end gap-4 pt-4">
            <div className="flex justify-end gap-4 pt-4">
               <Button variant="outline" onClick={() => setEditMode(false)}>
            Cancel
          </Button>
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
  >
    {statusLoading ? (
      <>
      <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
       Updating...
       </>
    ) : (
      normalizeStatus(userStatus)
    )}
    {statusDropdownOpen ? (
      <ChevronUp className="ml-2 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-2 h-4 w-4" />
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
          <TabsTrigger value="account">Owner Organization</TabsTrigger>
          <TabsTrigger value="Notes">Notes</TabsTrigger>
        </TabsList>
        <TabsContent value="details">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div> <h2 className="text-xl font-semibold mb-4">Personal Information</h2></div>
             <Button onClick={handleEditUser} className="flex gap-2  w-24" >Edit</Button>
        </div>
            <Card className="p-6 mb-6">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <p className="font-semibold text-gray-600">Point of Contact</p>
                  <p className="font-medium">{currentUser.fullname || '-'}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-600">Username</p>
                  <p className="font-medium">{currentUser.username || '-'}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-600">Email</p>
                  <p className="font-medium">{currentUser.email || '-'}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-600 mt-4">Mobile Number</p>
                  <p className="font-medium">{currentUser.mobileNumber || '-'}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-600 mt-4">Status</p>
                  <p className="font-medium">
                    {currentUser.enabled ? (
                      <span className="text-green-600">Active</span>
                    ) : (
                      <span className="text-red-600">In Active</span>
                    )}
                  </p>
                </div>
              </div>
            </Card>
            <h2 className="text-xl font-semibold mt-8 mb-4">Address Information</h2>
            {currentUser.address?.length > 0 ? (
              <Card className="p-6 mb-6">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="font-semibold text-gray-600">Address</p>
                    <p className="font-medium">{currentUser.address[0].address || '-'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-600">City</p>
                    <p className="font-medium">{currentUser.address[0].city || '-'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-600">State</p>
                    <p className="font-medium">{currentUser.address[0].state || '-'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-600 mt-4">Country</p>
                    <p className="font-medium">{currentUser.address[0].country || '-'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-600 mt-4">Zip Code</p>
                    <p className="font-medium">{currentUser.address[0].zipCode || '-'}</p>
                  </div>
                </div>
              </Card>
            ) : (
              <p>No address information available</p>
            )}
             <h2 className="text-xl font-semibold mt-8 mb-4">Additional Information</h2>
             <Card className="p-6 mb-6">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="font-semibold text-gray-600">Organistion Id</p>
                    <p className="font-medium">{orgId || '-'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-600">Organistion Name</p>
                    <p className="font-medium">{orgName || '-'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-600">Gst Number</p>
                    <p className="font-medium">-</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-600 mt-4">Role Name</p>
                    <p className="font-medium">
                      {currentUser.usersinroles?.length > 0
                        ? (currentUser.usersinroles[0].role_id === 3
                            ? 'WhiteLabel'
                            : `Role ID: ${currentUser.usersinroles[0].role_id}`)
                        : 'No role assigned'}
                    </p>
                  </div>
                </div>
              </Card>
          </div>
        </TabsContent>
        <TabsContent value="account">
          <div className="bg-white rounded-lg shadow p-6 mt-4">
            <h2 className="text-xl font-semibold mb-5">Franchise Owners
            <Button onClick={() => setIsAddDialogOpen(true)} className='btn btn-secondary float-right'>
              Add Franchise
            </Button>
            </h2>
            <Table className="border">
              <TableHeader>
                <TableRow>
                  {/* <TableHead>ID</TableHead> */}
                  <TableHead>Name</TableHead>
                  <TableHead>Phone No</TableHead>
                  <TableHead>Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {franchiseOwners.length > 0 ? (
                  franchiseOwners.map((owner,index) => (
                    <TableRow onClick={()=>navigate(`/franchiseOwners/${owner.userId}/${owner.orgId}/${owner.orgName}`)} key={index} >
                      <TableCell>{index+1|| '-'}</TableCell>
                      <TableCell>{owner.fullName || '-'}</TableCell>
                      <TableCell>{owner.mobileNumber || '-'}</TableCell>
                      <TableCell>{owner.email || '-'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      No franchise owners found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div> <div className="flex items-center justify-center gap-2 py-4">
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
         <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Franchise Owner</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddFranchiseOwner} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="orgId">White Label Organization *</Label>
                    <Input
                      value={orgName}
                      disabled
                    />                 
                  </div>
                 <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Organization Name *
                    </Label>

                    <Input
                      name="orgName"
                      value={formData.orgName}
                      onChange={handleInputChange}
                      placeholder="Enter Organization Name"
                      className="mt-1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fullname">Full Name *</Label>
                    <Input 
                      id="fullname" 
                      name="fullname" 
                      value={formData.fullname} 
                      onChange={handleInputChange} 
                    />
                    {formErrors.fullname && <p className="text-xs text-red-500 mt-1">{formErrors.fullname}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mobileNumber">Mobile Number *</Label>
                    <Input 
                      id="mobileNumber" 
                      name="mobileNumber" 
                      value={formData.mobileNumber} 
                      onChange={handleInputChange} 
                    />
                    {formErrors.mobileNumber && <p className="text-xs text-red-500 mt-1">{formErrors.mobileNumber}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input 
                      id="email" 
                      name="email" 
                      type="email" 
                      value={formData.email} 
                      onChange={handleInputChange} 
                    />
                    {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username *</Label>
                    <Input 
                      id="username" 
                      name="username" 
                      value={formData.username} 
                      onChange={handleInputChange} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address *</Label>
                    <Input 
                      id="address" 
                      name="address" 
                      value={formData.address} 
                      onChange={handleInputChange} 
                    />
                    {formErrors.address && <p className="text-sm text-red-500">{formErrors.address}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input 
                      id="city" 
                      name="city" 
                      value={formData.city} 
                      onChange={handleInputChange} 
                    />
                    {formErrors.city && <p className="text-xs text-red-500 mt-1">{formErrors.city}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Input 
                      id="state" 
                      name="state" 
                      value={formData.state} 
                      onChange={handleInputChange} 
                    />
                    {formErrors.state && <p className="text-sm text-red-500">{formErrors.state}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country *</Label>
                    <Input 
                      id="country" 
                      name="country" 
                      value={formData.country} 
                      onChange={handleInputChange} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">Zip Code *</Label>
                    <Input 
                      id="zipCode" 
                      name="zipCode" 
                      value={formData.zipCode} 
                      onChange={handleInputChange} 
                    />
                    {formErrors.zipCode && <p className="text-xs text-red-500 mt-1">{formErrors.zipCode}</p>}
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
         <TabsContent value="Notes">
          <div className="bg-white rounded-lg shadow p-6 mt-4">
            Sorry..! notes are empty
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
export default WhitelabelPageDetails;