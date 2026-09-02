import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import Loading from '@/users/Loading';
import { useDispatch, useSelector } from "react-redux";
import { fetchEmployeeById, editEmployee } from "@/store/reducers/employee/employeeSlice";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { PersonIcon, HomeIcon, IdCardIcon, MobileIcon, Pencil2Icon } from "@radix-ui/react-icons";

const EmployeeProfile = () => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { user } = useSelector((state) => state.authentication);
  const { loading } = useSelector((state) => state.employee);

  const [formData, setFormData] = useState({
    username: "",
    fullname: "",
    email: "",
    designation: "",
    mobileNumber: "",
    organization: "N/A",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  });

  const [displayName, setDisplayName] = useState("");
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchEmployeeById(user.id)).then((res) => {
        if (res.type === "employee/fetchById/fulfilled") {
          const emp = res.payload;

          setFormData({
            fullname: emp.fullname || "",
            username: emp.username || "",
            email: emp.email || "",
            designation: emp.designation || "",
            mobileNumber: emp.mobileNumber || "",
            organization: emp.organizationName || "N/A",
            address: emp.location || "",
            city: emp.city || "",
            state: emp.state || "",
            zipCode: emp.zipCode || "",
            country: emp.country || "",
          });
          setDisplayName(emp.fullname || "");
        }
      });
    }
  }, [dispatch, user?.id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

const handleSave = async () => {
  const payload = {
    fullname: formData.fullname,
    email: formData.email,
    designation: formData.designation,
    mobileNumber: formData.mobileNumber,
    location: formData.address,
    city: formData.city,
    state: formData.state,
    zipCode: formData.zipCode,
    country: formData.country,
  };

  try {
    await dispatch(editEmployee({ id: user.id, data: payload })).unwrap();
    toast({
      title: "Employee updated successfully!",
      description: "Your information has been saved.",
      variant: "success",
    });
    setDisplayName(formData.fullname);
  } catch (err) {
    toast({
      title: "Update failed",
      description: err || "Something went wrong!",
      variant: "destructive",
    });
  }
};

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Avatar Section */}
        <div className="w-full md:w-1/3 lg:w-1/4">
          <Card className="sticky top-4">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-32 w-32 mb-4">
                  <AvatarImage src={user?.profileImage} />
                  <AvatarFallback className="text-4xl">
                    {displayName?.charAt(0) || "E"}
                  </AvatarFallback>
                </Avatar>
                <h1 className="text-xl font-bold">{displayName}</h1>
                <p className="text-muted-foreground text-sm">{formData.email}</p>
                <div className="flex items-center mt-2 text-sm text-muted-foreground">
                  <PersonIcon className="mr-2 h-4 w-4" />
                  <span>{formData.designation || "Employee"}</span>
                </div>
                <Separator className="my-4" />
                <div className="w-full space-y-3 text-left">
                  <div className="flex items-center">
                    <IdCardIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{formData.organization}</span>
                  </div>
                  <div className="flex items-center">
                    <MobileIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {formData.mobileNumber || "No phone"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="flex-1">
          <Tabs defaultValue="information" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="information">
                <PersonIcon className="mr-2 h-4 w-4" />
                Information
              </TabsTrigger>
              <TabsTrigger value="address">
                <HomeIcon className="mr-2 h-4 w-4" />
                Address
              </TabsTrigger>
            </TabsList>

            <TabsContent value="information">
              <Card className="mt-4">
                <CardHeader className="border-b">
                  <div className="flex justify-between items-center">
                    <CardTitle>Personal Information</CardTitle>
                    <Button
                      variant={isEditingInfo ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        if (isEditingInfo) handleSave();
                        setIsEditingInfo((prev) => !prev);
                      }}
                    >
                      <Pencil2Icon className="mr-2 h-4 w-4" />
                      {isEditingInfo ? "Save" : "Edit"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label>Username</label>
                      <Input
                        name="username"
                        value={formData.username}
                        readOnly
                      />
                    </div>
                    <div className="space-y-2">
                      <label>Full Name</label>
                      <Input
                        name="fullname"
                        value={formData.fullname || ""}
                        onChange={handleInputChange}
                        readOnly={!isEditingInfo}
                      />
                    </div>
                    <div className="space-y-2">
                      <label>Email</label>
                      <Input name="email" value={formData.email} readOnly />
                    </div>
                    <div className="space-y-2">
                      <label>Mobile Number</label>
                      <Input
                        name="mobileNumber"
                        value={formData.mobileNumber}
                        onChange={handleInputChange}
                        readOnly={!isEditingInfo}
                      />
                    </div>
                    <div className="space-y-2">
                      <label>Designation</label>
                      <Input
                        name="designation"
                        value={formData.designation}
                        readOnly
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="address">
              <Card className="mt-4">
                <CardHeader className="border-b">
                  <div className="flex justify-between items-center">
                    <CardTitle>Address Information</CardTitle>
                    <Button
                      variant={isEditingAddress ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        if (isEditingAddress) handleSave();
                        setIsEditingAddress((prev) => !prev);
                      }}
                    >
                      <Pencil2Icon className="mr-2 h-4 w-4" />
                      {isEditingAddress ? "Save" : "Edit"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label>Street Address</label>
                      <Input
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        readOnly={!isEditingAddress}
                      />
                    </div>
                    <div className="space-y-2">
                      <label>City</label>
                      <Input
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        readOnly={!isEditingAddress}
                      />
                    </div>
                    <div className="space-y-2">
                      <label>State</label>
                      <Input
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        readOnly={!isEditingAddress}
                      />
                    </div>
                    <div className="space-y-2">
                      <label>ZIP Code</label>
                      <Input
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        readOnly={!isEditingAddress}
                      />
                    </div>
                    <div className="space-y-2">
                      <label>Country</label>
                      <Input
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        readOnly={!isEditingAddress}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfile;