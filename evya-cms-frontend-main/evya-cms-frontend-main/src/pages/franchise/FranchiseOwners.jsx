import React, { useState, useEffect, useCallback } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { InfoIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ReloadIcon } from '@radix-ui/react-icons';
import DeleteOtp from '@/users/DeleteOtp';
import {
  validateName,
  validateMobileNumber,
  validateCity,
  validateZipCode,
  validateEmail,
  validateUsername,
  validateChargerName,
  validateOrganizationName
} from '@/pages/validations/Validation';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";
import Loading from '@/users/Loading';
import { fetchOwnerlist } from '@/store/reducers/Franchiseowner/FranchiseSlice';
import { useDispatch, useSelector } from 'react-redux';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AxiosServices from '@/services/AxiosServices';

const FranchiseOwners = () => {
  const { list, totalElements } = useSelector((state) => state.franchise);
  const [currentPage, setCurrentPage] = useState(0);
  const [data, setData] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentOwner, setCurrentOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [whiteLabels, setWhiteLabels] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useSelector(state => state.authentication);
  console.log("user",user.orgId);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil((totalElements || 0) / pageSize));

  const { toast } = useToast();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formErrors, setFormErrors] = useState({});

  const columns = [
    {
      accessorKey: "wl_orgName",
      header: "WhiteLabel Organization",
    },
    {
      accessorKey: "owner_orgName",
      header: "Organization Name",
    },
    {
      accessorKey: "fullname",
      header: "Name",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "mobilenumber",
      header: "Mobile Number",
    },
    {
      accessorKey: "username",
      header: "Username",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={(e) => {
              e.stopPropagation();
              row.original.onView();
            }}
          >
            <InfoIcon className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const [formData, setFormData] = useState({
    orgName: "",
    fullname: "",
    username: "",
    email: "",
    mobileNumber: "",
    rolename: "FranchiseOwner",
    password: "welcome123",
    confirmPassword: "welcome123",
    address: "",
    city: "Hyderabad",
    country: "India",
    state: "Telangana",
    zipCode: "",
    orgId: Number(user?.orgId) === 1 ? '' : user?.orgId,
  });

  useEffect(() => {
    const errors = {};
  
    const fullNameError = validateName(formData.fullname);
    if (fullNameError) errors.fullname = fullNameError;

    const emailError = validateEmail(formData.email);
    if (emailError) errors.email = emailError;
     
    const userNameError = validateUsername(formData.username);
    if (userNameError) errors.username = userNameError;
  
    const mobileError = validateMobileNumber(formData.mobileNumber);
    if (mobileError) errors.mobileNumber = mobileError;

    const zipError = validateZipCode(formData.zipCode);
    if (zipError) errors.zipCode = zipError;
  
    const cityError = validateCity(formData.city);
    if (cityError) errors.city = cityError;

    const organizationNameError = validateOrganizationName(formData.orgName);
    if(organizationNameError) errors.orgName = organizationNameError;

    const usernameError = validateUsername(formData.username);
    if(usernameError) errors.username = usernameError;
  
    setFormErrors(errors);
  }, [formData]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    manualPagination: true,
    pageCount: totalPages,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination: {
        pageIndex: currentPage,
        pageSize: pageSize,
      },
    },
  });

  const fetchFranchiseOwners = useCallback(async () => {
    try {
      setLoading(true);
      await dispatch(fetchOwnerlist({
        id:user.orgId,  
        page: currentPage, 
        size: pageSize,
        search: globalFilter ,   
      }));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching franchise owners:', error);
      toast({
        title: "Error",
        description: "Failed to fetch franchise owners. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  }, [dispatch, currentPage, globalFilter]);

  const fetchWhiteLabels = async () => {
    try {
      const response= await AxiosServices.getWhiteLabels();
      setWhiteLabels(response.data);
    } catch (error) {
      console.error('Error fetching white labels:', error);
      toast({
        title: "Error",
        description: "Failed to fetch white labels. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchFranchiseOwners();
    fetchWhiteLabels();
  }, [fetchFranchiseOwners]);

  useEffect(() => {
    const enrichedData = list.map(item => ({
      ...item,
      onView: () => handleViewDetails(item),
      onDelete: () => {
        setCurrentOwner({ id: item.userId });
        setIsDeleteDialogOpen(true);
      }
    }));
    setData(enrichedData);
  }, [list]);

  //for copilot
//for copilot
useEffect(() => {
  const handleOpenAddDialog = () => {
    console.log("✅ openAddFranchiseDialog event received!");
    console.log("Current isAddDialogOpen state:", isAddDialogOpen);
    setIsAddDialogOpen(true);
    console.log("Set isAddDialogOpen to true");
  };

  console.log("🎧 Adding event listener for openAddFranchiseDialog");
  window.addEventListener('openAddFranchiseDialog', handleOpenAddDialog);
  
  return () => {
    console.log("🔇 Removing event listener for openAddFranchiseDialog");
    window.removeEventListener('openAddFranchiseDialog', handleOpenAddDialog);
  };
}, []);
  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 0 && page < totalPages) {
      setCurrentPage(page);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
  };

const handleAddFranchiseOwner = async (e) => {
    e.preventDefault();
  const requiredFields = {
    orgName: "Organization name",
    fullname: "Full name",
    username: "Username",
    email: "Email",
    mobileNumber: "Mobile number",
    address: "Address",
    city: "City",
    state: "State",
    country: "Country",
    zipCode: "Zip code"
  };

  const missingFields = Object.entries(requiredFields)
    .filter(([field]) => !formData[field])
    .map(([_, name]) => name);

  if (missingFields.length > 0) {
    toast({
      description: `Please fill all required fields: ${missingFields.join(", ")}`,
      variant: "destructive",
    });
    return;
  }
  if (Object.keys(formErrors).length > 0) {
    const errorMessages = Object.values(formErrors).filter(Boolean).join('\n');
    toast({
      description: errorMessages,
      variant: "destructive",
    });
    return;
  }    
    try {
      setIsSubmitting(true);      
      const response= await AxiosServices.addFranchise(formData);
      if (response.status === 201) {
        toast({
          title: "Success",
          description: "Franchise owner added successfully!",
        });
        fetchFranchiseOwners();
        setIsAddDialogOpen(false);
        resetForm();
      }
      else
      {
        toast({
          title: "Failed",
          description: response.data,
        });
      }
    }  catch (error) {
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
      description: errorMessage || "Failed to add white label. Please try again.",
      variant: "destructive",
    });
  }  finally {
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
      password: "welcome123",
      confirmPassword: "welcome123",
      address: "",
      city: "Hyderabad",
      country: "India",
      state: "Telangana",
      zipCode: "",
      orgId: Number(user?.orgId) === 1 ? '' : user?.orgId,
    });
  };

  const handleDeleteFranchiseOwner = async () => {
    try {
      const userId = currentOwner.id;
      toast({
        title: "Success",
        description: "Franchise owner deleted successfully!",
      });
      fetchFranchiseOwners();
    } catch (error) {
      console.error('Error deleting franchise owner:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete franchise owner. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = async (owner) => {
    navigate(`/franchiseOwners/${owner.userId}/${owner.owner_orgId}/${owner.owner_orgName}`);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Franchise Owners Management</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>Add Franchise Owner</Button>
      </div>

      <Input
        placeholder="Search Franchise Owners..."
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="mb-4"
      />      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <Loading/>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No franchise owners found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
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
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Franchise Owner</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddFranchiseOwner} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
             {Number(user?.roleId) === 1 && (
  <div className="space-y-2">
    <Label htmlFor="orgId">White Label Organization *</Label>
    {Number(user?.orgId) === 1 ? (
      <>
        <Select
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, orgId: value }))
          }
          value={formData.orgId?.toString() || ""}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a White Label Organization" />
          </SelectTrigger>
          <SelectContent>
            {whiteLabels.length > 0 ? (
              whiteLabels.map((whiteLabel) => (
                <SelectItem
                  key={whiteLabel.id || whiteLabel.orgId}
                  value={(whiteLabel.id || whiteLabel.orgId).toString()}
                >
                  {whiteLabel.orgName || whiteLabel.organizationName}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="no-data" disabled>
                No white labels available
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        {whiteLabels.length === 0 && (
          <p className="text-sm text-amber-500 mt-1">
            No white label organizations found. Please add white labels first.
          </p>
        )}
      </>
    ) : (
      <Input
        type="hidden"
        id="orgId"
        name="orgId"
        value={user.orgId}
        readOnly
      />
    )}
  </div>
)}
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name *</Label>
                <Input 
                  id="orgName" 
                  name="orgName" 
                  value={formData.orgName} 
                  onChange={handleInputChange} 
                />
                {formErrors.orgName && <p className="text-sm text-red-500">{formErrors.orgName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullname">Full Name *</Label>
                <Input 
                  id="fullname" 
                  name="fullname" 
                  value={formData.fullname} 
                  onChange={handleInputChange} 
                />
                {formErrors.fullname && <p className="text-sm text-red-500">{formErrors.fullname}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobileNumber">Mobile Number *</Label>
                <Input 
                  id="mobileNumber" 
                  name="mobileNumber" 
                  value={formData.mobileNumber} 
                  onChange={handleInputChange} 
                />
                {formErrors.mobileNumber && <p className="text-sm text-red-500">{formErrors.mobileNumber}</p>}
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
                {formErrors.email && <p className="text-sm text-red-500">{formErrors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input 
                  id="username" 
                  name="username" 
                  value={formData.username} 
                  onChange={handleInputChange} 
                />
                {formErrors.username && <p className="text-sm text-red-500">{formErrors.username}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input 
                  id="address" 
                  name="address" 
                  value={formData.address} 
                  onChange={handleInputChange} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input 
                  id="city" 
                  name="city" 
                  value={formData.city} 
                  onChange={handleInputChange} 
                />
                {formErrors.city && <p className="text-sm text-red-500">{formErrors.city}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input 
                  id="state" 
                  name="state" 
                  value={formData.state} 
                  onChange={handleInputChange} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <Input 
                  id="country" 
                  name="country" 
                  value={formData.country} 
                  onChange={handleInputChange} 
                />
                {formErrors.country && <p className="text-sm text-red-500">{formErrors.country}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">Zip Code *</Label>
                <Input 
                  id="zipCode" 
                  name="zipCode" 
                  value={formData.zipCode} 
                  onChange={handleInputChange} 
                />
                {formErrors.zipCode && <p className="text-sm text-red-500">{formErrors.zipCode}</p>}
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
      {isDeleteDialogOpen && currentOwner && (
        <DeleteOtp 
          userId={currentOwner.id}
          onClose={() => setIsDeleteDialogOpen(false)}
          onDeleted={() => {
            handleDeleteFranchiseOwner();
            setIsDeleteDialogOpen(false);
          }}
          role={"user"}
        />
      )}
    </div>
  );
};
export default FranchiseOwners;