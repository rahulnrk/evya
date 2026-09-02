import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useParams, useNavigate } from 'react-router-dom';
import BackButton from '@/users/BackButton';
import { useDispatch, useSelector } from 'react-redux';
import { ReloadIcon } from '@radix-ui/react-icons';
import { 
  fetchEmployeeById, 
  editTeam, 
  assignTeamTask, 
  updateTeamTaskProgress 
} from '@/store/reducers/chargerInstallation/ChargerInstallationSlice';
import {
  validateName,
  validateMobileNumber,
  validateEmail,
  validateLocation,
} from '@/pages/validations/Validation';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

const EditTeamMember = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const dispatch = useDispatch();
  const [formErrors, setFormErrors] = useState({});

  const { currentTeam, loading, error, currentPage } = useSelector(state => state.chargerInstallation);
  
  const [activeTab, setActiveTab] = useState("basic");

  const [isSubmitting, setIsSubmitting] = useState(false);

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
  
  const [formData, setFormData] = useState({
    username: '',
    mobileNumber: '',
    email: '',
    country: '',
    state: '',
    location: '',
    assignedSites: [],
    active: true,
    joiningDate: '',
    experience: '',
    designation: "charger installer",
  });
  
  const [newTask, setNewTask] = useState({
    name: '',
    location: '',
    priority: 'Medium',
    dueDate: '',
    description: ''
  });

  const [open, setOpen] = useState(false);
  const allSites = ['Site A', 'Site B', 'Site C', 'Site D'];

  useEffect(() => {
    if (id) {
      dispatch(fetchEmployeeById(id));
    }
  }, [id, dispatch]);

  useEffect(() => {
  if (currentTeam) {
    let formattedDate = '';
    if (currentTeam.joiningDate) {
      if (Array.isArray(currentTeam.joiningDate)) {
        const [year, month, day] = currentTeam.joiningDate;
        formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      } else if (typeof currentTeam.joiningDate === 'string') {
        formattedDate = currentTeam.joiningDate;
      }
    }
    let isAddingNote = false;
    
    setFormData({
      username: currentTeam.username || currentTeam.user_name || '',
      mobileNumber: currentTeam.mobileNumber || currentTeam.mobile_number || '',
      email: currentTeam.email || '',
      country: currentTeam.country || '',
      state: currentTeam.state || '',
      location: currentTeam.location || '',
      assignedSites: currentTeam.assignedSites || [],
      active: currentTeam.active || currentTeam.isActive || true,
      joiningDate: formattedDate,
      experience: currentTeam.experience ||'',
      designation: currentTeam.designation || 'charger installer'
    });
  }
}, [currentTeam]);

  const handleSiteSelection = (site) => {
    setFormData(prev => {
      if (prev.assignedSites.includes(site)) {
        return { ...prev, assignedSites: prev.assignedSites.filter(s => s !== site) };
      } else {
        return { ...prev, assignedSites: [...prev.assignedSites, site] };
      }
    });
  };

  const removeSite = (siteToRemove) => {
    setFormData(prev => ({
      ...prev,
      assignedSites: prev.assignedSites.filter(site => site !== siteToRemove)
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };


  //for validations........
  
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
      description: `Please fill in the following fields: ${emptyFields.join(", ")}`,
      variant: "destructive",
    });
    return;
  }

  try {

    setIsSubmitting(true);
  
    const { designation, ...rest } = formData;
    const payload = {
    ...formData,
    joiningDate: formData.joiningDate
      ? formData.joiningDate.split('-').map(Number)
      : []
 };

    await dispatch(editTeam({ id, teamData: payload })).unwrap();

    toast({
      title: "Success",
      description: "Team member updated successfully!",
    });

    navigate("/charger-installation-team");
  } catch (error) {
    toast({
      title: "Error",
      description: error || "Failed to upate team member",
      variant: "destructive",
    });
  }
  finally{
    setIsSubmitting(false);
  }
};
  if (loading && !currentTeam) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center h-64">
          <div>Loading employee data...</div>
        </div>
      </div>
    );
  }

  if (error && !currentTeam) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Edit Team Member</h1>
          <BackButton />
        </div>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <Button onClick={() => navigate('/charger-installation-team')}>
          Back to Team List
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Edit Employee</h1>
        <div className="flex gap-2">
          <BackButton />
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Basic Information Tab */}
        <TabsContent value="basic">
          <form onSubmit={handleSubmit}>
            <div className="mb-8">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Full Name</Label>
                      <Input
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                      />
                      {touched.username && formErrors.username && <p className="text-sm text-red-500">{formErrors.username}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mobileNumber">Mobile</Label>
                      <Input
                        id="mobileNumber"
                        name="mobileNumber"
                        value={formData.mobileNumber}
                        onChange={handleChange}
                        required
                      />
                      {touched.mobileNumber && formErrors.mobileNumber && <p className="text-sm text-red-500">{formErrors.mobileNumber}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    {touched.email && formErrors.email && <p className="text-sm text-red-500">{formErrors.email}</p>}
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        name="location"
                        type="text"
                        value={formData.location}
                        onChange={handleChange}
                        required
                      />
                      {touched.location && formErrors.location && <p className="text-sm text-red-500">{formErrors.location}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={formData.active ? "true" : "false"}
                        onValueChange={(value) => setFormData({...formData, active: value === "true"})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">active</SelectItem>
                          <SelectItem value="false">inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {/* <div className="space-y-2">
                      <Label htmlFor="joiningDate">Join Date</Label>
                      <Input
                        id="joiningDate"
                        name="joiningDate"
                        type="date"
                        value={formData.joiningDate}
                        onChange={handleChange}
                        required
                        readOnly
                        className="mt-1 bg-gray-100 text-gray-700 cursor-not-allowed"

                      />
                    </div> */}
                    <div className="space-y-2">
                      <Label htmlFor="designation">Designation</Label>
                      <Input
                        id="designation"
                        name="designation"
                        value={formData.designation}
                        readOnly
                        className="mt-1 bg-gray-100 text-gray-700 cursor-not-allowed"

                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>

            <div className="flex justify-end mt-6 gap-2">

              <Button 
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => navigate(`/charger-installation-team/${id}`)}
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
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EditTeamMember;