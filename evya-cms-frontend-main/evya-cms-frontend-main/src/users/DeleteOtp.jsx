import React, { useState, useRef, useCallback } from "react";
import axios from "axios";
import PropTypes from "prop-types";
import { baseURL,baseOCPPURL } from '@/config';

const OTP_LENGTH = 4;
const API_BASE_URL = `${baseURL}/service/delete`;

const DeleteOtp = ({ userId, onClose, onDeleted,role}) => {
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [sendOtpMessage, setSendOtpMessage] = useState("");
  const inputsRef = useRef([]);

  const handleChange = useCallback((value, index) => {
    if (!/^\d*$/.test(value)) return;
    
    setOtp(prevOtp => {
      const newOtp = [...prevOtp];
      newOtp[index] = value;
      return newOtp;
    });

    // Auto-focus to next input
    if (value && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }

    // Auto-focus to previous input on backspace
    if (!value && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }, []);

  const handleSendOtp = useCallback(async () => {
    setLoading(true);
    setError("");
    setSendOtpMessage("");
    
    try {
      const response = await axios.post(
        `${API_BASE_URL}/generateDeleteOTP/${role}/${userId}`
      );
      
      if (response.status === 200) {
        setOtpSent(true);
        setSendOtpMessage("OTP sent to your email.");
      } else {
        setError("Failed to send OTP. Please try again.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 
        "An error occurred while sending OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const handleVerifyAndDelete = useCallback(async () => {
    const enteredOtp = otp.join("");
    if (enteredOtp.length !== OTP_LENGTH) {
      setError("Please enter all 4 digits.");
      return;
    }

    setLoading(true);
    setError("");

    try {
const response = await axios.post(
  `${API_BASE_URL}/verifyAndDelete/${role}/${userId}?otp=${enteredOtp}&userEnteredOTP=${enteredOtp}`
);
console.log(response);
      if (response.status ==200) {
        setSuccess(true);
        onDeleted();
      } else {
        setError("Invalid OTP. Please try again.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 
        "An error occurred during verification. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [otp, userId, onDeleted,role]);

  const handleKeyDown = useCallback((e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }, [otp]);

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6">
          <div className="text-center">
            <p className="text-green-600 text-lg font-medium mb-4">
               Account successfully deleted!
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 ">
        <div className="flex justify-between items-center mb-4">
      <h3 className="text-xl font-semibold text-gray-800 text-center w-full">
        Confirm Account Deletion
      </h3>
      <button
        onClick={onClose}
        className=" top-4 right-4 text-red-500 hover:text-red-700 "
        aria-label="Close"
      >
        ❌
      </button>
    </div>

        <p className="text-sm text-gray-600 text-center mb-4">
          A verification OTP will be sent to: <br />
          <strong>pavankalyaneppa@gmail.com</strong>
        </p>
           
        <div className="flex justify-center mb-4">
          <button
            onClick={handleSendOtp}
            disabled={loading || otpSent}
            className={`px-4 py-2 rounded-lg text-white transition-colors duration-200 ${
              loading || otpSent 
                ? "bg-blue-400 cursor-not-allowed" 
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Sending..." : otpSent ? "OTP Sent" : "Send OTP"}
          </button>
        </div>

        {sendOtpMessage && (
          <p className="text-green-600 text-sm text-center mb-4">
            {sendOtpMessage}
          </p>
        )}

        {otpSent && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                Enter 4-digit OTP
              </label>
              <div className="flex justify-center gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputsRef.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(e.target.value, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className="w-12 h-12 text-xl text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-colors duration-200"
                    disabled={loading}
                  />
                ))}
              </div>
            </div>

            {error && (
              <p className="text-red-600 text-sm text-center mb-4">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 transition-colors duration-200"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyAndDelete}
                disabled={loading}
                className={`px-4 py-2 rounded-lg text-white transition-colors duration-200 ${
                  loading 
                    ? "bg-red-400 cursor-not-allowed" 
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {loading ? "Processing..." : "Delete Account"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

DeleteOtp.propTypes = {
  userId: PropTypes.string.isRequired,
  userEmail: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onDeleted: PropTypes.func.isRequired,
};

export default DeleteOtp;