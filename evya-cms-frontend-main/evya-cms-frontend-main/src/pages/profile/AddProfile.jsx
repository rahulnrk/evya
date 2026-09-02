import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReloadIcon } from "@radix-ui/react-icons";
import { addProfile, resetProfileStatus } from '@/store/reducers/profile/profileManagementSlice';

export function AddProfileDialog({ profileType }) {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { loading, error, success } = useSelector((state) => state.profileManagement || {});

  // Define default form data based on profile type
  const defaultFormData = useMemo(() => {
    const baseFormData = {
      firstName: '',
      lastName: '',
      email: '',
      countryCode: '+91',
      phoneNumber: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      country: '',
      zipCode: '',
      salesChannel: null,
    };

    if (profileType === 'driver') {
      return {
        ...baseFormData,
        password: '',
        confirmPassword: '',
        roleName: 'Driver',
      };
    }

    // For whitelabel
    return {
      ...baseFormData,
      orgName: '',
      roleName: 'DealerAdmin',
      creationType: 'new',
      emailcheck: null,
    };
  }, [profileType]);

  const [formData, setFormData] = useState(defaultFormData);

  useEffect(() => {
    if (success) {
      toast({
        title: "Success",
        description: `${profileType === 'whitelabel' ? 'White label' : 'EV User'} added successfully`,
      });
      setOpen(false);
      setFormData(defaultFormData);
      dispatch(resetProfileStatus());
    }
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error,
      });
      dispatch(resetProfileStatus());
    }
  }, [success, error, dispatch, toast, profileType, defaultFormData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let submissionData = { ...formData };

    if (profileType === 'driver') {
      if (formData.password !== formData.confirmPassword) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Passwords do not match",
        });
        return;
      }

      submissionData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        countryCode: formData.countryCode,
        phoneNumber: formData.phoneNumber,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        addressLine1: formData.addressLine1,
        addressLine2: formData.addressLine2,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        zipCode: formData.zipCode,
        roleName: "Driver",
        salesChannel: null
      };
    } else if (profileType === 'whitelabel') {
      submissionData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        countryCode: formData.countryCode,
        phoneNumber: formData.phoneNumber,
        orgName: formData.orgName,
        salesChannel: null,
        addressLine1: formData.addressLine1,
        addressLine2: formData.addressLine2,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        zipCode: formData.zipCode,
        roleName: "DealerAdmin",
        creationType: "new"
      };
    }

    dispatch(addProfile(submissionData, profileType));
  };

  const renderPasswordFields = () => {
    if (profileType !== 'driver') return null;

    return (
      <div className="grid grid-cols-2 gap-4">
        <Input
          name="password"
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
        />
        <Input
          name="confirmPassword"
          type="password"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={handleChange}
        />
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>
            {profileType === 'whitelabel' 
              ? 'Add New White Label' 
              : 'Add New EV User'}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[80vh] overflow-y-auto pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Organization Information - Only for whitelabel */}
            {profileType === 'whitelabel' && (
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-medium mb-4">Organization Information</h3>
                <Input
                  name="orgName"
                  placeholder="Organization Name"
                  value={formData.orgName}
                  onChange={handleChange}
                />
              </div>
            )}

            {/* Personal Information */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-medium mb-4">Personal Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                />
                <Input
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>
              <div className="mt-4">
                <Input
                  name="email"
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              {renderPasswordFields()}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <Select
                  value={formData.countryCode}
                  onValueChange={(value) => handleSelectChange("countryCode", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Country Code" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="+1">+1 (USA)</SelectItem>
                    <SelectItem value="+91">+91 (India)</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  name="phoneNumber"
                  placeholder="Phone Number"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Address Information */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-medium mb-4">Address Information</h3>
              <div className="space-y-4">
                <Input
                  name="addressLine1"
                  placeholder="Address Line 1"
                  value={formData.addressLine1}
                  onChange={handleChange}
                />
                <Input
                  name="addressLine2"
                  placeholder="Address Line 2"
                  value={formData.addressLine2}
                  onChange={handleChange}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    name="city"
                    placeholder="City"
                    value={formData.city}
                    onChange={handleChange}
                  />
                  <Input
                    name="state"
                    placeholder="State"
                    value={formData.state}
                    onChange={handleChange}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    name="country"
                    placeholder="Country"
                    value={formData.country}
                    onChange={handleChange}
                  />
                  <Input
                    name="zipCode"
                    placeholder="Zip Code"
                    value={formData.zipCode}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                    Please wait
                  </>
                ) : (
                  "Add"
                )}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default AddProfileDialog;