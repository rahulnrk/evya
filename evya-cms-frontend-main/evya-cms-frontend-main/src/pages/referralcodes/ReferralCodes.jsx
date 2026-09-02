import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Info, Trash2, Plus, Check } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
} from "@tanstack/react-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  fetchReferrals,
  addReferral,
  deleteReferral,
  selectAllReferrals,
  selectReferralStatus,
  selectReferralError,
} from '@/store/reducers/referralCode/referralSlice';
import { fetchSites } from '@/store/reducers/sites/sitesSlice';

export default function ReferralCodes() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();

  const referralCodes = useSelector(selectAllReferrals);
  const status = useSelector(selectReferralStatus);
  const error = useSelector(selectReferralError);
  const { list: sites } = useSelector((state) => state.sites);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    code: '',
    offerPercentage: '',
    validFrom: '',
    validTo: '',
    applyToAllSites: true,
    selectedSites: [],
  });
  const [formErrors, setFormErrors] = useState({});
  useEffect(() => {
    dispatch(fetchReferrals());
    dispatch(fetchSites({ page: 0, size: 100 }));
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const filteredSites = sites.filter(site =>
    site.sitename?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      accessorKey: "referralCode",
      header: "ReferralCode",
    },
    {
      accessorKey: "offerPercentage",
      header: "Offer Percentage",
      cell: ({ row }) => `${row.original.offerPercentage}%`,
    },
    {
      accessorKey: "validFrom",
      header: "Valid From",
      cell: ({ row }) => new Date(row.original.validFrom).toLocaleDateString(),
    },
    {
      accessorKey: "validTo",
      header: "Valid To",
      cell: ({ row }) => new Date(row.original.validTo).toLocaleDateString(),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/referral-codes/${row.original.id}`)}>
            <Info className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={(e) => {
            e.stopPropagation();
            handleDelete(row.original.id);
          }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: referralCodes,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const handleDelete = async (id) => {
    try {
      await dispatch(deleteReferral(id)).unwrap();
      toast({
        title: "Deleted",
        description: "Referral code deleted successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete referral code",
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.code.trim()) errors.code = "Code is required";
    if (!formData.offerPercentage || formData.offerPercentage <= 0 || formData.offerPercentage > 100)
      errors.offerPercentage = "Enter valid offer between 1 and 100";
    if (!formData.validFrom) errors.validFrom = "Valid from date is required";
    if (!formData.validTo) errors.validTo = "Valid to date is required";
    if (new Date(formData.validTo) < new Date(formData.validFrom))
      errors.validTo = "Valid to date cannot be before valid from date";
    if (!formData.applyToAllSites && formData.selectedSites.length === 0)
      errors.selectedSites = "Select at least one site";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCheckboxChange = (checked) => {
    setFormData(prev => ({ ...prev, applyToAllSites: checked, selectedSites: checked ? [] : prev.selectedSites }));
    setSearchTerm(''); 
  };

  const toggleSiteSelection = (siteId) => {
    setFormData(prev => {
      const isSelected = prev.selectedSites.includes(siteId);
      return {
        ...prev,
        selectedSites: isSelected
          ? prev.selectedSites.filter(id => id !== siteId)
          : [...prev.selectedSites, siteId],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      code: formData.code.trim(),
      offerPercentage: parseInt(formData.offerPercentage),
      validFrom: formData.validFrom,
      validTo: formData.validTo,
      applyToAllSites: formData.applyToAllSites,
      sites: formData.applyToAllSites ? [] : formData.selectedSites,
    };

    try {
      await dispatch(addReferral(payload)).unwrap();
      toast({
        title: "Success",
        description: "Referral code added successfully",
      });
      setIsAddDialogOpen(false);
      setFormData({
        code: '',
        offerPercentage: '',
        validFrom: '',
        validTo: '',
        applyToAllSites: true,
        selectedSites: [],
      });
      setFormErrors({});
      setSearchTerm('');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add referral code",
      });
    }
  };

  if (status === 'loading') {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Referral Codes</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          Add Referral Code
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {status === 'failed' ? 'Error loading referral codes' : 'No referral codes found'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Previous
        </Button>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Next
        </Button>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Referral Code</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code *</Label>
              <Input id="code" name="code" value={formData.code} onChange={handleInputChange} placeholder="Enter referral code" />
              {formErrors.code && <p className="text-sm text-red-500">{formErrors.code}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="offerPercentage">Offer Percentage *</Label>
              <Input id="offerPercentage" name="offerPercentage" type="number" min="1" max="100" value={formData.offerPercentage} onChange={handleInputChange} placeholder="e.g., 20" />
              {formErrors.offerPercentage && <p className="text-sm text-red-500">{formErrors.offerPercentage}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="validFrom">Valid From *</Label>
                <Input id="validFrom" name="validFrom" type="date" value={formData.validFrom} onChange={handleInputChange} />
                {formErrors.validFrom && <p className="text-sm text-red-500">{formErrors.validFrom}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="validTo">Valid To *</Label>
                <Input id="validTo" name="validTo" type="date" value={formData.validTo} onChange={handleInputChange} min={formData.validFrom} />
                {formErrors.validTo && <p className="text-sm text-red-500">{formErrors.validTo}</p>}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="applyToAllSites" checked={formData.applyToAllSites} onCheckedChange={handleCheckboxChange} />
              <Label htmlFor="applyToAllSites">Apply to all sites</Label>
            </div>

            {!formData.applyToAllSites && (
              <div className="space-y-2">
                <Label>Select Sites *</Label>
                <Input
                  placeholder="Search sites..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="mb-2"
                />
                <div className="w-full bg-white shadow-lg rounded-md border p-2 max-h-60 overflow-auto">
                  {filteredSites.length > 0 ? (
                    filteredSites.map(site => (
                      <div
                        key={site.siteId}
                        className="flex items-center p-2 hover:bg-gray-50 rounded"
                      >
                        <Checkbox
                          checked={formData.selectedSites.includes(site.siteId)}
                          className="mr-2"
                          onCheckedChange={() => toggleSiteSelection(site.siteId)}
                        />
                        <span>{site.sitename}</span>
                        {formData.selectedSites.includes(site.siteId) && (
                          <Check className="ml-auto h-4 w-4 text-primary" />
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-gray-500">No sites found</div>
                  )}
                </div>
                {formErrors.selectedSites && <p className="text-sm text-red-500">{formErrors.selectedSites}</p>}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={status === 'loading'}>
                {status === 'loading' ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}