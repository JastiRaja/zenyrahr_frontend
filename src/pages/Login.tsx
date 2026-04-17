import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, LogIn, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import brandLogo from "../assets/loginpages.jpeg";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rememberMe: false,
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility
  const isOrganizationDisabledError =
    /organization is currently disabled|organization disabled|ORGANIZATION_DISABLED/i.test(error);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await login(formData.username, formData.password);

      // Check if response indicates password reset is needed
      if (response.redirectToResetPassword) {
        navigate("/reset-password", {
          state: { email: formData.username },
          replace: true,
        });
        return;
      }

      // Normal login flow
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });

      // Handle "Remember Me" functionality
      if (formData.rememberMe) {
        localStorage.setItem("username", formData.username);
        localStorage.setItem("password", formData.password);
      } else {
        localStorage.removeItem("username");
        localStorage.removeItem("password");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Load saved credentials if "Remember Me" was checked
  useEffect(() => {
    const savedUsername = localStorage.getItem("username");
    const savedPassword = localStorage.getItem("password");
    if (savedUsername && savedPassword) {
      setFormData({
        username: savedUsername,
        password: savedPassword,
        rememberMe: true,
      });
    }
  }, []);

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

        {/* Right Side - Login Form */}
        <div className="auth-form">
          <div className="flex justify-center mb-4">
            <motion.div
              className="p-3 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <LogIn className="h-10 w-10 text-white" />
            </motion.div>
          </div>
          <p className="text-center text-sm font-semibold uppercase tracking-wide text-indigo-600">
            ZenyraHR
          </p>
          <h2 className="mt-1 text-3xl font-bold text-center text-gray-900">
            Welcome Back
          </h2>

          {error && (
            <motion.div
              className={`mb-4 rounded border p-3 text-sm text-center ${
                isOrganizationDisabledError
                  ? "border-amber-300 bg-amber-50 text-amber-800"
                  : "border-red-200 bg-red-50 text-red-600"
              }`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700"
              >
                Username
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="input-control pl-10 pr-3"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="input-control pl-10 pr-10"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
                <div
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="mr-2 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Remember Me
              </label>
              <Link
                to="/forgot-password"
                className="muted-link"
              >
                Forgot Password?
              </Link>
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
              {isLoading ? "Signing in..." : "Sign in"}
            </motion.button>
          </form>
        </div>
      </div>
    </div>
  );
}
