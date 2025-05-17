import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { KeyRound } from "lucide-react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import logo from "../assets/logo1.png"; // Adjust the path to your logo image
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_LOCAL;

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const username = location.state?.email;
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [formValues, setFormValues] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [isFocused, setIsFocused] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    hasLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecial: false,
  });

  // Redirect if no email is provided
  if (!username) {
    navigate("/login");
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
    setIsClicked(true); // Set isClicked to true when the form is submitted
    if (formValues.newPassword !== formValues.confirmPassword) {
      setError("Passwords do not match");
      errorMotion.set(1); // Set errorMotion to 1 to trigger sad face
      return;
    }

    if (passwordStrength.score < 4) {
      setError("Password does not meet all requirements");
      errorMotion.set(1); // Set errorMotion to 1 to trigger sad face
      return;
    }

    setError("");
    setIsLoading(true);
    // console.log("Username:", username);
    // console.log("New Password:", formValues.newPassword);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/resetPassword`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: username,
            password: formValues.newPassword,
          }),
        }
      );
      const responseData = await response.json(); // Parse the response JSON

      if (!response.ok) {
        // console.log("Error response:", responseData); // Log the error response from the backend
        throw new Error("Password reset failed");
      }

      // console.log("Success response:", responseData); // Log the success response from the backend
      navigate("/login", {
        state: {
          message:
            "Password reset successful. Please login with your new password.",
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Password reset failed");
      errorMotion.set(1); // Set errorMotion to 1 to trigger sad face
    } finally {
      setIsLoading(false);
      setIsClicked(false); // Reset isClicked after the process is complete
    }
  };

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
    const eyesCenterX = window.innerWidth / 4;
    const eyesCenterY = window.innerHeight / 3;
    const diffX = e.clientX - eyesCenterX;
    const diffY = e.clientY - eyesCenterY;

    mouseX.set(diffX);
    mouseY.set(diffY);
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200">
      <div
        className="max-w-4xl w-full bg-white rounded-lg shadow-[0_10px_30px_rgba(0,0,0,0.6)] flex overflow-hidden"
        style={{ height: "600px" }}
      >
        {/* Left Side - Animated Face */}
        <div className="hidden lg:flex lg:w-1/2 bg-[#F8E7F6] items-center justify-center relative flex-col">
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
            <img src={logo} alt="Company Logo" className="h-100 w-140" />
          </motion.div>

          <motion.div
            initial={{ y: -500 }} // Start position above the screen
            animate={{ y: -100 }} // End position at the center
            transition={{ type: "spring", stiffness: 100, damping: 10 }} // Animation settings
            className="relative w-64 h-64 rounded-full overflow-hidden bg-indigo-600 flex items-center justify-center"
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

        {/* Right Side - Reset Password Form */}
        <div className="w-full p-8 lg:w-1/2 flex flex-col justify-center">
          <div className="flex justify-center">
            <motion.div
              className="p-3 rounded-full bg-indigo-600"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <KeyRound className="h-10 w-10 text-white" />
            </motion.div>
          </div>
          <h2 className="text-3xl font-bold text-center text-gray-900">
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
                value={username}
                disabled
                className=" block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 sm:text-sm"
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
                className=" block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter new password"
                value={formValues.newPassword}
                onChange={handleChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
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
                className=" block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Confirm new password"
                value={formValues.confirmPassword}
                onChange={handleChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
              />
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </motion.button>
          </form>
        </div>
      </div>
    </div>
  );
}
