import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import AxiosServices from "@/services/AxiosServices";
import { useSelector } from "react-redux";
import {
  validateName,
  validateMobileNumber,
  validateEmail,
  validateLocation,
} from "@/pages/validations/Validation";

function AddCustomerSupport({ open, onOpenChange, onCustomerSupportAdded }) {
  const { toast } = useToast();
  const { employees } = useSelector(state => state.employee);
  const [loading, setLoading] = useState(false);
  const getTodayDate = () => new Date().toISOString().split("T")[0];

  const [touched, setTouched] = useState({
  username: false,
  mobileNumber: false,
  email: false,
  location: false,
});

const handleBlur = (e) => {
  const { name } = e.target;
  setTouched(prev => ({
    ...prev,
    [name]: true,
  }));
};

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    mobileNumber: "",
    location: "",
    joiningDate: getTodayDate(),
    active: true,
    designation: "Customer Support",
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (employees?.length > 0) {
      setFormData(prev => ({
        ...prev,
        designation: employees[0].designation || "Customer Support",
      }));
    }
  }, [employees]);

  useEffect(() => {
  if (open) {
    setFormData({
      username: "",
      email: "",
      mobileNumber: "",
      location: "",
      status: "",
      active: true,
      designation: "Customer Support",
      joiningDate: getTodayDate(),
    });
    setFormErrors({});
  }
}, [open]);

useEffect(() => {
  const errors = {};

  const nameError = validateName(formData.username);
  if (nameError) errors.username = nameError;

  const mobileError = validateMobileNumber(formData.mobileNumber);
  if (mobileError) errors.mobileNumber = mobileError;

  const emailError = validateEmail(formData.email);
  if (emailError) errors.email = emailError;

  const locationError = validateLocation(formData.location);
  if (locationError) errors.location = locationError;

  setFormErrors(errors);
}, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  // Mark all fields touched
  setTouched({
    username: true,
    mobileNumber: true,
    email: true,
    location: true,
  });

  if (Object.keys(formErrors).length > 0) {
    const firstError = Object.values(formErrors)[0];
    toast({
      title: "Validation Error",
      description: firstError,
      variant: "destructive",
    });
    return;
  }

  try {
    setLoading(true);
    const payload = {
      username: formData.username,
      email: formData.email,
      mobileNumber: formData.mobileNumber,
      location: formData.location,
      active: formData.active,
      designation: formData.designation,
      joiningDate: formData.joiningDate,
    };

    await AxiosServices.addEmployee(payload);

    toast({
      title: "Success",
      description: "Customer support added successfully!",
    });

    onCustomerSupportAdded?.();
    onOpenChange(false);
  } catch (error) {
    toast({
      title: "Error",
      description: error || "Failed to add customer support",
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};

  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Customer Support</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4"> 
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Full Name</Label>
                <Input
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {touched.username && formErrors.username && (
                  <p className="text-xs text-red-500">{formErrors.username}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {touched.email && formErrors.email && (
                  <p className="text-xs text-red-500">{formErrors.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobileNumber">Mobile Number</Label>
                <Input
                  id="mobileNumber"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {touched.mobileNumber && formErrors.mobileNumber && (
                  <p className="text-xs text-red-500">{formErrors.mobileNumber}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {touched.location && formErrors.location && (
                  <p className="text-xs text-red-500">{formErrors.location}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Created Date</Label>
                <Input
                  type="date"
                  name="joiningDate"
                  value={formData.joiningDate}
                  onChange={handleChange}
                />
              </div>            
              <div className="space-y-2">
                <Label>Designation</Label>
                <Input value={formData.designation} readOnly className="cursor-not-allowed bg-gray-100 text-gray-500" />
              </div>
              <div className="flex justify-start space-x-4 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </Button>
            </div>
            </div>         
          </form>
        </DialogContent>
        </Dialog>
  );
  }
export default AddCustomerSupport;