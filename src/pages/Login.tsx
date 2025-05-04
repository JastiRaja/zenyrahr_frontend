import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, LogIn, Eye, EyeOff } from "lucide-react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import logo3 from "../assets/logo3.png"; // Adjust the path to your logo image

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
  const [isFocused, setIsFocused] = useState(false);
  const [isClicked, setIsClicked] = useState(false); // State to track button click
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility

  // Motion values for eye movement
  const mouseX = useMotionValue(48); // Initial value set to 48
  const mouseY = useMotionValue(48); // Initial value set to 48
  const lookX = useTransform(mouseX, [-200, 200], [-16, 16]); // Increased range for more movement
  const lookY = useTransform(mouseY, [-200, 200], [-16, 16]); // Increased range for more movement

  // Convert error state into a motion value
  const errorMotion = useMotionValue(0);
  useEffect(() => {
    errorMotion.set(error ? 1 : 0);
  }, [error]);

  // Mouth expressions (Neutral, Sad)
  const mouthPath = useTransform(
    errorMotion,
    [0, 1],
    [
      "M80,140 Q125,180 170,140", // Neutral Smile
      "M80,160 Q125,120 170,160", // Sad Face on Error
    ]
  );

  // Function to handle mouse movement
  const handleMouseMove = (e: MouseEvent) => {
    if (!isClicked) {
      const eyesCenterX = window.innerWidth / 4;
      const eyesCenterY = window.innerHeight / 3;
      const diffX = e.clientX - eyesCenterX;
      const diffY = e.clientY - eyesCenterY;

      mouseX.set(diffX);
      mouseY.set(diffY);
    }
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [isClicked]);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

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
    setIsClicked(true); // Set isClicked to true when the button is clicked
    mouseX.set(0); // Center the eyes horizontally
    mouseY.set(0); // Center the eyes vertically

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
      errorMotion.set(1); // Set errorMotion to 1 to trigger sad face
    } finally {
      setIsLoading(false);
      setIsClicked(false); // Reset isClicked after the process is complete
      mouseX.set(48); // Reset the eyes to the initial position
      mouseY.set(48); // Reset the eyes to the initial position
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
    <div className="min-h-screen flex items-center justify-center bg-gray-200">
      <div
        className="max-w-4xl w-full bg-white rounded-lg shadow-[0_10px_30px_rgba(0,0,0,0.6)] flex overflow-hidden"
        style={{ height: "600px" }}
      >
        {/* Left Side - Animated Face */}
        <div className="hidden lg:flex lg:w-1/2 bg-[#3c1f3f] items-center justify-center relative flex-col">
          <motion.div
            className="flex justify-center items-center mt-[200px]"
            initial={{ opacity: 0, y: 200 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 1,
              ease: "easeOut",
              type: "spring",
              stiffness: 100,
            }}
            whileHover={{
              scale: 1.05, // Reduced scaling to avoid blurriness
            }}
            style={{
              willChange: "transform",
              transform: "translateZ(0)", // Forces sharper rendering
            }}
          >
            <img src={logo3} alt="Company Logo" className="h-100 w-140 pb-60" />
          </motion.div>
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Face */}
            <motion.div
              initial={{ y: -500 }} // Start position above the screen
              animate={{ y: -350 }} // End position at the center
              transition={{ type: "spring", stiffness: 100, damping: 10 }} // Animation settings
              className="relative w-64 h-64 rounded-full overflow-hidden bg-[#E5A826] flex items-center justify-center"
            >
              <svg
                width="450"
                height="400"
                viewBox="0 0 250 200"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Left Eye */}
                <ellipse cx="90" cy="80" rx="30" ry="35" fill="white" />
                <motion.circle
                  cx="90"
                  cy="80"
                  r="10"
                  fill="black"
                  style={{ x: isClicked ? 0 : lookX, y: isClicked ? 0 : lookY }}
                  transition={{ type: "spring", stiffness: 100 }}
                />
                {/* Right Eye */}
                <ellipse cx="160" cy="80" rx="30" ry="35" fill="white" />
                <motion.circle
                  cx="160"
                  cy="80"
                  r="10"
                  fill="black"
                  style={{ x: isClicked ? 0 : lookX, y: isClicked ? 0 : lookY }}
                  transition={{ type: "spring", stiffness: 100 }}
                />
                {/* Mouth */}
                <motion.path
                  d={mouthPath}
                  stroke="black"
                  strokeWidth="5"
                  fill="transparent"
                  transition={{ type: "spring", stiffness: 80 }}
                />
                {/* Eyebrows */}
                <motion.path
                  d="M70,55 Q90,45 110,55" // Curved path for left eyebrow
                  stroke="black"
                  strokeWidth="5"
                  fill="transparent"
                  style={{ rotate: isFocused ? -10 : 0 }}
                  transition={{ type: "spring", stiffness: 100 }}
                />
                <motion.path
                  d="M140,55 Q160,45 180,55" // Curved path for right eyebrow
                  stroke="black"
                  strokeWidth="5"
                  fill="transparent"
                  style={{ rotate: isFocused ? 10 : 0 }}
                  transition={{ type: "spring", stiffness: 100 }}
                />
              </svg>
            </motion.div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full p-8 lg:w-1/2 flex flex-col justify-center">
          <div className="flex justify-center mb-4">
            <motion.div
              className="p-3 rounded-full bg-[#3c1f3f]"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <LogIn className="h-10 w-10 text-white" />
            </motion.div>
          </div>
          <h2 className="text-3xl font-bold text-center text-gray-900">
            Welcome Back
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Sign up
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
                  className="block w-full pl-10 pr-3 py-2 border rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={handleChange}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
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
                  className="block w-full pl-10 pr-10 py-2 border rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                  className="mr-2"
                />
                Remember Me
              </label>
              <Link
                to="/forgot-password"
                className="text-indigo-600 hover:text-indigo-500"
              >
                Forgot Password?
              </Link>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 text-white bg-[#3c1f3f] rounded-md hover:bg-indigo-700"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </motion.button>
          </form>
        </div>
      </div>
    </div>
  );
}
