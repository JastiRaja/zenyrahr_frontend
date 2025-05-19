import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { KeyRound } from "lucide-react";
import { motion } from "framer-motion";
import logo from "../assets/logo1.png";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_LOCAL;

export default function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const username = location.state?.email;
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState("");

  useEffect(() => {
    if (!username) {
      navigate("/forgot-password");
    }
  }, [username, navigate]);

  if (!username) {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and limit to 4 digits
    if (/^\d*$/.test(value) && value.length <= 4) {
      setOtp(value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    if (otp.length === 4) {
      navigate("/reset-password", {
        state: {
          email: username,
          verified: true,
          otp: otp
        }
      });
    } else {
      setError("Please enter the 4-digit OTP sent to your email.");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-center mb-6">
          <motion.div
            className="p-3 rounded-full bg-indigo-600"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <KeyRound className="h-10 w-10 text-white" />
          </motion.div>
        </div>

        <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">
          Verify OTP
        </h2>
        <p className="text-center text-sm text-gray-600 mb-6">
          Please enter the 4-digit OTP sent to your email
        </p>

        {error && (
          <motion.div
            className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-600 text-sm text-center"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="otp"
              className="block text-sm font-medium text-gray-700"
            >
              OTP
            </label>
            <input
              id="otp"
              type="text"
              required
              maxLength={4}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Enter 4-digit OTP"
              value={otp}
              onChange={handleChange}
            />
          </div>

          <motion.button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isLoading ? "Verifying..." : "Verify OTP"}
          </motion.button>
        </form>
      </div>
    </div>
  );
} 