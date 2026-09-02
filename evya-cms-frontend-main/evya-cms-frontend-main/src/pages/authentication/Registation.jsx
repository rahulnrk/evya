import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardBorderLess } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CompanyName, BackgroundImageHomeScreen } from '../../config';
import { useSelector, useDispatch } from 'react-redux';
import { registerUser } from '../../store/reducers/authentication/authenticationSlice';
import { Link } from 'react-router-dom';
import { fetchCountries } from '@/store/reducers/utils/countriesSlice';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { RocketIcon, ReloadIcon } from "@radix-ui/react-icons"

function Registration() {
    const dispatch = useDispatch();
    const { registerStatus, registerError, auth } = useSelector(state => state.authentication);
    const { countries, status: countriesStatus, error: countriesError } = useSelector(state => state.countries);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const defaultForm = {
        fullname: '',
        username: '',
        email: '',
        mobileNumber: '',
        password: '',
        confirmPassword: '',
        address: '',
        city: '',
        country: '',
        state: '',
        zipCode: ''
    }
    
    // Hardcoded role that will be sent in the request
    const ROLE_NAME = 'Driver';

    const [formData, setFormData] = useState(defaultForm);
    const [errors, setErrors] = useState({});
    const [showAlert, setShowAlert] = useState(false);

    useEffect(() => {
        if (countriesStatus === 'idle') {
            dispatch(fetchCountries());
        }
        if (countriesStatus === 'succeeded'){
            setFormData(defaultForm);
        }
    }, [countriesStatus, dispatch]);

    useEffect(() => {
        if (registerStatus === 'succeeded' || registerStatus === 'failed') {
            setShowAlert(true);
            const timer = setTimeout(() => {
                setShowAlert(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [registerStatus]);

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [id]: value
        }));
        // Clear error when user starts typing
        if (errors[id]) {
            setErrors(prevErrors => ({ ...prevErrors, [id]: '' }));
        }
    };

    const handleSelectChange = (id, value) => {
        setFormData(prevState => ({
            ...prevState,
            [id]: value
        }));
        // Clear error when user selects an option
        if (errors[id]) {
            setErrors(prevErrors => ({ ...prevErrors, [id]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        Object.keys(formData).forEach(key => {
            if (!formData[key]) {
                newErrors[key] = 'This field is required';
            }
        });
        
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (validateForm()) {
            const registrationData = {
                fullname: formData.fullname,
                username: formData.username,
                email: formData.email,
                mobileNumber: formData.mobileNumber,
                rolename: ROLE_NAME, // Using the hardcoded value
                password: formData.password,
                confirmPassword: formData.confirmPassword,
                address: formData.address,
                city: formData.city,
                country: formData.country,
                state: formData.state,
                zipCode: formData.zipCode
            };
            dispatch(registerUser(registrationData));
        }
    };

    return (
        <div className="flex min-h-screen">
           <div
          className="hidden lg:flex lg:w-3/5 flex-col justify-between p-12 fixed left-0 h-full bg-green-100"
          style={{
            backgroundImage: `url(${BackgroundImageHomeScreen})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0">
            <div
              className="absolute inset-0 bg-green-200 opacity-50"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            ></div>
          </div>
          <div className="z-10">
            <h2 className="text-4xl font-bold">
              <img
                style={{ maxWidth: "5%" }}
                src="./images/logo.svg"
                alt="Logo"
              />
            </h2>
          </div>
          <div className="z-10 space-y-6">
            <h3 className="text-3xl font-semibold">
              1000+ Charging Stations Worldwide
            </h3>
            <blockquote className="text-sm">
              "The {CompanyName} is a reliable and efficient car charging
              station. Its sleek design houses four charging ports,
              accommodating multiple vehicles simultaneously. Charging speeds
              are impressive, with most EVs reaching 80% capacity in under an
              hour."
            </blockquote>
            <p className="font-semibold">1000+ loved Customers</p>
            <p className="">Love from Team {CompanyName}</p>
          </div>
          <div className="z-10 flex space-x-2"></div>
        </div>
            <div className="w-full lg:w-2/5 p-8 ml-auto overflow-y-auto max-h-screen">
                <CardBorderLess className="w-full max-w-md mx-auto">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold">Register account</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {showAlert && (
                            registerStatus === "failed" ? (
                                <Alert variant="destructive" className="mb-4">
                                    <ExclamationTriangleIcon className="h-4 w-4" />
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>{registerError}</AlertDescription>
                                </Alert>
                            ) : registerStatus === "succeeded" && (
                                <Alert className="mb-4 text-green-700 border-green-600">
                                    <RocketIcon className="h-4 w-4 text-green-600" />
                                    <AlertTitle className="text-green-600">Success!</AlertTitle>
                                    <AlertDescription>Your account has been successfully registered.</AlertDescription>
                                </Alert>
                            )
                        )}
                        <form className="space-y-4" onSubmit={handleSubmit}>
                            <div className="space-y-2">
                                <Input
                                    id="fullname"
                                    type="text"
                                    placeholder="Full Name"
                                    value={formData.fullname}
                                    onChange={handleChange}
                                />
                                {errors.fullname && <p className="text-red-500 text-xs">{errors.fullname}</p>}
                            </div>
                            <div className="space-y-2">
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="Username"
                                    value={formData.username}
                                    onChange={handleChange}
                                />
                                {errors.username && <p className="text-red-500 text-xs">{errors.username}</p>}
                            </div>
                            <div className="space-y-2">
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Email"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                                {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
                            </div>
                            <div className="space-y-2">
                                <Input
                                    id="mobileNumber"
                                    type="tel"
                                    placeholder="Mobile Number"
                                    value={formData.mobileNumber}
                                    onChange={handleChange}
                                />
                                {errors.mobileNumber && <p className="text-red-500 text-xs">{errors.mobileNumber}</p>}
                            </div>
                {/* Role selection removed as requested */}
                          <div className="space-y-2 relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
                            />

                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-3 text-xs text-blue-600"
                            >
                                {showPassword ? "Hide" : "Show"}
                            </button>

                            {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
                            </div>

                      <div className="space-y-2 relative">
                            <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm Password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                            />

                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-3 text-xs text-blue-600"
                            >
                                {/* {showConfirmPassword ? "Hide" : "Show"} */}
                            </button>

                            {errors.confirmPassword && (
                                <p className="text-red-500 text-xs">{errors.confirmPassword}</p>
                            )}
                            </div>

                            <div className="space-y-2">
                                <Input
                                    id="address"
                                    type="text"
                                    placeholder="Address"
                                    value={formData.address}
                                    onChange={handleChange}
                                />
                                {errors.address && <p className="text-red-500 text-xs">{errors.address}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Input
                                        id="city"
                                        type="text"
                                        placeholder="City"
                                        value={formData.city}
                                        onChange={handleChange}
                                    />
                                    {errors.city && <p className="text-red-500 text-xs">{errors.city}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Input
                                        id="state"
                                        type="text"
                                        placeholder="State"
                                        value={formData.state}
                                        onChange={handleChange}
                                    />
                                    {errors.state && <p className="text-red-500 text-xs">{errors.state}</p>}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Input
                                        id="country"
                                        type="text"
                                        placeholder="Country"
                                        value={formData.country}
                                        onChange={handleChange}
                                    />
                                    {errors.country && <p className="text-red-500 text-xs">{errors.country}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Input
                                        id="zipCode"
                                        type="text"
                                        placeholder="Zip Code"
                                        value={formData.zipCode}
                                        onChange={handleChange}
                                    />
                                    {errors.zipCode && <p className="text-red-500 text-xs">{errors.zipCode}</p>}
                                </div>
                            </div>
                            <p className="text-xs text-gray-500">
                                 By logging in you agree to the {CompanyName}{" "}
                                <Link to="/terms" className="text-blue-600 hover:underline">
                                    Terms of Use
                                </Link>
                            </p>
                            <Button className="w-full bg-green-500 hover:bg-green-600" type="submit">
                                {auth.loading ? (
                                    <>
                                        <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                                        Please wait
                                    </>
                                ) : (
                                    "Register"
                                )}
                            </Button>
                        </form>
                        <p className="mt-6 text-center text-sm text-gray-600">
                            Already have an account?{" "}
                            <Link to="/login" className="text-blue-600 hover:underline">Login</Link>
                        </p>
                    </CardContent>
                </CardBorderLess>
            </div>
        </div>
    );
}

export default Registration;