import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";

import {
  validateIDName,
  validateMobileNumber,
  validateEmail,
} from "@/pages/validations/Validation";
import { toast } from "@/components/ui/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { addIssue } from '@/store/reducers/issues/issuesSlice';
import { ReloadIcon } from '@radix-ui/react-icons';

export function AddIssueDialog() {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.authentication);

  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [formData, setFormData] = useState({
    type: 'Ticket',
    category: '',
    subcategory:'',
    categoryId: '',
    priority:'medium',
    issue: '',
    comment: '',
    status: "open",
    orgId: user?.orgId,
    email: '',
    mobileNumber: '',
    userId: user?.id || '',
    createdBy: user?.roleId || '',
  });

  const [touchedFields, setTouchedFields] = useState({
    categoryId: false,
    mobileNumber: false,
    email: false
  });

  useEffect(() => {
    const errors = {};
    
    if (touchedFields.categoryId) {
      const idNameError = validateIDName(formData.categoryId);
      if (idNameError) errors.categoryId = idNameError;
    }
    
    if (touchedFields.mobileNumber) {
      const mobileError = validateMobileNumber(formData.mobileNumber);
      if (mobileError) errors.mobileNumber = mobileError;
    }
    
    if (touchedFields.email) {
      const emailError = validateEmail(formData.email);
      if (emailError) errors.email = emailError;
    }
    
    setFormErrors(errors);
  }, [formData, touchedFields]);

  //for copilot..
  useEffect(() => {
  const handleOpenFromTracker = () => {
    setOpen(true);
  };
  window.addEventListener('openAddIssueFromTracker', handleOpenFromTracker);
  return () => {
    window.removeEventListener('openAddIssueFromTracker', handleOpenFromTracker);
  };
}, []);

  const validateForm = useCallback(() => {
    const errors = {};
    
    const idNameError = validateIDName(formData.categoryId);
    if (idNameError) errors.categoryId = idNameError;
    
    const mobileError = validateMobileNumber(formData.mobileNumber);
    if (mobileError) errors.mobileNumber = mobileError;
    
    const emailError = validateEmail(formData.email);
    if (emailError) errors.email = emailError;

     if (!formData.issue.trim()) {
      errors.issue = "Issue title is required";
    }

     setTouchedFields({
      categoryId: true,
      mobileNumber: true,
      email: true,
      issue: true
    });
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // const handleBlur = useCallback((fieldName) => {
  //   setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
  //   validateForm();
  // }, [validateForm]);

  const isFormValid = useMemo(() => {
    return (
      !validateIDName(formData.categoryId) &&
      !validateMobileNumber(formData.mobileNumber) &&
      !validateEmail(formData.email)
    );
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (!touchedFields[name]) {
      setTouchedFields(prev => ({ ...prev, [name]: true }));
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'Ticket',
      category: '',
      categoryId: '',
      subcategory:'',
      priority:'',
      issue: '',
      comment: '',
      status: "open",
      orgId: user?.orgId,
      email: '',
      mobileNumber: '',
      userId: user?.id || '',
      createdBy: user?.roleId || '',
    });
    setFormErrors({});
    setTouchedFields({
      categoryId: false,
      mobileNumber: false,
      email: false
    });
  };

  const categories = {
  Software: ["Payment", "Billing", "Performance", "Bug", "Other"],
  Hardware: ["Replacement", "Maintenance", "Other"],
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isValid = validateForm();
    
    if (!isValid) {
      toast({
        title: "Validation Error",
        description: "Please fix all errors before submitting",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      // await dispatch(addIssue(formData));
      await dispatch(addIssue({
        ...formData,
        // send only subcategory if chosen, else category
        category: formData.category && formData.subcategory
          ? formData.subcategory
          : formData.category || formData.subcategory || 'N/A'
      }));
      resetForm();
      setOpen(false);
      toast({
        title: "Success",
        description: "Issue submitted successfully",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit issue",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
 window.location.reload();
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Report Issue</Button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto px-6 py-8 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Create New Issue</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category */}
          {/* <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Category</p>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, category: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div> */}

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Category</p>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, category: value, subcategory: '' }))
              }
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(categories).map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/*  Subcategory */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Subcategory</p>
            <Select
              value={formData.subcategory}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, subcategory: value }))
              }
              disabled={!formData.category}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select subcategory" />
              </SelectTrigger>
              <SelectContent>
                {(categories[formData.category] || []).map((sub) => (
                  <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category ID */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">
              {formData.subcategory ? `${formData.subcategory} ID/Name` : 'Related ID/Name'}
            </p>
            <Input
              name="categoryId"
              placeholder={`Enter ${formData.subcategory || 'related'} ID`}
              value={formData.categoryId}
              onChange={handleChange}
              // onBlur={() => handleBlur('categoryId')}
            />
            {formErrors.categoryId && (
              <p className="text-xs text-red-500 mt-1">{formErrors.categoryId}</p>
            )}
          </div>
          {/* Status */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Status</p>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, status: value }))
              }
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="inprogress">In-Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
           <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Priority</p>
          <Select
            value={formData.priority}
            onValueChange={(value) =>
              setFormData(prev => ({ ...prev, priority: value }))
            }
            required
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Email</p>
              <Input
                name="email"
                placeholder="Your email"
                value={formData.email}
                onChange={handleChange}
                // onBlur={() => handleBlur('email')}
              />
              {formErrors.email && (
                <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Mobile Number</p>
              <Input
                name="mobileNumber"
                placeholder="Your mobile number"
                value={formData.mobileNumber}
                onChange={handleChange}
                // onBlur={() => handleBlur('mobileNumber')}
              />
              {formErrors.mobileNumber && (
                <p className="text-xs text-red-500 mt-1">{formErrors.mobileNumber}</p>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Title</p>
            <Input
              name="issue"
              placeholder="Brief issue summary"
              value={formData.issue}
              onChange={handleChange}
            />
          </div>

          {/* Comment/Description */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Comment</p>
            <Textarea
              name="comment"
              placeholder="Detailed description of the issue"
              value={formData.comment}
              onChange={handleChange}
              rows={5}
            />
          </div>

          {/* Submit Button */}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Issue"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

//please dont remove this before removing please infrom to anitha


// import React, { useState } from 'react';
// import { useDispatch } from 'react-redux';
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Textarea } from "@/components/ui/textarea";
// import { addIssue } from '@/store/reducers/issues/issuesSlice';
// import { ReloadIcon } from '@radix-ui/react-icons';
// export function AddIssueDialog() {
//   const dispatch = useDispatch();
//   const [open, setOpen] = useState(false);
//   const[isSubmitting,setIsSubmitting]=useState(false);
//   const [formData, setFormData] = useState({
//     type: 'Ticket',
//     chargerId: '',
//     comment: '',
//     issue: ''
//   });

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setIsSubmitting(true); // show loader
//     try {
//       await dispatch(addIssue(formData));
//       setOpen(false);
//       setFormData({
//         type: 'Ticket',
//         chargerId: '',
//         comment: '',
//         issue: ''
//       });
//     } finally {
//       setIsSubmitting(false); 
//     }
//   };

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };

//   return (
//     <Dialog open={open} onOpenChange={setOpen}>
//       <DialogTrigger asChild>
//         <Button>Add</Button>
//       </DialogTrigger>
//       <DialogContent className="sm:max-w-[425px]">
//         <DialogHeader>
//           <DialogTitle>Create New Issue</DialogTitle>
//         </DialogHeader>
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div className="space-y-2">
//             <Input
//               name="chargerId"
//               placeholder="Enter the Email"
//               value={formData.chargerId}
//               onChange={handleChange}
//             />
//           </div>
//           <div className="space-y-2">
//             <Input
//               name="issue"
//               placeholder="Issue Title"
//               value={formData.issue}
//               onChange={handleChange}
//             />
//           </div>
//           <div className="space-y-2">
//             <Textarea
//               name="comment"
//               placeholder="Description"
//               value={formData.comment}
//               onChange={handleChange}
//             />
//           </div>
//           <Button 
//                 type="submit" 
//                 disabled={isSubmitting}
//               >
//                 {isSubmitting ? (
//                   <>
//                     <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
//                     Saving...
//                   </>
//                 ) : (
//                   "Save"
//                 )}
//               </Button>
//         </form>
//       </DialogContent>
//     </Dialog>
//   );
// }