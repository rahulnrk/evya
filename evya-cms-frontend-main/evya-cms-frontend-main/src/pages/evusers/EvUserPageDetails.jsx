import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from '@/components/ui/card';
import { useDispatch, useSelector } from "react-redux";
import { Input } from "@/components/ui/input";
import { fetchWalletDetails, fetchWalletTransaction, fetchEVBrand } from "@/store/reducers/evuser/evuserSlice";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { PencilIcon,Trash } from 'lucide-react';
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
  validateConnectorType,
  validateMake,
  validateModel,
  validateVIN,
  validateUsername,
  validateRegistrationNo,
  validateForm as validateFormHelper,
  validateEditForm as validateEditFormHelper } from '@/pages/validations/Validation';
import Loading from '@/users/Loading';
import BackButton from '@/users/BackButton';
import StatusButton from '@/users/StatusButton';
import { ReloadIcon } from '@radix-ui/react-icons';
import DeleteOtp from '@/users/DeleteOtp';
import AxiosServices, { getVehicles } from '@/services/AxiosServices';
const MAX_RFID_REQUESTS = 5;

const EvUserPageDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [loadingRfid, setLoadingRfid] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [rfidRequests, setRfidRequests] = useState([]);
  const [isRfidDialogOpen, setIsRfidDialogOpen] = useState(false);
  const [useDefaultAddress, setUseDefaultAddress] = useState(true);
  const [isSubmitting,setIsSubmitting]=useState(false);
  const [vehicleList, setVehicleList] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [isEditVehicleDialogOpen,setIsEditVehicleDialogOpen]=useState(false);
  const [isAddVehicleDialogOpen,setIsAddVehicleDialogOpen]=useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [vechileId,setVechileId]= useState(null);
  console.log(currentUser);
  const { user } = useSelector(state => state.authentication);
  console.log("user",user.orgId);
  const [editFormErrors, setEditFormErrors] = useState({});
  const [vehicleFormErrors, setVehicleFormErrors] = useState({});
  const [rfidFormErrors, setRfidFormErrors] = useState({})
  const {walletDetails, walletStatus, walletHistory, walletError} = useSelector((state) => state.evuser);

 const [currentPage, setCurrentPage] = useState(1);
 const recordsPerPage = 10;
 const indexOfLastRecord = currentPage * recordsPerPage;
 const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
 const currentRecords = walletHistory.slice(indexOfFirstRecord, indexOfLastRecord);
 const totalPages = Math.ceil(walletHistory.length / recordsPerPage);
 const [activeTab, setActiveTab] = useState("details"); 
 const [loadedTabs, setLoadedTabs] = useState(new Set(["details"])); 

 //added for refresh the rfid tables
 const [rfidRefreshTrigger, setRfidRefreshTrigger] = useState(0);


 const approvedRfidCount = Array.isArray(rfidRequests)
  ? rfidRequests.filter(item => item?.rfId).length
  : 0;

const getPageNumbers = () => {
  const maxVisible = 5; 

  let start = Math.max(currentPage - Math.floor(maxVisible / 2), 1);
  let end = start + maxVisible - 1;

  if (end > totalPages) {
    end = totalPages;
    start = Math.max(end - maxVisible + 1, 1);
  }

  let pages = [];
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
};

  const [editFormData, setEditFormData] = useState({
    fullname: "",
    username: "",
    email: "",
    mobileNumber: "",
    rolename: "Driver",
    address: "",
    city: "",
    country: "",
    state: "",
    zipCode: "",
    connectorType:"",
    model:"",
    vin:"",
    registrationNo:"",
    make:"",
  });

  useEffect(() => {
    if (activeTab === "wallet" && id && !loadedTabs.has("wallet")) {
      dispatch(fetchWalletDetails(id));
      setLoadedTabs(prev => new Set([...prev, "wallet"]));
    }
  }, [activeTab, id, dispatch, loadedTabs]);

 useEffect(() => {
    if (activeTab === "transactions" && walletDetails?.id && !loadedTabs.has("transactions")) {
      dispatch(fetchWalletTransaction(walletDetails.id));
      setLoadedTabs(prev => new Set([...prev, "transactions"]));
    }
  }, [activeTab, walletDetails, dispatch, loadedTabs]);

  //rfid refresh tables
useEffect(() => {
  if (id && activeTab === "rfid") {
    fetchRfidRequests(id);
  }
}, [id, rfidRefreshTrigger, activeTab]);


  useEffect(() => {
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

  const connectorTypeError = validateConnectorType(editFormData.connectorType);
  if (connectorTypeError) errors.connectorType = connectorTypeError;

  const makeError = validateMake(editFormData.make);
  if (makeError) errors.make = makeError;

  const modelError = validateModel(editFormData.model);
  if (modelError) errors.model = modelError;

  const registrationNoError = validateRegistrationNo(editFormData.registrationNo);
  if (registrationNoError) errors.registrationNo = registrationNoError;

  setEditFormErrors(errors);
}, [editFormData]);

 const [vehicleFormData, setVehicleFormData] = useState({
  connectorType: "",
  description: "",
  vin: "",
  registrationNo: "",
  model: "",
  year: "",
  make: "",
  variant: "" 
});

const { evBrands, evBrandStatus } = useSelector(state => state.evuser);

const selectedBrand = evBrands.find(
  brand => brand.brandName === vehicleFormData.make
);

const availableModels = selectedBrand?.models || [];

const selectedModel = availableModels.find(
  m => m.model === vehicleFormData.model
);
const availableVariants = selectedModel?.variants || [];

  useEffect(() => {
  if (evBrandStatus === "idle") {
    dispatch(fetchEVBrand());
  }
}, [dispatch, evBrandStatus]);

  useEffect(() => {
  const errors = {};
  const connectorTypeError = validateConnectorType(vehicleFormData.connectorType);
  if (connectorTypeError) errors.connectorType = connectorTypeError;

  const makeError = validateMake(vehicleFormData.make);
  if (makeError) errors.make = makeError;

  const modelError = validateModel(vehicleFormData.model);
  if (modelError) errors.model = modelError;

  const registrationNoError = validateRegistrationNo(vehicleFormData.registrationNo);
  if (registrationNoError) errors.registrationNo = registrationNoError;

  setVehicleFormErrors(errors);
}, [vehicleFormData]);

 const [addressParts, setAddressParts] = useState({
  street: "",
  city: "",
  state: '',
  country: currentUser?.country||'',
  zipCode: currentUser?.zipCode,
});

