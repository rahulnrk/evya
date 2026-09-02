import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDispatch } from "react-redux";
import { editEmployee } from "@/store/reducers/employee/employeeSlice";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { validateName, validateLocation, validateEmail, validateMobileNumber } from '@/pages/validations/Validation';
import { Card, CardContent } from "@/components/ui/card";

export default function EditCustomerSupport() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const dispatch = useDispatch();
  const { customer } = location.state || {};

  const [loading, setLoading] = useState(false);
  const statusOptions = ["Available", "Unavailable"];

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    mobileNumber: "",
    location: "",
    status: "",
    active: false,
    designation: "",
    joiningDate: "",
  });

  const [formErrors, setFormErrors] = useState({});

useEffect(() => {
  if (customer) {
    setFormData({
      username: customer.username || "",
      email: customer.email || "",
      mobileNumber: customer.mobileNumber || "",
      location: customer.location || "",
      status: customer.active ? "Available" : "Unavailable",
      active: customer.active,
      designation: customer.designation || "Customer Support",
      joiningDate: customer.joiningDate || "",
    });
  }
}, [customer]);

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

  if (!customer) return <p className="p-6">Loading customer data...</p>;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

const handleSelectChange = (value) => {
  setFormData((prev) => ({
    ...prev,
    status: value,
    active: value === "Available",
  }));
};

const handleSubmit = async (e) => {
  e.preventDefault();

  const errors = {};
  if (!formData.username.trim()) errors.username = "Full name is required";
  if (!formData.email.trim()) errors.email = "Email is required";
  if (!formData.mobileNumber.trim()) errors.mobileNumber = "Mobile number is required";
  if (!formData.location.trim()) errors.location = "Location is required";
  if (!formData.status.trim()) errors.status = "Status is required";

  setFormErrors(errors);

  if (Object.keys(errors).length > 0) {
    toast({
      title: "Validation Error",
      description: Object.values(errors).join(", "),
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
      active: formData.status === "Available", // <-- backend field
    };
    await dispatch(editEmployee({ id: customer.id, data: payload })).unwrap();

    toast({
      title: "Success",
      description: "Customer support updated successfully!",
    });

    navigate(`/customer-support/${customer.id}`, {
      state: {
        customer: { ...customer, ...formData, active: formData.status === "Available" },
      },
    });
  } catch (error) {
    toast({
      title: "Error",
      description: error || "Failed to update customer support",
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};
 
  const handleCancel = () =>
    navigate(`/customer-support/${customer.id}`, { state: { customer } });
  return (
    <div className="container mx-auto p-8">
      {/* Header with Cancel button replacing the old BackButton */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Edit Customer Support</h1>
      </div>
      <Card className="max-w-4xl mx-auto p-5 bg-white shadow rounded-lg">
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="username">Full Name</Label>
                <Input
                  id="username"
                  name="username"
                  placeholder="Enter full name"
                  value={formData.username}
                  onChange={handleChange}
                />
                {formErrors.username && (
                  <p className="text-xs text-red-500">{formErrors.username}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={handleChange}
                />
                {formErrors.email && (
                  <p className="text-xs text-red-500">{formErrors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobileNumber">Mobile Number</Label>
                <Input
                  id="mobileNumber"
                  name="mobileNumber"
                  placeholder="Enter mobile number"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                />
                {formErrors.mobileNumber && (
                  <p className="text-xs text-red-500">{formErrors.mobileNumber}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="Enter location"
                  value={formData.location}
                  onChange={handleChange}
                />
                {formErrors.location && (
                  <p className="text-xs text-red-500">{formErrors.location}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={handleSelectChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.status && (
                  <p className="text-xs text-red-500">{formErrors.status}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Designation</Label>
                <Input
                  value={formData.designation}
                  readOnly
                  className="cursor-not-allowed"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-4 pt-4">
              {/* Save button only here */}
               <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}