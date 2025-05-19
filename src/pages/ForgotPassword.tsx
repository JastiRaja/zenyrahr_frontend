import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, KeyRound } from "lucide-react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import logo3 from "../assets/logo3.png"; // Adjust the path to your logo image

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_LOCAL;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [formValues, setFormValues] = useState({
    email: "",
  });

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
    setIsClicked(true); // Set isClicked to true when the button is clicked
    mouseX.set(0); // Center the eyes horizontally
    mouseY.set(0); // Center the eyes vertically

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
      errorMotion.set(1); // Set errorMotion to 1 to trigger sad face
    } finally {
      setIsLoading(false);
      setIsClicked(false); // Reset isClicked after the process is complete
      mouseX.set(48); // Reset the eyes to the initial position
      mouseY.set(48); // Reset the eyes to the initial position
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200">
      <div
        className="max-w-4xl w-full bg-white rounded-lg shadow-[0_10px_30px_rgba(0,0,0,0.6)] flex overflow-hidden"
        style={{ height: "600px" }}
      >
        {/* Left Side - Animated Face */}
        <div className="hidden lg:flex lg:w-1/2 bg-[#3c1f3f] items-center justify-center relative flex-col">
          <motion.div
            className="flex justify-center items-center mt-[-100px]"
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
            <img src={logo3} alt="Company Logo" className="h-100 w-140" />
          </motion.div>

          <motion.div
            initial={{ y: -500 }} // Start position above the screen
            animate={{ y: -100 }} // End position at the center
            transition={{ type: "spring", stiffness: 100, damping: 10 }} // Animation settings
            className="relative w-64 h-64 rounded-full overflow-hidden bg-yellow-600 flex items-center justify-center"
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

        {/* Right Side - Forgot Password Form */}
        <div className="w-full p-8 lg:w-1/2 flex flex-col justify-center">
          <div className="flex justify-center mb-4">
            <motion.div
              className="p-3 rounded-full bg-[#3c1f3f]"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <KeyRound className="h-10 w-10 text-white" />
            </motion.div>
          </div>
          <h2 className="text-3xl font-bold text-center text-gray-900">
            Forgot Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Remember your password?{" "}
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
                  className="block w-full pl-10 pr-3 py-2 border rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter your username"
                  value={formValues.email}
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
              {isLoading ? "Sending..." : "Send OTP"}
            </motion.button>
          </form>
        </div>
      </div>
    </div>
  );
}