const [newRfid, setNewRfid] = useState({
  firstName: '',
  username: '',
  email: '',
  mobile: '',
  status: 'Pending',
  rfidCount: 1,
  userId: id,
  address: '',
  orgId:user.orgId,
  requestedBy: 'Admin',
});

  const handleRfidInputChange = (e) => {
    const { name, value } = e.target;
    setNewRfid(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const totalRequestedCards = Array.isArray(rfidRequests)
  ? rfidRequests.reduce((sum, item) => {
      if (item.rfId) return sum + 1; // issued RFID
      if (item.status === "PENDING") return sum + (item.rfidCount || 0); // requested
      return sum;
    }, 0)
  : 0;

const remainingCards = MAX_RFID_REQUESTS - totalRequestedCards;

const handleRequestRfid = async () => {
  try {
    setIsSubmitting(true);

    const requestedCount = Number(newRfid.rfidCount);

    const totalRequestedCards = rfidRequests.reduce((sum, item) => {
      if (item.rfId) return sum + 1;
      if (item.status === "PENDING") return sum + (item.rfidCount || 0);
      return sum;
    }, 0);

    const remainingCards = MAX_RFID_REQUESTS - totalRequestedCards;

    if (requestedCount > remainingCards) {
      toast({
        title: "Limit Exceeded",
        description: `User can request only ${remainingCards} more RFID cards.`,
        variant: "destructive",
      });
      return;
    }

    const response = await AxiosServices.requestRfid(newRfid, id);
    console.log(response);
    console.log("newRfid", newRfid);
    toast({
      title: "Success",
      description: "RFID request submitted successfully!",
    });
    
    setIsRfidDialogOpen(false);
    
    // Trigger refresh instead of direct fetch
    setRfidRefreshTrigger(prev => prev + 1);
    
    setNewRfid({
      address: addressParts.street,
      city: addressParts.city,
      state: addressParts.state,
      country: addressParts.country,
      zipCode: addressParts.zipCode,
      requestedBy: "Admin",
      firstName: currentUser?.fullname,
      username: currentUser.username,
      email: currentUser?.email,
      mobile: currentUser?.mobileNumber,
      status: 'Pending',
      rfidCount: 1,
      userId: id,
      orgId: user.orgId,
    });
     if (currentUser?.address?.[0]) {
      setAddressParts({
        street: currentUser.address[0].address || '',
        city: currentUser.address[0].city || '',
        state: currentUser.address[0].state || '',
        country: currentUser.address[0].country || '',
        zipCode: currentUser.address[0].zipCode || '',
      });
    }    
    setUseDefaultAddress(true);

  } catch (error) {
    toast({
      title: "Error",
      description: error.response?.data || "Failed to submit RFID request",
      variant: "destructive",
    });
  } finally {
    setIsSubmitting(false);
  }
};
const handleRfidStatusChange = async (rfidId, newStatus) => {
  try {
    await AxiosServices.updateRfidStatus(rfidId);

    toast({
      title: "Success",
      description: `RFID status updated to ${newStatus}`,
    });

    // Trigger refresh instead of direct fetch
    setRfidRefreshTrigger(prev => prev + 1);
  } catch (error) {
    console.error('Error updating RFID status:', error);
    toast({
      title: "Error",
      description: error.message || "Failed to update RFID status",
      variant: "destructive",
    });
  }
};

const handleDelete = async (id) => {
  try {
    const response = await AxiosServices.deleteRfid(id);
    console.log(response);
    if (response.status === 200 || response.status === 204) {
      toast({
        title: "Success",
        description: "RFID request deleted successfully!",
      });

      // Trigger refresh instead of direct fetch
      setRfidRefreshTrigger(prev => prev + 1);
    } else {
      toast({
        title: "Error",
        description: `Failed to delete RFID. Server responded with status: ${response.status}`,
        variant: "destructive",
      });
    }
  } catch (error) {
    console.error('Error deleting RFID:', error);
    toast({
      title: "Error",
      description: error.response?.data?.message || "Something went wrong while deleting the RFID request.",
      variant: "destructive",
    });
  }
};
 const fetchVehicles = async (id) => {
    if (!id || loadedTabs.has("vehicles")) return;
    
    try {
      setLoadingVehicles(true);
      const response = await getVehicles(id);
      console.log("Vehicle Data from Backend:", response);
      setVehicleList(response?.data || []);
      setLoadedTabs(prev => new Set([...prev, "vehicles"])); 
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      if (activeTab === "vehicles") {
        toast({
          title: "Error",
          description: "Failed to load vehicles",
          variant: "destructive",
        });
      }
    } finally {
      setLoadingVehicles(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchVehicles(id);
    }
  }, [id]);

  const fetchUserDetails = async (userId) => {
    try {
      const userResponse = await AxiosServices.getUserDetails(userId);
      return userResponse;
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast({
        title: "Error",
        description: `Failed to fetch user details: ${error.message}`,
        variant: "destructive",
      });
      return null;
    }
  };

const handleInfoClick = (vehicle) => {
  if (!vehicle.id) {
    toast({
      title: "Error",
      description: "Cannot edit vehicle: No ID found",
      variant: "destructive",
    });
    return;
  }
  
  setVehicleFormData({
    connectorType: vehicle.connectorType || "",
    description: vehicle.description || "",
    vin: vehicle.vin || "",
    registrationNo: vehicle.registrationNo || "",
    model: vehicle.model || "",
    year: vehicle.year || "",
    make: vehicle.make || "",
    variant: vehicle.variant || ""
  });
  
  setVechileId(vehicle.id); 
  setIsEditVehicleDialogOpen(true);
};

 const fetchRfidRequests = async (userId) => {
  if (!userId) return;
  
  try {
        setLoadingRfid(true);
    const response = await AxiosServices.getRfidRequests(userId);
    if (response && response.data) {
      setRfidRequests(response.data);
      if (!loadedTabs.has("rfid")) {
        setLoadedTabs(prev => new Set([...prev, "rfid"]));
      }
    } else {
      setRfidRequests([]);
    }
  } catch (error) {
    console.error('Error fetching RFID requests:', error);
    if (activeTab === "rfid") {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch RFID requests",
        variant: "destructive",
      });
    }
    setRfidRequests([]);
  }finally {
    setLoadingRfid(false);
  }
};
  const handleTabChange = (value) => {
    setActiveTab(value);
    
    // Load data when tab is activated
    switch (value) {
      case "vehicles":
        fetchVehicles(id);
        break;
      case "rfid":
        fetchRfidRequests(id);
        break;
      case "wallet":
        // Wallet is handled by useEffect above
        break;
      case "transactions":
        // Transactions is handled by useEffect above  
        break;
      default:
        break;
    }
  };
  useEffect(() => {
    const loadDetails = async () => {      
      try {
        setLoading(true);
        const details = await fetchUserDetails(id);
        if (details) {
          setCurrentUser(details);
          setNewRfid((prev) => ({
            ...prev,
            username: details.username || '',
            email: details.email || '',
            mobile: details.mobileNumber || '',
            userId: id,
          }));

          setAddressParts({
            street: details.address?.[0]?.address || '',
            city: details.address?.[0]?.city || '',
            state: details.address?.[0]?.state || '',
            country: details.address?.[0]?.country || '',
            zipCode: details.address?.[0]?.zipCode || '',
          });
        }
        setLoading(false);
      } catch (error) {
        console.error("Failed to load user details", error);
        toast({
          title: "Error",
          description: "Could not fetch user details.",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    if (id) {
      loadDetails();
    }
  }, [id]);

const handleEditInputChange = (e) => {
  const { name, value } = e.target;
  setEditFormData(prev => ({
    ...prev,
    [name]: value
  }));
};

  useEffect(() => {
  const fullAddress = `${addressParts.street}`;
  setNewRfid((prev) => ({
    ...prev,
    address: fullAddress,
    city: addressParts.city,
  }));
}, [addressParts]);

//for copilot
// Add Vehicle dialog
useEffect(() => {
    const handleOpenVehicle = () => setIsAddVehicleDialogOpen(true);
    window.addEventListener('openAddVehicleDialog', handleOpenVehicle);
    return () => window.removeEventListener('openAddVehicleDialog', handleOpenVehicle);
}, []);

// Request RFID dialog
useEffect(() => {
    const handleOpenRfid = () => setIsRfidDialogOpen(true);
    window.addEventListener('openRequestRfidDialog', handleOpenRfid);
    return () => window.removeEventListener('openRequestRfidDialog', handleOpenRfid);
}, []);

// Tab switching
useEffect(() => {
    const handleSwitchTab = (e) => {
        const { tab } = e.detail;
        if (tab === 'wallet') setActiveTab('wallet');
        if (tab === 'transactions') setActiveTab('transactions');
    };
    window.addEventListener('switchTab', handleSwitchTab);
    return () => window.removeEventListener('switchTab', handleSwitchTab);
}, []);


//for copilot
useEffect(() => {
    const handleSwitchTab = (e) => {
        const { tab } = e.detail;
        if (tab === 'wallet') setActiveTab('wallet');
        if (tab === 'transactions') setActiveTab('transactions');
        if (tab === 'vehicles') setActiveTab('vehicles');  // add this line
    };
    window.addEventListener('switchTab', handleSwitchTab);
    return () => window.removeEventListener('switchTab', handleSwitchTab);
}, []);


const handleAddressPartsChange = (e) => {
  const { name, value } = e.target;
  setAddressParts((prev) => ({
    ...prev,
    [name]: value,
  }));
};


  const handleEditUser = () => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "User data is not loaded yet.",
        variant: "destructive",
      });
      return;
    }

    setEditFormData({
      fullname: currentUser.fullname,
      username: currentUser.username,
      email: currentUser.email,
      mobileNumber: currentUser.mobileNumber,
      address: currentUser.address && currentUser.address.length > 0 ? currentUser.address[0].address : "",
      city: currentUser.address && currentUser.address.length > 0 ? currentUser.address[0].city : "",
      country: currentUser.address && currentUser.address.length > 0 ? currentUser.address[0].country : "",
      state: currentUser.address && currentUser.address.length > 0 ? currentUser.address[0].state : "",
      zipCode: currentUser.address && currentUser.address.length > 0 ? currentUser.address[0].zipCode : "",
    });

    setEditMode(true);
  };

 const handleVehicleInputChange = (e) => {
  const { name, value } = e.target;
  setVehicleFormData(prev => ({
    ...prev,
    [name]: value
  }));
};
const handleAddVehicle = async (e) => {
  e.preventDefault();

  const newErrors = {
    connectorType: validateConnectorType(vehicleFormData.connectorType),
    model: validateModel(vehicleFormData.model),
    registrationNo: validateRegistrationNo(vehicleFormData.registrationNo),
    make: validateMake(vehicleFormData.make),
    year: vehicleFormData.year ? "" : "Year is required" // Basic required check for year
  };

  setVehicleFormErrors(newErrors);
    const hasErrors = Object.values(newErrors).some(error => error !== "");
    console.log("🚨 Vehicle Validation Errors:", newErrors);


  if (hasErrors) {
    toast({
      title: "Validation Error",
      description: "Please fix the errors in the form",
      variant: "destructive",
    });
    return;
  }

  try {
    setIsSubmitting(true);    
    const response = await AxiosServices.addVehicle({
      ...vehicleFormData,
      userId: id
    });

    if (response.status === 201 || response.status === 200) {
      toast({
        title: "Success",
        description: "Vehicle added successfully!",
      });
      setIsAddVehicleDialogOpen(false);
      fetchVehicles(id);
      
      setVehicleFormData({
        connectorType: "",
        description: "",
        vin: "",
        registrationNo: "",
        model: "",
        year: "",
        make: "",
        variant: ""
      });
    }
  } catch (error) {
    console.error('Error adding vehicle:', error);
    toast({
      title: "Error",
      description: error.message || "Failed to add vehicle. Please try again.",
      variant: "destructive",
    });
  } finally {
    setIsSubmitting(false);
  }
};
const handleUpdateVehicle = async (e) => {
  e.preventDefault();

  if (!vechileId) {
    console.error("❌ CRITICAL: Vehicle ID is null/undefined!");
    toast({
      title: "Error",
      description: "Vehicle ID is missing. Cannot update vehicle.",
      variant: "destructive",
    });
    return;
  }

  // Validation
  const newErrors = {
    connectorType: validateConnectorType(vehicleFormData.connectorType),
    model: validateModel(vehicleFormData.model),
    registrationNo: validateRegistrationNo(vehicleFormData.registrationNo),
    make: validateMake(vehicleFormData.make),
    year: vehicleFormData.year ? "" : "Year is required"
  };

  setVehicleFormErrors(newErrors);

  const hasErrors = Object.values(newErrors).some(error => error !== "");
  if (hasErrors) {
    toast({
      title: "Validation Error",
      description: "Please fix the errors in the form",
      variant: "destructive",
    });
    return;
  }

  try {
    setIsSubmitting(true);
    
    const updateData = {
      vin: vehicleFormData.vin || "",
      year: vehicleFormData.year || "",
      make: vehicleFormData.make || "",
      model: vehicleFormData.model || "",
       variant: vehicleFormData.variant || "",
      description: vehicleFormData.description || "",
      connectorType: vehicleFormData.connectorType || "",
      registrationNo: vehicleFormData.registrationNo || ""
    };
    const response = await AxiosServices.updateVehicle(vechileId, updateData);
    
    if (response.data.success) {
      toast({
        title: "Success",
        description: response.data.message || "Vehicle updated successfully",
      });
      
      setIsEditVehicleDialogOpen(false);
      fetchVehicles(id);
      
      setVehicleFormData({
        connectorType: "",
        description: "",
        vin: "",
        registrationNo: "",
        model: "",
        year: "",
        make: "",
        variant: ""
      });
      setVechileId(null);
    } else {
      console.warn("⚠️ API returned success:false");
      throw new Error(response.data.message || 'Update failed');
    }
  } catch (error) {    
    let errorMessage = 'Vehicle update failed';
    
    if (error.response) {
      console.error("HTTP Status:", error.response.status);
      console.error("Response headers:", error.response.headers);
      console.error("Response data:", error.response.data);
      
      if (error.response.status === 404) {
        errorMessage = `Vehicle not found (ID: ${vechileId}). Please check if the vehicle exists.`;
      } else if (error.response.status === 500) {
        errorMessage = error.response.data?.message || 'Server error occurred';
      } else if (error.response.data?.message) {
        errorMessage = error.response.data.message;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive"
    });
  } finally {
    setIsSubmitting(false);
    console.log("🔍 === VEHICLE UPDATE DEBUG END ===");
  }
};

