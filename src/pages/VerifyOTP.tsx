import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { KeyRound } from "lucide-react";
import { motion } from "framer-motion";

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
    <div className="auth-shell">
      <div className="w-full max-w-md rounded-3xl border border-white bg-white/90 p-8 shadow-2xl">
        <div className="flex justify-center mb-6">
          <motion.div
            className="p-3 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <KeyRound className="h-10 w-10 text-white" />
          </motion.div>
        </div>

        <p className="text-center text-sm font-semibold uppercase tracking-wide text-indigo-600">
          ZenyraHR
        </p>
        <h2 className="mb-2 mt-1 text-3xl font-bold text-center text-gray-900">
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
              className="input-control mt-1"
              placeholder="Enter 4-digit OTP"
              value={otp}
              onChange={handleChange}
            />
          </div>

          <motion.button
            type="submit"
            disabled={isLoading}
            className="btn-primary inline-flex w-full items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isLoading && (
              <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            {isLoading ? "Verifying..." : "Verify OTP"}
          </motion.button>
        </form>
      </div>
    </div>
  );
} 