import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { KeyRound } from "lucide-react";
import { motion } from "framer-motion";
import brandLogo from "../assets/loginpages.jpeg";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_LOCAL;

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const username = location.state?.email;
  const isVerified = location.state?.verified;
  const otp = location.state?.otp;
  const isFirstLogin = username && !isVerified && !otp; // First login flow
  const isForgotPassword = username && isVerified && otp; // Forgot password flow
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formValues, setFormValues] = useState({
    username: location.state?.email || "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    hasLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecial: false,
  });

  // Only allow access if first login OR forgot password flow
  useEffect(() => {
    if (!username) {
      navigate("/login");
    } else if (!isFirstLogin && !isForgotPassword) {
      navigate("/forgot-password");
    }
  }, [username, isFirstLogin, isForgotPassword, navigate]);

  if (!username || (!isFirstLogin && !isForgotPassword)) {
    return null;
  }

  const checkPasswordStrength = (password: string) => {
    const strength = {
      score: 0,
      hasLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    strength.score = Object.values(strength).filter(Boolean).length - 1;
    setPasswordStrength(strength);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "newPassword") {
      checkPasswordStrength(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formValues.newPassword !== formValues.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (passwordStrength.score < 4) {
      setError("Password does not meet all requirements");
      return;
    }

    setError("");
    setIsLoading(true);
    try {
      let response, responseData;
      if (isFirstLogin) {
        // First login: call /auth/resetPassword
        response = await fetch(`${API_BASE_URL}/auth/resetPassword`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: formValues.username,
            password: formValues.newPassword,
          }),
        });
      } else if (isForgotPassword) {
        // Forgot password: call /auth/verifyPinAndResetPassword
        response = await fetch(
          `${API_BASE_URL}/auth/verifyPinAndResetPassword`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: formValues.username,
              pin: otp,
              newPassword: formValues.newPassword,
            }),
          }
        );
      } else {
        throw new Error("Invalid password reset flow");
      }
      responseData = await response.json(); // Parse the response JSON

      if (!response.ok) {
        throw new Error(responseData.ErrorMessage || "Password reset failed");
      }

      navigate("/login", {
        state: {
          message: "Password reset successful. Please login with your new password.",
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Password reset failed");
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

        {/* Right Side - Reset Password Form */}
        <div className="auth-form">
          <div className="flex justify-center">
            <motion.div
              className="p-3 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <KeyRound className="h-10 w-10 text-white" />
            </motion.div>
          </div>
          <p className="mt-4 text-center text-sm font-semibold uppercase tracking-wide text-indigo-600">
            ZenyraHR
          </p>
          <h2 className="mt-1 text-3xl font-bold text-center text-gray-900">
            Reset Your Password
          </h2>
          <p className=" text-center text-sm text-gray-600">
            Please set a new password for your account
          </p>

          {error && (
            <motion.div
              className=" p-3 rounded bg-red-50 border border-red-200 text-red-600 text-sm text-center"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className=" space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Username
              </label>
              <input
                type="text"
                value={formValues.username}
                disabled
                className="input-control bg-slate-50 text-slate-500"
              />
            </div>

            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-700"
              >
                New Password
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                className="input-control"
                placeholder="Enter new password"
                value={formValues.newPassword}
                onChange={handleChange}
              />
              <div className="mt-2 space-y-2 text-sm">
                <p
                  className={`${
                    passwordStrength.hasLength
                      ? "text-green-600"
                      : "text-gray-500"
                  }`}
                >
                  ✓ At least 8 characters
                </p>
                <p
                  className={`${
                    passwordStrength.hasUpperCase
                      ? "text-green-600"
                      : "text-gray-500"
                  }`}
                >
                  ✓ At least one uppercase letter
                </p>
                <p
                  className={`${
                    passwordStrength.hasLowerCase
                      ? "text-green-600"
                      : "text-gray-500"
                  }`}
                >
                  ✓ At least one lowercase letter
                </p>
                <p
                  className={`${
                    passwordStrength.hasNumber
                      ? "text-green-600"
                      : "text-gray-500"
                  }`}
                >
                  ✓ At least one number
                </p>
                <p
                  className={`${
                    passwordStrength.hasSpecial
                      ? "text-green-600"
                      : "text-gray-500"
                  }`}
                >
                  ✓ At least one special character
                </p>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="input-control"
                placeholder="Confirm new password"
                value={formValues.confirmPassword}
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
              {isLoading ? "Resetting..." : "Reset Password"}
            </motion.button>
          </form>
        </div>
      </div>
    </div>
  );
}
