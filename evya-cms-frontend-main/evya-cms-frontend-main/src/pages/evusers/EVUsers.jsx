import React, { useState, useEffect, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { InfoIcon} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ReloadIcon } from '@radix-ui/react-icons';
import { validateName, validateMobileNumber, validateCity, validateZipCode, validateEmail, validateUsername} from '@/pages/validations/Validation';
import { flexRender, getCoreRowModel, useReactTable, getPaginationRowModel, getSortedRowModel, getFilteredRowModel} from "@tanstack/react-table";
import Loading from '@/users/Loading';
import AxiosServices from '@/services/AxiosServices';
import { useSelector } from 'react-redux';

const EVUsers = () => {
  const [data, setData] = useState([]);
  const [searchInput, setSearchInput] = useState(''); 
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [whiteLabels, setWhiteLabels] = useState([]);
  const pageSize = 10;
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const { user } = useSelector(state => state.authentication);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [formErrors, setFormErrors] = useState({});

  // Form state
  const [formData, setFormData] = useState({
    orgId: user.orgId === 1 ? '' : user.orgId,
    fullname: "",
    username: "",
    email: "",
    mobileNumber: "",
    rolename: "Driver",
    password: "defaultPassword",
    confirmPassword: "defaultPassword",
    address: "",
    city: "",
    country: "India",
    state: "",
    zipCode: ""
  });

  const columns = [
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "mobileNumber",
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
  
  useEffect(() => {
  const timer = setTimeout(() => {
    const prefixes = [
      { prefix: 'name:', field: 'fullname' },
      { prefix: 'email:', field: 'email' },
      { prefix: 'mobile:', field: 'mobileNumber' },
      { prefix: 'username:', field: 'username' }
    ];
    
    let newField = '';
    let newTerm = searchInput.trim();
    
    for (const { prefix, field } of prefixes) {
      if (searchInput.toLowerCase().startsWith(prefix)) {
        newField = field;
        newTerm = searchInput.slice(prefix.length).trim();
        break;
      }
    }
    
    setCurrentPage(0); 
  }, 500); 
  
  return () => clearTimeout(timer);
}, [searchInput]);

  // Validate form function
  const validateForm = useCallback(() => {
    const errors = {};
    
    if (!formData.orgId) errors.orgId = "Organization is required";
    
    const fullNameError = validateName(formData.fullname);
    if (fullNameError) errors.fullname = fullNameError;
    
    const usernameError = validateUsername(formData.username);
    if (usernameError) errors.username = usernameError;
    
    const emailError = validateEmail(formData.email);
    if (emailError) errors.email = emailError;
    
    const mobileError = validateMobileNumber(formData.mobileNumber);
    if (mobileError) errors.mobileNumber = mobileError;
    
    if (!formData.address) errors.address = "Address is required";
    
    const cityError = validateCity(formData.city);
    if (cityError) errors.city = cityError;
    
    if (!formData.state) errors.state = "State is required";
    
    if (!formData.country) errors.country = "Country is required";
    
    const zipError = validateZipCode(formData.zipCode);
    if (zipError) errors.zipCode = zipError;
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddEVUser = async (e) => {
    e.preventDefault();
        const isValid = validateForm();
    
    if (!isValid) {
      toast({
        title: "Validation Error",
        description: "Please fix all errors before submitting",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const submissionData = {
        ...formData,
        orgId: user.orgId === 1 ? formData.orgId : user.orgId
      };

      const response = await AxiosServices.addEVUser(submissionData);
      
      if (response.status === 201) {
        toast({
          title: "Success",
          description: "EV user added successfully!",
        });
        fetchEVUsers();
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
    } catch (error) {
    let errorMessage = "Failed to add site";
    
    if (error.response?.data.includes('ConstraintViolationException') || 
        error.response?.data.includes('could not execute statement')||error.response?.data.includes('Transaction rolled back because it has been marked as rollback-only') ) {
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

const fetchEVUsers = useCallback(async () => {
  try {
    setLoading(true);

    const orgIdForRequest = user?.orgId === 1 ? formData.orgId || '' : user?.orgId;

    const response = await AxiosServices.getEVUsers(
      currentPage,
      pageSize,
      orgIdForRequest,
      searchInput
    );

    setData((response.driversList || []).map(user => ({
      ...user,
      onView: () => handleViewDetails(user)
    })));

    setTotalPages(response.totalPages || 1);
    setTotalElements(response.totalItems || 0);

  } catch (error) {
    toast({
      title: "Error",
      description: error.message || "Failed to fetch EV users",
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
}, [currentPage, searchInput, user?.orgId, formData.orgId, toast, pageSize]);

  // Reset form
  const resetForm = () => {
    setFormData({
      orgId: user.orgId === 1 ? '' : user.orgId,
      fullname: "",
      username: "",
      email: "",
      mobileNumber: "",
      rolename: "Driver",
      password: "defaultPassword",
      confirmPassword: "defaultPassword",
      address: "",
      city: "",
      country: "India",
      state: "",
      zipCode: ""
    });
    setFormErrors({});
  };

  const fetchWhiteLabels = useCallback(async () => {
  try {
    const response = await AxiosServices.getWhiteLabels();
    setWhiteLabels(response.data);
  } catch (error) {
    console.error('Error fetching white labels:', error);
    toast({
      title: "Error",
      description: "Failed to fetch white labels. Please try again.",
      variant: "destructive",
    });
  }
}, [toast]);

useEffect(() => {
  if (user.orgId == 1) {
    fetchWhiteLabels();
  }
}, [user.orgId, fetchWhiteLabels]);
  const handleViewDetails = (user) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User ID is missing. Cannot view details.",
        variant: "destructive",
      });
      return;
    }
    navigate(`/evusers/${user.id}`);
  };

  const handlePageChange = (page) => {
    if (page >= 0 && page < totalPages) {
      setCurrentPage(page);
    }
  };
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
      pagination: {
        pageIndex: currentPage,
        pageSize: pageSize,
      },
    },
  });

useEffect(() => {
  fetchEVUsers();
}, [fetchEVUsers, currentPage, searchInput]);

  useEffect(() => {
    if (isAddDialogOpen) {
      validateForm();
    }
  }, [formData, isAddDialogOpen, validateForm]);


  // Inside EVUsers component, after other useEffects
// Add this inside the EVUsers component
useEffect(() => {
  const handleOpenAddDialog = () => {
    console.log('🎯 Opening Add EV User dialog from Copilot');
    setIsAddDialogOpen(true);
  };
  window.addEventListener('openAddEVUserDialog', handleOpenAddDialog);
  return () => window.removeEventListener('openAddEVUserDialog', handleOpenAddDialog);
}, []);
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">EV Users Management</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>Add New EV User</Button>
      </div>

         <Input
            placeholder="Search users by name, email, mobile or username..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setCurrentPage(0); 
            }}
            className="mb-4"
          />
                
      {/* EV Users Table */}
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
                  No EV users found
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

      {/* Add EV User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New EV User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddEVUser} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
             {Number(user?.roleId) == 1 && (
      <div className="space-y-2">
        <Label htmlFor="orgId">White Label Organization *</Label>
        {user.orgId == 1 ? (
          <Select
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, orgId: value }))
            }
            value={formData.orgId?.toString() || ""}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a White Label" />
            </SelectTrigger>
            <SelectContent>
              {whiteLabels.map((whiteLabel) => (
                <SelectItem
                  key={whiteLabel.id}
                  value={whiteLabel.id.toString()}
                >
                  {whiteLabel.orgName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <>
            <Input
              type="hidden"
              id="orgId"
              name="orgId"
              value={user.orgId}
              readOnly
            />
             {formData.orgId !== user.orgId && setFormData((prev) => ({
                ...prev,
                orgId: user.orgId,
              }))}
              </>
              )}
              {formErrors.orgId && <p className="text-sm text-red-500">{formErrors.orgId}</p>}
              </div>
            )}
              <div className="space-y-2">
                <Label htmlFor="fullname">Full Name *</Label>
                <Input 
                  id="fullname" 
                  name="fullname" 
                  value={formData.fullname} 
                  onChange={handleInputChange} 
                />
                {formErrors.fullname && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.fullname}</p>
                )}
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
                <Label htmlFor="email">Email *</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  value={formData.email} 
                  onChange={handleInputChange} 
                />
                {formErrors.email && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobileNumber">Mobile Number *</Label>
                <Input 
                  id="mobileNumber" 
                  name="mobileNumber" 
                  value={formData.mobileNumber} 
                  onChange={handleInputChange} 
                />
                {formErrors.mobileNumber && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.mobileNumber}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input 
                  id="address" 
                  name="address" 
                  value={formData.address} 
                  onChange={handleInputChange} 
                />
                {formErrors.address && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.address}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input 
                  id="city" 
                  name="city" 
                  value={formData.city} 
                  onChange={handleInputChange} 
                />
                {formErrors.city && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.city}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input 
                  id="state" 
                  name="state" 
                  value={formData.state} 
                  onChange={handleInputChange} 
                />
                {formErrors.state && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.state}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <Input 
                  id="country" 
                  name="country" 
                  value={formData.country} 
                  onChange={handleInputChange} 
                />
                {formErrors.country && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.country}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">Zip Code *</Label>
                <Input 
                  id="zipCode" 
                  name="zipCode" 
                  value={formData.zipCode} 
                  onChange={handleInputChange} 
                />
                {formErrors.zipCode && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.zipCode}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
              >
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
    </div>
  );
};
export default EVUsers;

//EVUsers