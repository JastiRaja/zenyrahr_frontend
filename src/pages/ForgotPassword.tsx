import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, KeyRound } from "lucide-react";
import { motion } from "framer-motion";
import brandLogo from "../assets/loginpages.jpeg";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_LOCAL;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formValues, setFormValues] = useState({
    email: "",
  });

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Submit email for OTP
  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgotPassword`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: formValues.email }),
      });
      if (!response.ok) throw new Error("Failed to send OTP. User not found.");
      navigate("/verify-otp", { state: { email: formValues.email } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card flex min-h-0">
        {/* Left Side - Branding */}
        <div className="auth-brand">
          <motion.div
            className="h-full w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              ease: "easeOut",
            }}
            style={{
              willChange: "transform",
              transform: "translateZ(0)",
            }}
          >
            <img src={brandLogo} alt="ZenyraHR" className="h-full w-full object-contain bg-white" />
          </motion.div>
        </div>

        {/* Right Side - Forgot Password Form */}
        <div className="auth-form">
          <div className="flex justify-center mb-4">
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
          <h2 className="mt-1 text-3xl font-bold text-center text-gray-900">
            Forgot Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Remember your password?{" "}
            <Link
              to="/login"
              className="muted-link"
            >
              Sign in
            </Link>
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

          <form onSubmit={handleSubmitEmail} className="mt-6 space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Username
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="text"
                  required
                  className="input-control pl-10 pr-3"
                  placeholder="Enter your username"
                  value={formValues.email}
                  onChange={handleChange}
                />
              </div>
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
              {isLoading ? "Sending..." : "Send OTP"}
            </motion.button>
          </form>
        </div>
      </div>
    </div>
  );
}
