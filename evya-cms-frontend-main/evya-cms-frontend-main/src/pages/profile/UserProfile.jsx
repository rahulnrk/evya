import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  fetchUserProfile, 
  fetchRfidCards, 
  updateUserProfile,
  deleteUserProfile,
  resetUserProfileState 
} from '@/store/reducers/profile/userProfileSlice';
import { ReloadIcon } from "@radix-ui/react-icons";

export function UserProfileDialog({ open, onOpenChange, userId }) {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { userDetails, rfidCards, loading, error, success } = useSelector(state => state.userProfile);
  const [buttonLoading, setButtonLoading] = useState("");

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    countryCode: '',
    phone: '',
    secondaryCountryCode: '',
    secondaryPhone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    country: '',
    zipCode: ''
  });
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    if (open && userId) {
      dispatch(fetchUserProfile(userId));
    }
  }, [dispatch, open, userId]);

  useEffect(() => {
    if (open && userId && userDetails?.authorities?.[0]?.rolename === 'Driver') {
      dispatch(fetchRfidCards(userId));
    }
  }, [dispatch, open, userId, userDetails]);

  useEffect(() => {
    return () => {
      if (!open) {
        dispatch(resetUserProfileState());
      }
    };
  }, [dispatch, open]);

  useEffect(() => {
    if (userDetails) {
      setFormData({
        firstName: userDetails.firstName || '',
        lastName: userDetails.lastName || '',
        countryCode: userDetails.address?.[0]?.countryCode || '',
        phone: userDetails.address?.[0]?.phone || '',
        secondaryCountryCode: userDetails.address?.[0]?.secondaryCountryCode || '',
        secondaryPhone: userDetails.address?.[0]?.secondaryPhone || '',
        addressLine1: userDetails.address?.[0]?.addressLine1 || '',
        addressLine2: userDetails.address?.[0]?.addressLine2 || '',
        city: userDetails.address?.[0]?.city || '',
        state: userDetails.address?.[0]?.state || '',
        country: userDetails.address?.[0]?.country || '',
        zipCode: userDetails.address?.[0]?.zipCode || ''
      });
    }
  }, [userDetails]);

  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error,
      });
    }
    if (success && buttonLoading === "save") {
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      setButtonLoading("");
      setIsEditMode(false);
    }
  }, [success, error, toast, buttonLoading]);

  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
const [timeSlots, setTimeSlots] = useState([
  {
    startTime: "06:00",
    endTime: "10:00",
    price: 15.0,
    isPeak: true,
  },
]);

const addSlot = () => {
  setTimeSlots([
    ...timeSlots,
    {
      startTime: "00:00",
      endTime: "00:00",
      price: 10.0,
      isPeak: false,
    },
  ]);
};

const removeSlot = (index) => {
  const updated = [...timeSlots];
  updated.splice(index, 1);
  setTimeSlots(updated);
};

const updateSlot = (index, field, value) => {
  const updated = [...timeSlots];
  updated[index][field] = value;
  setTimeSlots(updated);
};

const saveSlot = (index) => {
  const slot = timeSlots[index];
  if (slot.startTime && slot.endTime && slot.price) {
    toast({
      title: "Slot pricing saved successfully",
      description:`From ${slot.startTime} to ${slot.endTime} at ₹${slot.price}/kWh`,
    });
  } else {
    toast({
      title: "Missing details",
      description: "Please fill out all fields before saving.",
      variant: "destructive",
    });
  }
};

