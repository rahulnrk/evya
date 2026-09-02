import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AxiosServices from '@/services/AxiosServices';
import {
  validateName,
  validateMobileNumber,
  validateEmail,
  validateLocation,
} from '@/pages/validations/Validation';
import { ReloadIcon } from '@radix-ui/react-icons';

const AddTeamMember = ({ open, onOpenChange, onTeamMemberAdded }) => {
  const { toast } = useToast();
  const [formErrors, setFormErrors] = useState({});

  const [touched, setTouched] = useState({
    username: false,
    mobileNumber: false,
    email: false,
    location: false
  });

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
  };

  const [isSubmitting, setIsSubmitting] = useState(false); 
const getTodayDate = () => {
  return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
};

  const [formData, setFormData] = useState({
    username: "",
    mobileNumber: "",
    email: "",
    location: "",
    active: "true",
    joiningDate: getTodayDate(),
    experience: "",
    country: "",
    state: "",
    designation: "charger installer",
    assignedSites: []
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  useEffect(() => {
  if (open) {
    setFormData(prev => ({
      ...prev,
      joiningDate: getTodayDate()
    }));
  }
}, [open]);


  // Validations
  useEffect(() => {
    const errors = {};

    const fullNameError = validateName(formData.username);
    if (fullNameError) errors.username = fullNameError;

    const mobileError = validateMobileNumber(formData.mobileNumber);
    if (mobileError) errors.mobileNumber = mobileError;

    const emailError = validateEmail(formData.email);
    if (emailError) errors.email = emailError;

    const locationError = validateLocation(formData.location);
    if (locationError) errors.location = locationError;

    setFormErrors(errors);
  }, [formData]);

 const handleSubmit = async (e) => {
  e.preventDefault();

  setTouched({
    username: true,
    mobileNumber: true,
    email: true,
    location: true
  });

  if (Object.keys(formErrors).length > 0) {
    const firstError = Object.values(formErrors).find(error => error);
    toast({
      title: "Validation Error",
      description: firstError || "Please fix the validation errors",
      variant: "destructive",
    });
    return;
  }

  const requiredFields = {
    username: "Full Name",
    mobileNumber: "Mobile Number",
    email: "Email",
    location: "Location"
  };

  const emptyFields = Object.entries(requiredFields)
    .filter(([field]) => !formData[field])
    .map(([_, name]) => name);

  if (emptyFields.length > 0) {
    toast({
      title: "Validation Error",
      description: `Please fill in: ${emptyFields.join(", ")}`,
      variant: "destructive",
    });
    return;
  }

  try {
    setIsSubmitting(true);

    const payload = {
      username: formData.username,
      mobileNumber: formData.mobileNumber,
      email: formData.email,
      location: formData.location,
      designation: formData.designation || "charger installer",
      active: formData.active === "true" || formData.active === true,
      joiningDate: formData.joiningDate
        ? new Date(formData.joiningDate).toISOString().split("T")[0]
        : null,
      password: "defaultPassword123",
      confirmPassword: "defaultPassword123",
    };

    await AxiosServices.addEmployee(payload);

    toast({
      title: "Success",
      description: "Team member added successfully!",
    });

    if (onTeamMemberAdded) {
      onTeamMemberAdded();
    }

    onOpenChange(false);
} catch (error) {
  const errorMessage =
    typeof error === "string"                 
      ? error
      : error?.response?.data?.message       
      || "Failed to add team member";

  toast({
    title: "Error",
    description: errorMessage,
    variant: "destructive",
  });
}

 finally {
    setIsSubmitting(false);
  }
};
  return (
     <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="username">Full Name</Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter full name"
                required
              />
              {touched.username && formErrors.username && <p className="text-sm text-red-500">{formErrors.username}</p>}
            </div>

            {/* Mobile Number */}
            <div className="space-y-2">
              <Label htmlFor="mobileNumber">Mobile Number</Label>
              <Input
                id="mobileNumber"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter mobile number"
                required
              />
              {touched.mobileNumber && formErrors.mobileNumber && <p className="text-sm text-red-500">{formErrors.mobileNumber}</p>}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter email address"
                required
              />
              {touched.email && formErrors.email && <p className="text-sm text-red-500">{formErrors.email}</p>}
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter location"
                required
              />
              {touched.location && formErrors.location && <p className="text-sm text-red-500">{formErrors.location}</p>}
            </div>

            {/* Joining Date */}
            {/* <div>
              <Label htmlFor="joiningDate">Joining Date</Label>
              <Input
                type="date"
                id="joiningDate"
                name="joiningDate"
                value={formData.joiningDate}
                onChange={handleChange}
                className="mt-1 bg-gray-100 text-gray-700 cursor-not-allowed"
              />
            </div> */}
            {/* Designation */}
            <div>
              <Label htmlFor="designation">Designation</Label>
              <Input
                id="designation"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                readOnly
                className="mt-1 bg-gray-100 text-gray-700 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-4 pt-4">
           <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
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
          </div>

        </form>
    </DialogContent>
    </Dialog>
  );
};

export default AddTeamMember;