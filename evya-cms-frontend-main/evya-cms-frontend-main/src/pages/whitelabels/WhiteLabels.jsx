import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { InfoIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ReloadIcon } from '@radix-ui/react-icons';
import DeleteOtp from '@/users/DeleteOtp';
import { validateName, validateMobileNumber, validateCity, validateZipCode, validateEmail,validateUsername,validateOrganizationName } from '@/pages/validations/Validation';
import { flexRender, getCoreRowModel, useReactTable, getPaginationRowModel, getSortedRowModel, getFilteredRowModel } from "@tanstack/react-table";
import Loading from '@/users/Loading';
import { fetchWhiteLabellist ,fetchSearchWhiteLabellist} from '@/store/reducers/whitelabel/whitelabelslice';
import { useDispatch, useSelector } from 'react-redux';
import AxiosServices from '@/services/AxiosServices';

const WhiteLabels = () => {
  const { list, totalPages } = useSelector((state) => state.whitelabel);
  const [currentPage, setCurrentPage] = useState(0);
  const [data, setData] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentWhiteLabel, setCurrentWhiteLabel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [pageSize, setPageSize] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const dispatch = useDispatch();
  const { toast } = useToast();
  const navigate = useNavigate();
  const searchTimeoutRef = useRef(null);
  const columns = [
    // {
    //   accessorKey: "orgId",
    //   header: "Organization Ijjjjd",
    // },
    {
      accessorKey: "orgName",
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
            <InfoIcon className="h-4 w-4 " />
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
    rolename: "WhiteLabel",
    password: "",
    confirmPassword: "",
    address: "",
    city: "",
    country: "",
    state: "",
    zipCode: ""
  });

useEffect(() => {
  const errors = {};

  const fullNameError = validateName(formData.fullname);
  if (fullNameError) errors.fullname = fullNameError;

  const emailError = validateEmail(formData.email);
  if (emailError) errors.email = emailError;

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

const fetchWhiteLabels = useCallback(async (searchValue = '') => {
  try {
    setLoading(true);
    const params = {
      page: currentPage,
      size: pageSize,
    };

    if (searchValue.trim()) {
      params.search = searchValue.trim();
      params.type = "whitelabel";
      await dispatch(fetchSearchWhiteLabellist(params));
    } else {
      await dispatch(fetchWhiteLabellist(params));
    }
  } catch (error) {
    toast({
      title: "Error",
      description: error.message || "Failed to fetch white labels",
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
}, [dispatch, currentPage, pageSize, toast]);

useEffect(() => {
  setLoading(true);

  if (searchTimeoutRef.current) {
    clearTimeout(searchTimeoutRef.current);
  }

  searchTimeoutRef.current = setTimeout(() => {
    fetchWhiteLabels(globalFilter);
  }, 500);

  return () => clearTimeout(searchTimeoutRef.current);
}, [globalFilter, fetchWhiteLabels]);


useEffect(() => {
  const handleOpenDialog = () => {
    console.log("EVENT RECEIVED ✅");
    setIsAddDialogOpen(true);
  };

  window.addEventListener('openAddWhitelabelDialog', handleOpenDialog);

  return () => {
    window.removeEventListener('openAddWhitelabelDialog', handleOpenDialog);
  };
}, []);

//prasad removed the globalfilter dependency for search loading for every letter remaining all tested working fine 
 useEffect(() => {
  fetchWhiteLabels(globalFilter);
}, [currentPage, pageSize, fetchWhiteLabels]);

 useEffect(() => {
  const enrichedData = Array.isArray(list) 
    ? list.map(item => ({
        ...item,
        onView: () => handleViewDetails(item),
        onDelete: () => {
          setCurrentWhiteLabel({ id: item.userId });
          setIsDeleteDialogOpen(true);
        }
      }))
    : [];
  
  setData(enrichedData);
}, [list]);
const handleSearchChange = (e) => {
  const value = e.target.value;
  setGlobalFilter(value);
  setCurrentPage(0);
};
  const fetchWhiteLabelDetails = async (userId, orgId) => {
    try {
      const details = await AxiosServices.getWhiteLabelDetails(userId, orgId);
      return details;
    } catch (error) {
      console.error('Error fetching white label details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch white label details. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const handlePageChange = (page) => {
    if (page >= 0 && page < totalPages) {
      setCurrentPage(page);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
    
// Add new white label
const handleAddWhiteLabel = async (e) => {
  e.preventDefault();  

  const errors = {};
  const fullNameError = validateName(formData.fullname);
  if (fullNameError) errors.fullname = fullNameError;

  const emailError = validateEmail(formData.email);
  if (emailError) errors.email = emailError;

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

  if (Object.keys(errors).length > 0) {
    toast({
      title: "Validation Error",
      description: "Please fix the errors in the form before submitting.",
      variant: "destructive",
    });
    return; 
  }
  try {
    setIsSubmitting(true);
    const response = await AxiosServices.addWhiteLabel(formData);
    
    if (response.status === 201) {
      toast({
        title: "Success",
        description: "White label added successfully!",
      });
      fetchWhiteLabels();
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
      description: errorMessage || "Failed to add white label. Please try again.",
      variant: "destructive",
    });
  } finally {
    setIsSubmitting(false); 
  }
};  // Reset form
  const resetForm = () => {
    setFormData({
      orgName: "",
      fullname: "",
      username: "",
      email: "",
      mobileNumber: "",
      rolename: "WhiteLabel",
      password: "",
      confirmPassword: "",
      address: "",
      city: "",
      country: "",
      state: "",
      zipCode: ""
    });
  }

  const handleViewDetails = async (whitelabel) => {
    const details = await fetchWhiteLabelDetails(whitelabel.userId, whitelabel.orgId);
    if (details) {
      navigate(`/whitelabels/${whitelabel.userId}/${whitelabel.orgId}/${whitelabel.orgName}`);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">White Labels Management</h1>
        <div className="flex gap-2">
          <Button onClick={() => setIsAddDialogOpen(true)}>Add White Label</Button>
        </div>
      </div>
      <Input
            placeholder="Search Whitelabels..."
            value={globalFilter}
            onChange={handleSearchChange}
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
                  No white labels found
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
          disabled={currentPage === 0}> Previous
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

      {/* Add White Label Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New White Label</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddWhiteLabel} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name</Label>
                <Input 
                  id="orgName" 
                  name="orgName" 
                  value={formData.orgName} 
                  onChange={handleInputChange} 
                  required
                />
                {formErrors.orgName && (  <p className="text-xs text-red-500 mt-1">{formErrors.orgName}</p>)}
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullname">Point Of Contact</Label>
                <Input 
                  id="fullname" 
                  name="fullname" 
                  value={formData.fullname} 
                  onChange={handleInputChange} 
                />
                {formErrors.fullname && (  <p className="text-xs text-red-500 mt-1">{formErrors.fullname}</p>)}
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobileNumber">Mobile Number</Label>
                <Input 
                  id="mobileNumber" 
                  name="mobileNumber" 
                  value={formData.mobileNumber} 
                  onChange={handleInputChange} 
                />
                {formErrors.mobileNumber && (  <p className="text-xs text-red-500 mt-1">{formErrors.mobileNumber}</p>)}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  value={formData.email} 
                  onChange={handleInputChange} 
                />
                {formErrors.email && (  <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>)}
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  name="username" 
                  value={formData.username} 
                  onChange={handleInputChange} 
                  required
                />
                {formErrors.username && (  <p className="text-xs text-red-500 mt-1">{formErrors.username}</p>)}
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input 
                  id="address" 
                  name="address" 
                  value={formData.address} 
                  onChange={handleInputChange} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input 
                  id="city" 
                  name="city" 
                  value={formData.city} 
                  onChange={handleInputChange} 
                />
                {formErrors.city && (  <p className="text-xs text-red-500 mt-1">{formErrors.city}</p>)}
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input 
                  id="state" 
                  name="state" 
                  value={formData.state} 
                  onChange={handleInputChange} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input 
                  id="country" 
                  name="country" 
                  value={formData.country} 
                  onChange={handleInputChange} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">Zip Code</Label>
                <Input 
                  id="zipCode" 
                  name="zipCode" 
                  value={formData.zipCode} 
                  onChange={handleInputChange} 
                />
                {formErrors.zipCode && (  <p className="text-xs text-red-500 mt-1">{formErrors.zipCode}</p>)}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
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
      {isDeleteDialogOpen && currentWhiteLabel && (
        <DeleteOtp 
          userId={currentWhiteLabel.id}
          onClose={() => setIsDeleteDialogOpen(false)}
          onDeleted={() => {
            fetchWhiteLabels();
            setIsDeleteDialogOpen(false);
          }}
          role={"user"}
        />
      )}
    </div>
  );
};
export default WhiteLabels

//WhiteLabels.jsx