const handleVehicleInputBlur = (e) => {
  const { name, value } = e.target;
  setVehicleFormErrors(prev => ({
    ...prev,
    [name]: error
  }));
};
const handleUpdateUser = async (e) => {
  e.preventDefault();
  
  // Validate form data
  const newErrors = {
    fullname: validateName(editFormData.fullname),
    mobileNumber: validateMobileNumber(editFormData.mobileNumber),
    city: validateCity(editFormData.city),
    zipCode: validateZipCode(editFormData.zipCode)
  };

  setEditFormErrors(newErrors);

  console.log(newErrors)
  // Check if any errors exist
 const hasErrors = Object.values(newErrors).some(Boolean);

if (hasErrors) {
  toast({
    title: "Validation Error",
    description: "Please fix the errors in the form",
    variant: "destructive",
  });
  return; 
}
  try {
    setIsSubmitting(true);
    
       const updateData = {
      fullname: editFormData.fullname,
      mobileNumber: editFormData.mobileNumber,
      address: editFormData.address, 
      city: editFormData.city,       
      country: editFormData.country, 
      state: editFormData.state,     
      zipCode: editFormData.zipCode, 
      passwordchange: false 
    };

    const response = await AxiosServices.updateUser(id, updateData);
    console.log("Update response:", response);

    toast({
      title: "Success",
      description: "User updated successfully",
    });

    // Refresh user data
    const details = await fetchUserDetails(id);
    if (details) {
      setCurrentUser(details);
      setNewRfid(prev => ({
        ...prev,
        email: details.email,
        mobile: details.mobileNumber,
        address: details.address && details.address.length > 0 ? 
          `${details.address[0].address}, ${details.address[0].city}, ${details.address[0].state}, ${details.address[0].country} - ${details.address[0].zipCode}` : 
          ''
      }));
    }

    setEditMode(false);
  } catch (error) {
    console.error("Full error details:", error);
    console.error("Response data:", error.response?.data);
    
    toast({
      title: "Error",
      description: error.response?.data?.message || 
                 "Failed to update user. Please check the data and try again.",
      variant: "destructive",
    });
  } finally {
    setIsSubmitting(false);
  }
};


  if (loading) {
    return <div className="p-6"><Loading/></div>;
  }

  if (!currentUser) {
    return <div className="p-6">User not found</div>;
  }

  if (editMode) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Edit EV User</h1>
        </div>

        <Card className="p-6">
          <form onSubmit={handleUpdateUser} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
                    disabled
                  />
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
              </div>
            <div className="flex justify-end gap-4 pt-4">
              <Button variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting?(
                  <>
                  <ReloadIcon className='mr-2 h-4 w-4 animate-spin'/>
                  Updating..
                  </>
                ):(
                  'Update'
                )}
                </Button>
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
                <div><h1 className="text-2xl font-bold">{currentUser.username}</h1></div>
                {/* <StatusButton status={currentUser.enabled?"Active":"In Active"}/> */}
                </div>
        <div className="flex gap-2">
         <BackButton/>
        </div>
      </div>

