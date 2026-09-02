import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  PersonIcon,
  EnvelopeClosedIcon,
  HomeIcon,
  GearIcon,
  IdCardIcon,
  CalendarIcon,
  MobileIcon,
  GlobeIcon,
  Pencil2Icon,
 
} from "@radix-ui/react-icons";
import { fetchUserDetails,updateUserProfile } from '@/store/reducers/user/userAdminProfileSlice';

const UserAdminProfile = () => {
  const dispatch = useDispatch();
  const { userDetails,
     status,
     error,
    updateStatus, } = useSelector((state) => state.userAdminProfile);

  //added
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState("information");


  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
 
  //added
  const [formData, setFormData] = useState({
    fullname: '',
    username: '',
    mobileNumber: '',
    email: '',
    orgId: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });

  const userId = localStorage.getItem('id');

  useEffect(() => {
    if (userDetails) {
      setFormData({
        fullname: userDetails.fullname || '',
        username: userDetails.username || '',
        mobileNumber: userDetails.mobileNumber || '',
        email: userDetails.email || '',
        orgId: userDetails.orgId || '',
        address: userDetails.address?.[0]?.address || '',
        city: userDetails.address?.[0]?.city || '',
        state: userDetails.address?.[0]?.state || '',
        zipCode: userDetails.address?.[0]?.zipCode || '',
        country: userDetails.address?.[0]?.country || ''
      });
    }
  }, [userDetails]);



  useEffect(() => {
    dispatch(fetchUserDetails(userId));
  }, [dispatch, userId]);
//added
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

const handleSaveInfo = async () => {
  try {
    await dispatch(updateUserProfile(userId, {
      ...formData,
      username: userDetails.username
    }));
    setIsEditingInfo(false);
  } catch (error) {
    console.error('Update failed:', error);
  }
};

const handleSaveAddress = async () => {
  try {
    await dispatch(updateUserProfile(userId, { ...formData }));
    setIsEditingAddress(false);
  } catch (error) {
    console.error('Update failed:', error);
  }
};

  if (status === 'loading') {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (status === 'failed') {
    return <div className="flex justify-center items-center h-screen text-red-500">Error: {error}</div>;
  }

  if (!userDetails) {
    return <div className="flex justify-center items-center h-screen">No user details available</div>;
  }

  return (
    
    <div className="container mx-auto px-4 py-4 max-w-6xl">
      <div className="flex justify-end mb-4">
  <Button
    variant="outline"
    className="flex items-center gap-2"
    onClick={() => navigate('/')}
  >
    <ArrowLeft className="h-4 w-4" />
    Back
  </Button>
</div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Sidebar - Profile Summary */}
        <div className="w-full md:w-1/3 lg:w-1/4">
          <Card className="sticky top-4">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-32 w-32 mb-4">
                  <AvatarImage src={userDetails.profileImage} />
                  <AvatarFallback className="text-4xl">
                    {userDetails.fullname?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
               <h1 className="text-xl font-bold">
                  {userDetails.fullname}
                </h1>
                <p className="text-muted-foreground text-sm">{userDetails.email}</p>
                <div className="flex items-center mt-2 text-sm text-muted-foreground">
                  <PersonIcon className="mr-2 h-4 w-4" />
                  <span className="capitalize">{userDetails.authorities?.[0]?.authority?.replace('ROLE_', '').toLowerCase()}</span>
                </div>
           
                <Separator className="my-4" />
               
                <div className="w-full space-y-3 text-left">
                  <div className="flex items-center">
                    <IdCardIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{userDetails.org?.[0]?.orgName || 'No organization'}</span>
                  </div>
                  <div className="flex items-center">
                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Member since {new Date(userDetails.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center">
                    <MobileIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {userDetails.address?.[0]?.countryCode || ''} {userDetails.address?.[0]?.phone || 'No phone'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
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
          onClick={isEditingInfo ? handleSaveInfo : () => setIsEditingInfo(true)}
          disabled={isEditingInfo && updateStatus === 'loading'}
        >
          <Pencil2Icon className="mr-2 h-4 w-4" />
          {isEditingInfo
            ? (updateStatus === 'loading' ? 'Saving...' : 'Save Changes')
            : 'Edit'}
        </Button>
      </div>
    </CardHeader>
    <CardContent className="pt-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Editable Full Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Full Name</label>
          {isEditingInfo ? (
            <Input
              name="fullname"
              value={formData.fullname}
              onChange={handleInputChange}
            />
          ) : (
            <Input
              name="fullname"
              value={formData.fullname}
              readOnly
            />
          )}
        </div>
        {/* Read Only Username */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Username</label>
          <Input
            name="username"
            value={formData.username}
            readOnly
          />
        </div>
        {/* Read Only Email */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Email</label>
          <Input
            name="email"
            value={formData.email}
            readOnly
          />
        </div>
        {/* Read Only Org ID */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Organization ID</label>
          <Input
            name="orgId"
            value={formData.orgId}
            readOnly
          />
        </div>
        {/* Editable Mobile Number */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Mobile Number</label>
          {isEditingInfo ? (
            <Input
              name="mobileNumber"
              value={formData.mobileNumber}
              onChange={handleInputChange}
            />
          ) : (
            <Input
              name="mobileNumber"
              value={formData.mobileNumber}
              readOnly
            />
          )}
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
          onClick={isEditingAddress ? handleSaveAddress : () => setIsEditingAddress(true)}
          disabled={isEditingAddress && updateStatus === 'loading'}
        >
          <Pencil2Icon className="mr-2 h-4 w-4" />
          {isEditingAddress
            ? (updateStatus === 'loading' ? 'Saving...' : 'Save Changes')
            : 'Edit'}
        </Button>
      </div>
    </CardHeader>
    <CardContent className="pt-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label>Street Address</label>
          {isEditingAddress ? (
            <Input
              name="address"
              value={formData.address}
              onChange={handleInputChange}
            />
          ) : (
            <Input
              name="address"
              value={formData.address}
              readOnly
            />
          )}
        </div>
        <div className="space-y-2">
          <label>City</label>
          {isEditingAddress ? (
            <Input
              name="city"
              value={formData.city}
              onChange={handleInputChange}
            />
          ) : (
            <Input
              name="city"
              value={formData.city}
              readOnly
            />
          )}
        </div>
        <div className="space-y-2">
          <label>State</label>
          {isEditingAddress ? (
            <Input
              name="state"
              value={formData.state}
              onChange={handleInputChange}
            />
          ) : (
            <Input
              name="state"
              value={formData.state}
              readOnly
            />
          )}
        </div>
        <div className="space-y-2">
          <label>ZIP Code</label>
          {isEditingAddress ? (
            <Input
              name="zipCode"
              value={formData.zipCode}
              onChange={handleInputChange}
            />
          ) : (
            <Input
              name="zipCode"
              value={formData.zipCode}
              readOnly
            />
          )}
        </div>
        <div className="space-y-2">
          <label>Country</label>
          {isEditingAddress ? (
            <Input
              name="country"
              value={formData.country}
              onChange={handleInputChange}
            />
          ) : (
            <Input
              name="country"
              value={formData.country}
              readOnly
            />
          )}
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

export default UserAdminProfile;