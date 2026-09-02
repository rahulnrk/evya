import { useState } from 'react';
import { useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDispatch } from 'react-redux';
import { addManufacturer } from '@/store/reducers/manufacturer/manufacturerSlice';
import { ReloadIcon } from '@radix-ui/react-icons';
import {
  validateManufacturerName,
  validateManufacturerCountry,
  validateEmail,
  validateMobileNumber,
} from '@/pages/validations/Validation';
export function AddManufacturer({ onSuccess, open: externalOpen, onOpenChange: externalOnOpenChange }) {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const [errors, setErrors]=useState({});
   const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;
  // const [isSubmitting, setIsSubmitting] = useState(false);
  // const [open, setOpen] = useState(false);
  const[isSubmitting,setIsSubmitting]=useState(false);
  const [manufacturerData, setManufacturerData] = useState({
    manufacturerName: '',
    country: '',
    contactInfo: '',
    mobileNumber:'',
  });
  const [formErrors, setFormErrors] = useState({});

useEffect(() => {
    const errors = {};
  
    const manufacturerNameError = validateManufacturerName(manufacturerData.manufacturerName);
    if (manufacturerNameError) errors.manufacturerName = manufacturerNameError;

     const manufacturerCountryError = validateManufacturerCountry(manufacturerData.country);
    if (manufacturerCountryError) errors.country = manufacturerCountryError;
    
      const manufacturerContactInfoError = validateEmail(manufacturerData.contactInfo);
    if (manufacturerContactInfoError) errors.contactInfo = manufacturerContactInfoError;

    const mobileNumberError = validateMobileNumber(manufacturerData.mobileNumber);
    if (mobileNumberError) errors.mobileNumber = mobileNumberError;
  
    setFormErrors(errors);
  }, [manufacturerData]);

  const handleChange = (e) => {
    setManufacturerData({
      ...manufacturerData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();    
    const hasErrors = Object.values(formErrors).some(error => error !== "");
    if (hasErrors) {
      toast({
        title: "Validation Error",
        description: "Please fix all validation errors before submitting.",
        variant: "destructive",
      });
      return;
    }
    try {
      setIsSubmitting(true);
      const result = await dispatch(addManufacturer(manufacturerData)).unwrap();      
      toast({
        title: "Success",
        description: "Manufacturer added successfully!",
      });      
      setManufacturerData({
        manufacturerName: '',
        country: '',
        contactInfo: '',
      });
      setOpen(false);      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Failed to add manufacturer:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add manufacturer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add New Manufacturer</Button>
      </DialogTrigger>
      <DialogContent className=" max-w-lg p-6 rounded-xl bg-white shadow-lg">
        <DialogHeader>
          <DialogTitle>Add New Manufacturer</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="">
            <div>
              <Label htmlFor="manufacturerName">Manufacturer Name</Label>
              <Input
                id="manufacturerName"
                name="manufacturerName"
                value={manufacturerData.manufacturerName}
                onChange={handleChange}
                placeholder="Enter manufacturer name"
                className={errors.manufacturerName ? 'border-red-500' : ''}
              />
            {formErrors.manufacturerName && (  <p className="text-xs text-red-500 mt-1">{formErrors.manufacturerName}</p>)}
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                name="country"
                value={manufacturerData.country}
                onChange={handleChange}
                placeholder="Enter country"
                 className={errors.country ? 'border-red-500' : ''}
              />
            </div>
            <div>
              <Label htmlFor="contactInfo">Email</Label>
              <Input
                id="contactInfo"
                name="contactInfo"
                type="email"
                value={manufacturerData.contactInfo}
                onChange={handleChange}
                placeholder="Enter contact email"
                 className={errors.contactInfo ? 'border-red-500' : ''}
              />
            {formErrors.contactInfo && (  <p className="text-xs text-red-500 mt-1">{formErrors.contactInfo}</p>)}
            </div>
            <div>
            <Label htmlFor="mobileNumber">Mobile Number</Label>
            <Input
              id="mobileNumber"
              name="mobileNumber"
              type="text"
              value={manufacturerData.mobileNumber}
              onChange={handleChange}
              placeholder="Enter mobile number"
              className={errors.mobileNumber ? 'border-red-500' : ''}
            />
              {formErrors.mobileNumber && (  <p className="text-xs text-red-500 mt-1">{formErrors.mobileNumber}</p>)}
          </div>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit} 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit'
              )}
            </Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