{/* //details of single ev user */}
      <Tabs defaultValue="details" value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="details">User Details</TabsTrigger>
           <TabsTrigger value="vehicles">Vehicles</TabsTrigger>

          <TabsTrigger value="rfid">RFID</TabsTrigger>
          <TabsTrigger value="wallet">Wallet</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <div>
             <div className="flex justify-between items-center mb-6">
              <div>
            <h2 className="text-xl font-semibold mb-4 pt-4">Personal Information</h2></div>
            <Button onClick={handleEditUser}>Edit</Button></div>
            <div>
              <Card className="p-6 mb-6">
                <div className="grid grid-cols-3 gap-2 mb-6">
                  <div>
                    <p className="font-semibold text-gray-600">Full Name</p>
                    <p className="font-medium">{currentUser.fullname}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-600">Username</p>
                    <p className="font-medium">{currentUser.username || '-'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-600">Email</p>
                    <p className="font-medium">{currentUser.email}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-600 mt-4">Mobile Number</p>
                    <p className="font-medium">{currentUser.mobileNumber}</p>
                  </div>
                  <div>
  <p className="font-semibold text-gray-600 mt-4">Status</p>
  <p className={`font-medium ${currentUser.enabled ? "text-green-600" : "text-red-600"}`}>
    {currentUser.enabled ? "Active" : "Inactive"}
  </p>
</div>
                </div>
              </Card>
            </div>

            <h2 className="text-xl font-semibold mt-8 mb-4">Address Information</h2>
            {currentUser.address && currentUser.address.length > 0 ? (
              <div>
                <Card className="p-6 mb-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="font-semibold text-gray-600">Address</p>
                      <p className="font-medium">{currentUser.address[0].address}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-600">City</p>
                      <p className="font-medium">{currentUser.address[0].city}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-600">State</p>
                      <p className="font-medium">{currentUser.address[0].state}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-600 mt-4">Country</p>
                      <p className="font-medium">{currentUser.address[0].country}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-600 mt-4">Zip Code</p>
                      <p className="font-medium">{currentUser.address[0].zipCode}</p>
                    </div>
                  </div>
                </Card>
              </div>
            ) : (
              <p>No address information available</p>
            )}
          </div>
        </TabsContent>
            <TabsContent value="vehicles">
                      <div className="bg-white rounded-lg shadow p-6 mt-4">
                        <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Vehicle Details</h2>
                <Button onClick={()=>setIsAddVehicleDialogOpen(true)}>Add Vehicle</Button>
            </div>       
            {!loadedTabs.has("vehicles") ? (
              <div className="text-center py-4">
                {/* <p>Click the Vehicles tab to load vehicle data</p> */}
              </div>
            ) : loadingVehicles ? (
              <Loading />
            ) : vehicleList.length > 0 ? (
              <Table className="border">
                <TableHeader>
                  <TableRow>
                    <TableHead>ConnectorType</TableHead>
                    <TableHead>Make</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Variant</TableHead>
                    <TableHead>VIN</TableHead>
                    <TableHead>Registration</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicleList.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell>{vehicle.connectorType}</TableCell>
                      <TableCell>{vehicle.make}</TableCell>
                      <TableCell>{vehicle.model}</TableCell>
                      <TableCell>{vehicle.variant || "-"}</TableCell>
                      <TableCell>{vehicle.vin}</TableCell>
                      <TableCell>{vehicle.registrationNo}</TableCell>
                      <TableCell className="text-right">
                         <div className="flex justify-end gap-2">
                          <Button 
                            key={vehicle.vin}
                            variant="ghost" 
                            size="icon" 
                            onClick={() =>{ handleInfoClick(vehicle), setVechileId(vehicle.id);}}
                          >
                          <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => {
                            setVechileId(vehicle.id);
                            setIsDeleteDialogOpen(true);
                            }}
                          >
                          <Trash className="h-4 w-4" />
                         </Button>
                        </div>
                      </TableCell>                                         
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p>No vehicles found for this user.</p>
            )}
          </div>
        </TabsContent>
        <TabsContent value="rfid">
          {loadingRfid ? (
    <Loading />
  ) : (
          <div className="bg-white rounded-lg shadow p-6 mt-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">RFID Information</h2>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">
                  {approvedRfidCount} / {MAX_RFID_REQUESTS} cards issued
                </span>
                <Button
                  onClick={() => setIsRfidDialogOpen(true)}
                  disabled={approvedRfidCount >= MAX_RFID_REQUESTS}
                >
                  Request RFID
                </Button>
              </div>
            </div>
            {approvedRfidCount >= MAX_RFID_REQUESTS && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-yellow-800">
                  This user has reached the maximum limit of {MAX_RFID_REQUESTS} RFID cards.
                </p>
              </div>
            )}
    <h3 className="text-lg font-semibold mt-4 mb-2">RFIDs</h3>
    <Table className="border mb-8">
      <TableHeader>
        <TableRow>
          <TableHead>RFID ID</TableHead>
          {/* <TableHead>RFID Hex</TableHead> */}
          <TableHead>Phone</TableHead>
          <TableHead>Expiry</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.isArray(rfidRequests) && rfidRequests.filter(item => item?.rfId  && item?.expiryDate).length > 0 ? (
          rfidRequests
            .filter(item => item?.rfId && item?.expiryDate)
            .map((rfid, index) => (
              <TableRow key={index}>
                <TableCell>{rfid.rfId}</TableCell>
                {/* <TableCell>{rfid.rfidHex}</TableCell> */}
                <TableCell>{rfid.phone}</TableCell>
                <TableCell>{rfid.expiryDate ? new Date(rfid.expiryDate).toLocaleDateString() : 'N/A'}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    rfid.status === 'Active' ? 'bg-green-100 text-green-800' :
                    rfid.status !== 'Inactive' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {rfid.status || 'N/A'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {rfid.status === 'Inactive' ? (
                      <Button size="sm" onClick={() => handleRfidStatusChange(rfid.rfId, 'Active')}>
                        Activate
                      </Button>
                    ) : rfid.status === 'Active' ? (
                      <Button size="sm" onClick={() => handleRfidStatusChange(rfid.rfId, 'inactive')}>
                        Deactivate
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))
        ) : (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-4">
              No RFID cards found
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>

    <h3 className="text-lg font-semibold mt-4 mb-2">RFID Requests</h3>
    <Table className="border">
      <TableHeader>
        <TableRow>
          <TableHead>Full Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Address</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.isArray(rfidRequests) && rfidRequests.filter(item => item.status=== "PENDING").length > 0 ? (
          rfidRequests
            .filter(item =>item.status === "PENDING")
            .map((rfid, index) => (
              <TableRow key={index}>
                <TableCell>{rfid.fullname || 'N/A'}</TableCell>
                <TableCell>{rfid.email || 'N/A'}</TableCell>
                <TableCell>{rfid.mobile || 'N/A'}</TableCell>
                <TableCell>
                  {rfid.address ? `${rfid.address}, ${rfid.city || ''}, ${rfid.state || ''}, ${rfid.country || ''} - ${rfid.zipCode || ''}` : 'N/A'}
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    rfid.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                    rfid.status !== 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {rfid.status || 'N/A'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleDelete(rfid.id)}>
                      <Trash className="h-4 w-4 text-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
        ) : (
          <TableRow>
            <TableCell colSpan={8} className="text-center py-4">
              No RFID requests found
            </TableCell>
          </TableRow>
          )}
        </TableBody>
       </Table>
      </div>
        )}
        </TabsContent>     
       <TabsContent value="wallet">
          <div className="bg-white rounded-lg shadow p-6 mt-4">
            <h2 className="text-xl font-semibold mb-4">Wallet Details</h2>
                 {!loadedTabs.has("wallet") ? (
  <div className="text-center py-4">
    <p>Click the Wallet tab to load wallet data</p>
  </div>
) : walletStatus === "loading" ? (
  <Loading />
) : walletStatus === "failed" ? (
              <p className="text-red-500">{walletError}</p>
            ) : walletStatus === "succeeded" && walletDetails ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600 font-medium">Balance:</p>
                  <p className="font-semibold text-lg">
                    ₹ {walletDetails.accountBalance.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Wallet Id:</p>
                  <p className="text-black">
                    {walletDetails.id || "N/A"}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </TabsContent>
     <TabsContent value="transactions">
        <div className="bg-white rounded-xl mt-4">
        <h2 className="text-xl font-semibold mb-6">Transaction History</h2>
      {!loadedTabs.has("transactions") ? (
  <div className="text-center py-4">
    {/* <p>Click the Transactions tab to load transaction data</p> */}
  </div>
) : walletStatus === "loading" ? (
  <Loading />
) : currentRecords?.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <p className="text-lg">No wallet transactions found.</p>
              </div>
            ) : (
          <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
      <thead className="border text-gray-500">
      <tr>
        <th className="px-4 py-2 text-left text-sm font-medium min-w-[100px]">Date</th>
        <th className="px-4 py-2 text-left text-sm font-medium min-w-[100px]">Debit</th>
        <th className="px-4 py-2 text-left text-sm font-medium min-w-[100px]">Credit</th>
        <th className="px-4 py-2 text-left text-sm font-medium min-w-[140px]">Balance</th>
        <th className="px-4 py-2 text-left text-sm font-medium min-w-[140px]">Status</th>
        <th className="px-4 py-2 text-left text-sm font-medium min-w-[200px]">Comment</th>
      </tr>
    </thead>
    <tbody>
    {currentRecords.map((t) => (
      <tr key={t.id} className="border-b hover:bg-gray-50 transition-all">
        <td className="px-4 py-2 text-sm">
          {new Date(t.createTimeStamp).toLocaleString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          })}
        </td>
        <td className="px-4 py-2 text-sm font-medium">
          {t.amtDebit ? `₹${t.amtDebit}` : "-"}
        </td>
        <td className="px-4 py-2 text-sm font-medium">
          {t.amtCredit ? `₹${t.amtCredit}` : "-"}
        </td>
        <td className="px-4 py-2 text-sm text-gray-800">
          ₹ {Number(t.currentBalance).toFixed(2)}
        </td>
        <td className="px-4 py-2">
          <span
            className={`px-3 py-1 text-xs rounded-full font-medium 
              ${
                t.status === "COMPLETED"
                  ? "bg-gray-100"
                  : t.status === "FAILED"
                  ? "bg-gray-100 "
                  : "bg-gray-100"
                  }
                `}
              >
                {t.status}
              </span>
            </td>
            <td className="px-6 py-4 text-sm text-gray-600">
              {t.comment || "-"}
            </td>
            </tr>
            ))}
          </tbody>
          </table>
          <div className="flex justify-center items-center gap-3 py-4">
          <button
        disabled={currentPage === 1}
        onClick={() => setCurrentPage((p) => p - 1)}
        className={`px-3 py-1.5 rounded-md border text-sm
          ${currentPage === 1 ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-100"}
        `}
      >
        Previous
      </button>
      {getPageNumbers().map((page) => (
        <button
          key={page}
          onClick={() => setCurrentPage(page)}
          className={`px-3 py-1.5 rounded-md border text-center text-sm
            ${currentPage === page ? "bg-green-600 text-white" : "hover:bg-gray-100"}
          `}
        >
          {page}
        </button>
      ))}
      <button
        disabled={currentPage === totalPages}
        onClick={() => setCurrentPage((p) => p + 1)}
        className={`px-3 py-1.5 rounded-md border text-sm 
          ${currentPage === totalPages ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-100"}
        `}
      >
        Next
      </button>
    </div>     
          </div>
          )}
        </div>
       </TabsContent>
      </Tabs>
      <Dialog open={isAddVehicleDialogOpen} onOpenChange={setIsAddVehicleDialogOpen}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
      <DialogHeader>
      <DialogTitle>Add New Vehicle</DialogTitle>
      </DialogHeader>
       <form onSubmit={handleAddVehicle} className="space-y-4">
       <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="connectorType">Connector Type *</Label>
          <Input
            id="connectorType"
            name="connectorType"
            value={vehicleFormData.connectorType}
            onChange={handleVehicleInputChange}
            required
          />
            {vehicleFormErrors.connectorType && (  <p className="text-xs text-red-500 mt-1">{vehicleFormErrors.connectorType}</p>)}
        </div>  
         <div className="space-y-2">
  <Label htmlFor="make">Make *</Label>
  <select
    id="make"
    name="make"
    value={vehicleFormData.make}
    onChange={(e) => {
      const selectedMake = e.target.value;
      setVehicleFormData(prev => ({
        ...prev,
        make: selectedMake,
        model: "" // reset model when make changes
      }));
    }}
    className="w-full border rounded-md p-2"
    required
  >
    <option value="">Select Make</option>
    {evBrands.map(brand => (
      <option key={brand.id} value={brand.brandName}>
        {brand.brandName}
      </option>
    ))}
  </select>

  {vehicleFormErrors.make && (
    <p className="text-xs text-red-500">{vehicleFormErrors.make}</p>
  )}
</div>      
       <div className="space-y-2">
  <Label htmlFor="model">Model *</Label>
  <select
    id="model"
    name="model"
    value={vehicleFormData.model}
    onChange={(e) => {
  const selectedModel = e.target.value;

  setVehicleFormData(prev => ({
    ...prev,
    model: selectedModel,
    variant: ""   // reset variant
  }));
}}
    disabled={!vehicleFormData.make}
    className="w-full border rounded-md p-2 disabled:bg-gray-100"
    required
  >
    <option value="">Select Model</option>
    {availableModels.map(m => (
      <option key={m.id} value={m.model}>
        {m.model}
      </option>
    ))}
  </select>

  {vehicleFormErrors.model && (
    <p className="text-xs text-red-500">{vehicleFormErrors.model}</p>
  )}
      </div>

      <div className="space-y-2">
  <Label htmlFor="variant">Variant</Label>

  {availableVariants.length > 0 ? (
    <select
      id="variant"
      name="variant"
      value={vehicleFormData.variant}
      onChange={handleVehicleInputChange}
      className="w-full border rounded-md p-2"
    >
      <option value="">Select Variant</option>

      {availableVariants.map((v) => (
        <option key={v.id} value={v.variantName}>
          {v.variantName}
        </option>
      ))}
    </select>
  ) : (
    <p className="text-sm text-gray-500">
      No variants available for this model
    </p>
  )}
</div>
        <div className="space-y-2">
          <Label htmlFor="vin">VIN *</Label>
          <Input
            id="vin"
            name="vin"
            value={vehicleFormData.vin}
            onChange={handleVehicleInputChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="registrationNo">Registration No *</Label>
          <Input
            id="registrationNo"
            name="registrationNo"
            value={vehicleFormData.registrationNo}
            onChange={handleVehicleInputChange}
            required
          />
            {vehicleFormErrors.registrationNo && (  <p className="text-xs text-red-500 mt-1">{vehicleFormErrors.registrationNo}</p>)}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="year">Year *</Label>
          <Input
            id="year"
            name="year"
            type="number"
            value={vehicleFormData.year}
            onChange={handleVehicleInputChange}
            required
          />
        </div>     
        <div className="space-y-2 col-span-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            name="description"
            value={vehicleFormData.description}
            onChange={handleVehicleInputChange}
          />
        </div>
      </div>      
      <DialogFooter>
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => setIsAddVehicleDialogOpen(false)}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : 'Save'}
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>

 <Dialog open={isEditVehicleDialogOpen} onOpenChange={setIsEditVehicleDialogOpen}>
  <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Edit Vehicle</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleUpdateVehicle} className="space-y-4">
       <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edit-connectorType">Connector Type *</Label>
          <Input
            id="edit-connectorType"
            name="connectorType"
            value={vehicleFormData.connectorType}
            onChange={handleVehicleInputChange}
            required
          />
            {vehicleFormErrors.connectorType && (  <p className="text-xs text-red-500 mt-1">{vehicleFormErrors.connectorType}</p>)}
        </div>        
        <div className="space-y-2">
          <Label htmlFor="edit-model">Model *</Label>
          <Input
            id="edit-model"
            name="model"
            value={vehicleFormData.model}
            onChange={handleVehicleInputChange}
            required
          />
            {vehicleFormErrors.model && (  <p className="text-xs text-red-500 mt-1">{vehicleFormErrors.model}</p>)}
        </div>
        <div className="space-y-2">
  <Label htmlFor="edit-variant">Variant</Label>
  <Input
    id="edit-variant"
    name="variant"
    value={vehicleFormData.variant}
    onChange={handleVehicleInputChange}
  />
</div>
        <div className="space-y-2">
          <Label htmlFor="edit-vin">VIN *</Label>
          <Input
            id="edit-vin"
            name="vin"
            value={vehicleFormData.vin}
            onChange={handleVehicleInputChange}
            required
          />
            {vehicleFormErrors.vin && (<p className="text-xs text-red-500 mt-1">{vehicleFormErrors.vin}</p>)}
        </div>        
        <div className="space-y-2">
          <Label htmlFor="edit-registrationNo">Registration No *</Label>
          <Input
            id="edit-registrationNo"
            name="registrationNo"
            value={vehicleFormData.registrationNo}
            onChange={handleVehicleInputChange}
            required
          />
            {vehicleFormErrors.registrationNo && (  <p className="text-xs text-red-500 mt-1">{vehicleFormErrors.registrationNo}</p>)}
        </div>        
        <div className="space-y-2">
          <Label htmlFor="edit-year">Year *</Label>
          <Input
            id="edit-year"
            name="year"
            type="number"
            value={vehicleFormData.year}
            onChange={handleVehicleInputChange}
            required
          />
        </div>        
        <div className="space-y-2">
          <Label htmlFor="edit-make">Make *</Label>
          <Input
            id="edit-make"
            name="make"
            value={vehicleFormData.make}
            onChange={handleVehicleInputChange}
            required
          />
            {vehicleFormErrors.make && (  <p className="text-xs text-red-500 mt-1">{vehicleFormErrors.make}</p>)}
        </div>      
        <div className="space-y-2 col-span-2">
          <Label htmlFor="edit-description">Description</Label>
          <Input
            id="edit-description"
            name="description"
            value={vehicleFormData.description}
            onChange={handleVehicleInputChange}
          />
        </div>
      </div>      
      <DialogFooter>
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => setIsEditVehicleDialogOpen(false)}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : 'Update'}
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
<Dialog open={isRfidDialogOpen} onOpenChange={setIsRfidDialogOpen}>
  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Request New RFID</DialogTitle>
        {rfidRequests.length >= MAX_RFID_REQUESTS && (
          <span className="block mt-2 text-red-600">
            Maximum {MAX_RFID_REQUESTS} RFID cards allowed per user.
          </span>
        )}
    </DialogHeader>
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="lastName">User Name *</Label>
          <Input
            id="username"
            name="username"
            value={newRfid.username}
            onChange={handleRfidInputChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={newRfid.email  }
            onChange={handleRfidInputChange}
            placeholder="User's email"
            required
            readOnly
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="mobile">Phone *</Label>
          <Input
            id="mobile"
            name="mobile"
            value={newRfid.mobile }
            onChange={handleRfidInputChange}
            placeholder="User's phone number"
            required
           readOnly
          />
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="useDefaultAddress"
            checked={useDefaultAddress}
            onCheckedChange={(checked) => {
              setUseDefaultAddress(checked);
              // When checkbox is checked, populate with user's address
              if (checked && currentUser?.address?.[0]) {
                setAddressParts({
                  street: currentUser.address[0].address,
                  city: currentUser.address[0].city ,
                  state: currentUser.address[0].state ,
                  country: currentUser.address[0].country || '',
                  zipCode: currentUser.address[0].zipCode 
                });
              } else {
                // When unchecked, clear the fields
                setAddressParts({
                  street: '',
                  city: '',
                  state: '',
                  country: '',
                  zipCode: ''
                });
              }
            }}
          />
          <Label htmlFor="useDefaultAddress">Use user's default address</Label>
        </div>
      </div>

        <div className="space-y-2">
          <Label>Address Details *</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Input
                name="street"
                value={addressParts.street}
                onChange={handleAddressPartsChange}
                placeholder="Street address"
                required
              />
            </div>
            <div className="space-y-2">
              <Input
                name="city"
                value={addressParts.city}
                onChange={handleAddressPartsChange}
                placeholder="City"
                required
              />
            </div>
            <div className="space-y-2">
              <Input
                name="state"
                value={addressParts.state}
                onChange={handleAddressPartsChange}
                placeholder="State/Province"
                required
              />
            </div>
            <div className="space-y-2">
              <Input
                name="country"
                value={addressParts.country}
                onChange={handleAddressPartsChange}
                placeholder="Country"
                required
              />
            </div>
            <div className="space-y-2">
              <Input
                name="zipCode"
                value={addressParts.zipCode}
                onChange={handleAddressPartsChange}
                placeholder="Postal/Zip code"
                required
              />
              {setRfidFormErrors.zipCode && (  <p className="text-xs text-red-500 mt-1">{setRfidFormErrors.zipCode}</p>)}
            </div>
          </div>
        </div>
      <div className="space-y-2">
        <Label htmlFor="rfidCount">Number of RFID Cards *</Label>
        <Input
          id="rfidCount"
          name="rfidCount"
          type="number"
          min="1"
          max={remainingCards}
          value={newRfid.rfidCount}
          onChange={handleRfidInputChange}
          placeholder="Number of RFID cards required"
          required
        />
        <p className="text-sm text-muted-foreground">
          Maximum {remainingCards} cards can be requested
        </p>
      </div>
    </div>

    <DialogFooter>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          setIsRfidDialogOpen(false);
          setNewRfid({
            firstName: currentUser?.fullname ,
            lastName: '',
            username: currentUser?.username || '',
            email: currentUser?.email ,
            mobile: currentUser?.mobileNumber ,
            status: 'Pending',
            rfidCount: 1,
            userId: id,
            requestedBy: 'Admin',
          });

           if (currentUser?.address?.[0]) {
            setAddressParts({
              street: currentUser.address[0].address || '',
              city: currentUser.address[0].city || '',
              state: currentUser.address[0].state || '',
              country: currentUser.address[0].country || '',
              zipCode: currentUser.address[0].zipCode || '',
            });
          }
          setUseDefaultAddress(true);
        }}
      >
        Cancel
      </Button>
      <Button
        type="button"
        onClick={handleRequestRfid}
        disabled={remainingCards <= 0 || isSubmitting}
      >
        {isSubmitting ? (
          <>
            <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : 'Submit Request'}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
       {isDeleteDialogOpen && currentUser&& (
        <DeleteOtp 
          userId={vechileId}
          onClose={() => {setIsDeleteDialogOpen(false),setVechileId(null)}}
          onDeleted={() => {
            // handleDeleteFranchiseOwner();
            setIsDeleteDialogOpen(false);
          }}
          role={"vehicle"}
        />)}
    </div>
  );
};

export default EvUserPageDetails;