const handleSavePricing = () => {
  toast({
    title: "Pricing details saved successfully",
    description: "All pricing fields have been saved.",
    });
  };


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setButtonLoading("save");
    const updatedData = {
      ...userDetails,
      firstName: formData.firstName,
      lastName: formData.lastName,
      address: [{
        ...userDetails.address[0],
        countryCode: formData.countryCode,
        phone: formData.phone,
        secondaryCountryCode: formData.secondaryCountryCode,
        secondaryPhone: formData.secondaryPhone,
        addressLine1: formData.addressLine1,
        addressLine2: formData.addressLine2,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        zipCode: formData.zipCode
      }]
    };
    await dispatch(updateUserProfile(userId, updatedData));
  };

  const handleDelete = async () => {
    const confirm = window.confirm('Are you sure you want to delete this user?');
    if (confirm) {
      setButtonLoading("delete");
      await dispatch(deleteUserProfile(userId));
      onOpenChange(false);
    }
  };

 
  console.log(userDetails);
  return (
    <>
    
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-start">{userDetails?.firstName} {userDetails?.lastName}</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="info" className="w-full">
            <TabsList>
              <TabsTrigger value="info">Info</TabsTrigger>
              {userDetails?.authorities?.[0]?.rolename === 'Driver' && (
                <>
                <TabsTrigger value="Vehicles">Vehicles</TabsTrigger>
                <TabsTrigger value="rfid">RFID</TabsTrigger></>
              )}
              {userDetails?.authorities?.[0]?.rolename === 'Owner' && (
             <>
                <TabsTrigger value="sitedetails">Site Details</TabsTrigger>
                <TabsTrigger value="pricing">Set Price</TabsTrigger>
             </>)}
            </TabsList>
             
            <TabsContent value="info" className="space-y-4">
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              {!isEditMode ? (
                <>
                  <Button 
                    variant="destructive" 
                    onClick={handleDelete}
                    disabled={buttonLoading}
                  >
                    {buttonLoading === "delete" ? (
                      <>
                        <ReloadIcon className="ml-auto h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Delete"
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditMode(true)}
                    className="btn btn-outline-primary px-5"
                  >
                    Edit
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditMode(false)}
                    className="btn btn-outline-primary px-5"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSave}
                    disabled={buttonLoading}
                  >
                    {buttonLoading === "save" ? (
                      <>
                        <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : ( 
                      "Save"
                    )}
                  </Button>
                </>
              )}
            </div>

              {isEditMode ? (
                <ScrollArea className="h-[350px]">
                  <div className="grid grid-col gap-4 m-5 w-75">
                    <div className="grid grid-cols-2 gap-4 w-full">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          value={userDetails?.email || ''}
                          disabled
                        />
                      </div>
                      <div>
                        <Label>Organization</Label>
                        <Input
                          value={userDetails?.org?.[0]?.orgName || ''}
                          disabled
                        />
                      </div>
                      <div>
                        <Label htmlFor="countryCode">Country Code</Label>
                        <Input
                          id="countryCode"
                          name="countryCode"
                          value={formData.countryCode}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div>
                        <Label htmlFor="secondaryCountryCode">Secondary Country Code</Label>
                        <Input
                          id="secondaryCountryCode"
                          name="secondaryCountryCode"
                          value={formData.secondaryCountryCode}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div>
                        <Label htmlFor="secondaryPhone">Secondary Phone</Label>
                        <Input
                          id="secondaryPhone"
                          name="secondaryPhone"
                          value={formData.secondaryPhone}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="addressLine1">Address Line 1</Label>
                        <Input
                          id="addressLine1"
                          name="addressLine1"
                          value={formData.addressLine1}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="addressLine2">Address Line 2</Label>
                        <Input
                          id="addressLine2"
                          name="addressLine2"
                          value={formData.addressLine2}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div>
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          name="country"
                          value={formData.country}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div>
                        <Label htmlFor="zipCode">Zip Code</Label>
                        <Input
                          id="zipCode"
                          name="zipCode"
                          value={formData.zipCode}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                
                </ScrollArea>
              ) : (
                <ScrollArea className="h-[350px]">
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-350px">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                      <div className="space-y-4">
                        <div className="border-b pb-2">
                          <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center">
                            <span className="w-32 font-medium text-gray-600">First Name</span>
                            <span className="text-gray-800">{userDetails?.firstName || '-'}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="w-32 font-medium text-gray-600">Last Name</span>
                            <span className="text-gray-800">{userDetails?.lastName || '-'}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="w-32 font-medium text-gray-600">Email</span>
                            <span className="text-gray-800 break-all">{userDetails?.email || '-'}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="w-32 font-medium text-gray-600">Phone</span>
                            <span className="text-gray-800">
                              {userDetails?.address?.[0]?.countryCode ? `(${userDetails.address[0].countryCode}) ` : ''}
                              {userDetails?.address?.[0]?.phone || '-'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="border-b pb-2">
                          <h3 className="text-lg font-semibold text-gray-900">Address Information</h3>
                        </div>
                        <div className="space-y-3">
                          <div className="flex">
                            <span className="w-32 font-medium text-gray-600">Address</span>
                            <span className="text-gray-800">
                              {userDetails?.address?.[0]?.addressLine1 || '-'}
                              {userDetails?.address?.[0]?.addressLine2 && (
                                <>, {userDetails.address[0].addressLine2}</>
                              )}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="w-32 font-medium text-gray-600">City</span>
                            <span className="text-gray-800">{userDetails?.address?.[0]?.city || '-'}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="w-32 font-medium text-gray-600">State</span>
                            <span className="text-gray-800">{userDetails?.address?.[0]?.state || '-'}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="w-32 font-medium text-gray-600">Country</span>
                            <span className="text-gray-800">{userDetails?.address?.[0]?.country || '-'}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="w-32 font-medium text-gray-600">Zip Code</span>
                            <span className="text-gray-800">{userDetails?.address?.[0]?.zipCode || '-'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="border-b pb-2">
                          <h3 className="text-lg font-semibold text-gray-900">Organization</h3>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center">
                            <span className="w-32 font-medium text-gray-600">Organization</span>
                            <span className="text-gray-800">{userDetails?.org?.[0]?.orgName || '-'}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="w-32 font-medium text-gray-600">Role</span>
                            <span className="text-gray-800">{userDetails?.authorities?.[0]?.rolename || '-'}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="w-32 font-medium text-gray-600">No of Sites</span>
                            <span className="text-gray-800">{userDetails?.siteName?.[0]?.siteName || '-'}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="w-32 font-medium text-gray-600">No of Stations</span>
                            <span className="text-gray-800">{userDetails?.siteName?.[0]?.siteName || '-'}</span>
                          </div>
                        </div>
                      </div>

                      {userDetails?.address?.[0]?.secondaryPhone && (
                        <div className="space-y-4">
                          <div className="border-b pb-2">
                            <h3 className="text-lg font-semibold text-gray-900">Secondary Contact</h3>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center">
                              <span className="w-32 font-medium text-gray-600">Phone</span>
                              <span className="text-gray-800">
                                {userDetails.address[0].secondaryCountryCode ? `(${userDetails.address[0].secondaryCountryCode}) ` : ''}
                                {userDetails.address[0].secondaryPhone}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="Vehicles">
              <h4 className='text-center'>
                No Vehicles are added.....
              </h4>
            </TabsContent>




            {/* /// adding the prices in franchise owner */}
          <TabsContent value="pricing" >
          <ScrollArea  className="h-[450px]">
  <div >
    <h3 className="text-lg font-semibold">Calendar-Based Pricing</h3>
    
{/* //add slot form */}
    <div className=" space-x-4">
      <Label htmlFor="pricing-date">Select Date</Label>
      <Input
        id="pricing-date"
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        className="w-[200px]"
      />
    </div>

    <div className="space-y-4 mt-4">
      {timeSlots.map((slot, index) => (
        <div key={index} className="grid grid-cols-5 gap-4 items-center bg-gray-100 p-3 rounded-md">
          <Input
            type="time"
            value={slot.startTime}
            onChange={(e) => updateSlot(index, "startTime", e.target.value)}
            className="mt-5"
          />
          <Input
            type="time"
            value={slot.endTime}
            onChange={(e) => updateSlot(index, "endTime", e.target.value)}
             className="mt-5"
          />
        <div>
  <Label htmlFor={`price-${index}`}>Rate ($/kWh)</Label>
  <Input
    id={`price-${index}`}
    type="number"
    value={slot.price}
    onChange={(e) => updateSlot(index, "price", e.target.value)}
  />
</div>

<Button
             className="btn btn-outline-success"
             onClick={() => saveSlot(index)}
             
           >
             Save
             </Button>
          
          <Button
            variant="destructive"
            onClick={() => removeSlot(index)}
            size="sm"
          >
            Remove
          </Button>
         

        </div>
            


      ))}
    </div>
<div className='mt-2 mb-2'>
          <Button variant="outline" onClick={addSlot}>
        + Add Slot
      </Button>
      
</div>
    

   
  <div className="bg-white shadow-md rounded-2xl p-6">
    <h2 className="text-xl font-semibold mb-4">Pricing Configuration</h2>
    <form className="grid grid-cols-2 gap-6 bg-default">
      
      <div>
        <label className="block mb-1 font-medium">Base Rate per kWh (₹)</label>
        <input type="number" className="input w-full border rounded px-3 py-2" placeholder="Enter base rate" />
      </div>

      <div>
        <label className="block mb-1 font-medium">Member Discount (%)</label>
        <input type="number" className="input w-full border rounded px-3 py-2" placeholder="Enter discount" />
      </div>
      
      {/* <div>
        <label className="block mb-1 font-medium">Time-Based Rate (₹/minute)</label>
        <input type="number" className="input w-full border rounded px-3 py-2" placeholder="Enter time-based rate" />
      </div> */}

      {/* <div>
        <label className="block mb-1 font-medium">Minimum Charging Fee (₹)</label>
        <input type="number" className="input w-full border rounded px-3 py-2" placeholder="Enter min fee" />
      </div> */}

      <div>
        <label className="block mb-1 font-medium">AC Charger Rate (₹/kWh)</label>
        <input type="number" className="input w-full border rounded px-3 py-2" placeholder="Enter AC rate" />
      </div>

      <div>
        <label className="block mb-1 font-medium">Effective From</label>
        <input type="date" className="input w-full border rounded px-3 py-2" />
      </div>

      <div>
        <label className="block mb-1 font-medium">DC Charger Rate (₹/kWh)</label>
        <input type="number" className="input w-full border rounded px-3 py-2" placeholder="Enter DC rate" />
      </div>

     

      

      <div>
        <label className="block mb-1 font-medium">Effective To</label>
        <input type="date" className="input w-full border rounded px-3 py-2" />
      </div>

      <div>
        <label className="block mb-1 font-medium">Energy Tax (%)</label>
        <input type="number" className="input w-full border rounded px-3 py-2" placeholder="Enter energy tax" />
      </div>

      <div>
        <label className="inline-flex items-center gap-2 mt-2">
          <input type="checkbox" id="isActive" className="form-checkbox" />
          <span className="font-medium">Active</span>
        </label>
      </div>

      
    </form>
  

<div className='text-end mt-2 mb-2'>
  <Button onClick={handleSavePricing}>Save Pricing</Button>
</div>
    </div>
  </div> </ScrollArea>
</TabsContent>


            <TabsContent value="sitedetails">
              <SiteDetails/>
            </TabsContent>

            {userDetails?.authorities?.[0]?.rolename === 'Driver' && (
              <TabsContent value="rfid">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Card Type</TableHead>
                      <TableHead>RfidHex</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Creation Date</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rfidCards?.content?.map((card) => (
                      <TableRow key={card.id}>
                        <TableCell>{card.cardType || '-'}</TableCell>
                        <TableCell>{card.rfidHex || '-'}</TableCell>
                        <TableCell>{card.phone || '-'}</TableCell>
                        <TableCell>
                          {card.creationDate 
                            ? new Date(card.creationDate).toLocaleString('en-US', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                                timeZoneName: 'short'
                              })
                            : '-'}
                        </TableCell>
                        <TableCell>{card.createdBy || '-'}</TableCell>
                        <TableCell>{card.status || '-'}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            )}
          </Tabs>
        </DialogContent>
      </Dialog>

      
    </>
  );
}

export default UserProfileDialog;