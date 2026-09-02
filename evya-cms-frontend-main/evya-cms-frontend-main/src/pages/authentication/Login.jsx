import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardContent, CardHeader, CardTitle, CardBorderLess } from "@/components/ui/card";
import { CompanyName } from "../../config";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from 'react-redux';
import { loginDispatcher,stopNotification } from '../../store/reducers/authentication/authenticationSlice';
import { ReloadIcon } from "@radix-ui/react-icons"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { loginLoading, loginText, loginNotification, isAuthenticated } = useSelector(state => state.authentication);
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const { user } = useSelector(state => state.authentication);

useEffect(() => {
  if (isAuthenticated && user) {
        console.log('User after login:', user);
    let redirectPath = "/";

    switch (Number(user?.roleId)) {
      case 1:
      case 3:
      case 4:
        redirectPath = "/";
        break;
      case 6: {
        const designation = user?.designation?.toLowerCase();
        if (designation?.includes("support")) {
          redirectPath = "/customer-support/tasks";
        } else if (designation?.includes("charger installer")) {
          redirectPath = "/technician-dashboard";
        }
         else if (designation?.includes("fleet")) {
          redirectPath = "/fleetManagement";
        }
        else if (designation?.includes("customer")){
          redirectPath = "/customer-support/tasks","/customer-support/tasks/:id"
        }
        else {
          redirectPath = "/login";
        }
        break;
      }
      default:
        redirectPath = "/login";
    }
    navigate(redirectPath, { replace: true });
  }
}, [isAuthenticated, navigate, user]);

  useEffect(() => {
    if (loginNotification) {
      const timer = setTimeout(() => {
        dispatch(stopNotification());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [loginNotification, dispatch]);

  const validateForm = () => {
    let newErrors = {};
    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const data = {
        ...formData,
        password: btoa(formData.password)
      };
      dispatch(loginDispatcher(data));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  return (
    <div className="flex h-screen ">
       <div className="hidden lg:flex lg:w-3/5 flex-col justify-between p-12  relative  bg-green-100">
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-green-200 opacity-50"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          ></div>
        </div>
        <div className="z-10">
          <h2 className="text-4xl font-bold ">
            {" "}
            <img style={{ maxWidth: "5%" }} src="./images/logo.svg"></img>
          </h2>
        </div>
        <div className="z-10 space-y-6">
          <h3 className="text-3xl font-semibold ">
            1000+ Charging Stations Worldwide
          </h3>
          <blockquote className="text-sm">
            "The {CompanyName} is a reliable and efficient car charging station.
            Its sleek design houses four charging ports, accommodating multiple
            vehicles simultaneously. Charging speeds are impressive, with most
            EVs reaching 80% capacity in under an hour."
          </blockquote>
          <p className=" font-semibold">1000+ loved Customers</p>
          <p className="">Love from Team {CompanyName}</p>
        </div>
        <div className="z-10 flex space-x-2"></div>
      </div>
      <div className="w-full lg:w-2/5 flex items-center justify-center p-8">
        <CardBorderLess className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold ">Login account</CardTitle> 
          </CardHeader>
          <CardContent>
          {loginNotification && (
            <Alert variant="destructive" className="mb-4">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{loginText}</AlertDescription>
              </Alert>              
          )}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-gray-700">
                  Username
                </label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Enter username"
                  value={formData.username}
                  onChange={handleChange}
                />
                {errors.username && <p className="text-red-500 text-xs">{errors.username}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </label>
               <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
                className="pr-10"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  // Eye Off Icon
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M3 3l18 18M10.477 10.477A3 3 0 0114.12 14.12m2.598-2.598A8.986 8.986 
                      0 0021 12c-1.5-4.5-5.25-7.5-9-7.5a8.96 8.96 0 00-4.882 1.465M6.32 
                      6.32A8.965 8.965 0 003 12c1.5 4.5 5.25 7.5 9 7.5 1.575 0 3.07-.36 
                      4.387-1.005" />
                  </svg>
                ) : (
                  // Eye Icon
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 
                      8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 
                      7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
                {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
              </div>
              <p className="text-xs text-gray-500">
                By logging in you agree to the {CompanyName}{" "}
                <Link to="/terms" className="text-blue-600 hover:underline">
                  Terms of Use
                </Link>
              </p>
              <Button className="w-full" type="submit" >
              {loginLoading ? (
                <>
                <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                Please wait
                </>
                ) : (
                "Login"
              )}
            </Button>  
            </form>
            <p className=" mt-6 text-center text-sm text-gray-600">
              <Link 
              to="/forgot-password" 
              className="text-blue-600 hover:underline"
            >
              Forgot Password?
            </Link>
            </p>
            <p className="mt-6 text-center text-sm text-gray-600">
              Need an account?{" "}
              <Link to="/register" className="text-blue-600 hover:underline">
                Register
              </Link>
            </p>
          </CardContent>
        </CardBorderLess>
      </div>
    </div>
  );
};
export default Login;