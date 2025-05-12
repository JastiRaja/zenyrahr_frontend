import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, UserPlus } from "lucide-react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import logo3 from "../assets/logo3.png"; // Adjust the path to your logo image

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  // Motion values for eye movement
  const mouseX = useMotionValue(48); // Initial value set to 48
  const mouseY = useMotionValue(48); // Initial value set to 48
  const lookX = useTransform(mouseX, [-200, 200], [-16, 16]); // Increased range for more movement
  const lookY = useTransform(mouseY, [-200, 200], [-16, 16]); // Increased range for more movement

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  const errorMotion = useMotionValue(0);
  useEffect(() => {
    errorMotion.set(error ? 1 : 0);
  }, [error]);

  const mouthPath = useTransform(
    errorMotion,
    [0, 1],
    [
      "M80,140 Q125,180 170,140", // Neutral Smile
      "M80,160 Q125,120 170,160", // Sad Face on Error
    ]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    // Add signup logic here
    setIsLoading(true);
    setIsClicked(true);
    mouseX.set(0); // Center the eyes horizontally
    mouseY.set(0); // Center the eyes vertically
    try {
      // Simulate signup process
      await new Promise((resolve) => setTimeout(resolve, 1000));
      navigate("/dashboard");
    } catch (err) {
      setError("Signup failed");
    } finally {
      setIsLoading(false);
      setIsClicked(false);
      mouseX.set(48); // Reset the eyes to the initial position
      mouseY.set(48); // Reset the eyes to the initial position
    }
  };

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
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
        {/* Right Side - Signup Form */}
        <div className="w-full p-8 lg:w-1/2 flex flex-col justify-center">
          <div className="flex justify-center mb-4">
            <motion.div
              className="p-3 rounded-full bg-[#3c1f3f]"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <UserPlus className="h-10 w-10 text-white" />
            </motion.div>
          </div>
          <h2 className="text-3xl font-bold text-center text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-indigo-600 hover:text-indigo-500"
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

          <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700"
                >
                  First name
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="firstName"
                    id="firstName"
                    required
                    className="block w-full pl-10 pr-3 py-2 border rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Last name
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="lastName"
                    id="lastName"
                    required
                    className="block w-full pl-10 pr-3 py-2 border rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full pl-10 pr-3 py-2 border rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="john@example.com"
                  value={formData.email}
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
                  type="password"
                  required
                  className="block w-full pl-10 pr-3 py-2 border rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Confirm password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="block w-full pl-10 pr-3 py-2 border rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 text-white bg-[#3c1f3f] rounded-md hover:bg-[#3c1f3f]"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isLoading ? "Creating account..." : "Create account"}
            </motion.button>
          </form>

          {/* <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>
 
            <div className="mt-6 grid grid-cols-2 gap-3">
              <motion.button
                type="button"
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                whileHover={{ scale: 1.05 }}
              >
                Google
              </motion.button>
              <motion.button
                type="button"
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                whileHover={{ scale: 1.05 }}
              >
                Microsoft
              </motion.button>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
}
