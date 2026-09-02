import axios from 'axios';
import React, { useState } from 'react';
import { FaEnvelope, FaLock, FaCheck, FaArrowRight, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { baseURL } from '@/config';

export default function SetPassword() {
  const [email, setEmail] = useState('');
  const [emailExists, setEmailExists] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [response,setResponse]=useState();
  const navigate=useNavigate();

  const checkEmail = async () => {
  setIsLoading(true);
  try {
    console.log("Checking email:", email);

    const userRes = await axios.get(`${baseURL}/services/userprofile/check-email?email=${email}`);
    console.log("User profile check:", userRes.data);

    if (userRes.data.exists) {
      setEmailExists(true);
      setError('');
      setResponse('user');
      return;
    }

    const empRes = await axios.get(`${baseURL}/services/employee/check-email?email=${email}`);
    console.log("Employee check:", empRes.data);

    if (empRes.data.exists) {
      setEmailExists(true);
      setError('');
      setResponse('employee');
    } else {
      setEmailExists(false);
      setError('Email not found. Please try again.');
    }

  } catch (error) {
    console.error("Error checking email:", error);
    setEmailExists(false);
    setError('Email not found. Please try again.');
  } finally {
    setIsLoading(false);
  }
};  

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    let strength = 0;
    if (value.length > 5) strength += 1;
    if (value.length > 8) strength += 1;
    if (/[A-Z]/.test(value)) strength += 1;
    if (/[0-9]/.test(value)) strength += 1;
    if (/[^A-Za-z0-9]/.test(value)) strength += 1;
    
    setPasswordStrength(strength);
  };

const handleSubmit = (e) => {
  e.preventDefault();

  if (password !== confirmPassword) {
    setError('Passwords do not match');
    return;
  }

  if (passwordStrength < 3) {
    setError('Password is too weak');
    return;
  }

  setError('');
  setIsLoading(true);

  const endpoint =
    response === 'employee'
      ? `${baseURL}/services/employee/save-password`
      : `${baseURL}/services/userprofile/save-password`;

  axios.post(endpoint, null, {
    params: {
      email: email,
      password: password,
      confirmPassword: confirmPassword
    }
  }).then(response => {
    setTimeout(() => {
      console.log(response.data);
      alert(response.data.message || "Password updated successfully!");
      setIsLoading(false);
      if (response.status === 200) {
        navigate("/");
      }
    }, 1500);
  }).catch(error => {
    setTimeout(() => {
      alert("Error submitting password: " + error.message);
      setIsLoading(false);
    }, 1500);
  });
};

  const getPasswordStrengthColor = () => {
    if (passwordStrength === 0) return 'bg-gray-200';
    if (passwordStrength <= 2) return 'bg-red-400';
    if (passwordStrength <= 4) return 'bg-yellow-400';
    return 'bg-green-500';
  };

  const getPasswordStrengthWidth = () => {
    if (passwordStrength === 0) return '0%';
    return `${(passwordStrength / 5) * 100}%`;
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Secure Your Account</h1>
          <p className="text-gray-600">
            {emailExists 
              ? "Create a strong password to protect your account"
              : "Enter your email to get started"}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-xl shadow-lg space-y-6 transition-all duration-300 hover:shadow-xl"
        >
          {!emailExists ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" required>Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <FaEnvelope />
                  </div>
                  <input
                    type="email"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={checkEmail}
                disabled={isLoading}
                className={`w-full flex items-center justify-center py-3 px-4 rounded-lg font-medium text-white transition ${isLoading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              > {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </>
                ) : (
                  <>
                    Continue <FaArrowRight className="ml-2" />
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center text-green-700">
                  <FaCheck className="mr-2 flex-shrink-0" />
                  <span>Email verified: {email}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <FaLock />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    placeholder="Create a strong password"
                    value={password}
                    onChange={handlePasswordChange}
                    required
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {password && (
                  <div className="mt-2">
                    <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getPasswordStrengthColor()} transition-all duration-300`}
                        style={{ width: getPasswordStrengthWidth() }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {passwordStrength <= 2 && "Weak password"}
                      {passwordStrength === 3 && "Moderate password"}
                      {passwordStrength === 4 && "Strong password"}
                      {passwordStrength >= 5 && "Very strong password"}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <FaLock />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={toggleConfirmPasswordVisibility}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex items-center justify-center py-3 px-4 rounded-lg font-medium text-white transition ${isLoading ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'}`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </>
                ) : (
                  'Set Password'
                )}
              </button>
            </div>
          )}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div className="flex items-center text-red-700">
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}