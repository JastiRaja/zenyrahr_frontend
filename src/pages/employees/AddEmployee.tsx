import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { FaPlus, FaTrash } from "react-icons/fa"; // Import the icons
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_LOCAL;

export default function AddEmployee() {
  const navigate = useNavigate();
  const { hasPermission, user } = useAuth();

  // Restrict access to the page for roles other than HR
  if (user?.role !== "admin" || !hasPermission("manage", "employees")) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500">Access Denied</h1>
          <p className="mt-4 text-gray-600">
            Only HR personnel can manage employees.
          </p>
          <button
            onClick={() => navigate("/")}
            className="mt-6 px-4 py-2 bg-blue-500 text-white rounded-lg"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    phone: "",
    department: "",
    position: "",
    joinDate: "",
    workLocation: "",
    role: "",
  });

  const [designations, setDesignations] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [workLocations, setWorkLocations] = useState<string[]>([]);

  useEffect(() => {
    // Fetch initial data for designations, departments, and work locations
    const fetchDesignations = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/Designation`);

        const data = await response.json();
        setDesignations(data.map((item: any) => item.name));
      } catch (error) {
        console.error("Error fetching designations:", error);
      }
    };

    const fetchDepartments = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/Department`);

        const data = await response.json();
        setDepartments(data.map((item: any) => item.name));
      } catch (error) {
        console.error("Error fetching departments:", error);
      }
    };

    const fetchWorkLocations = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/location`);

        const data = await response.json();
        setWorkLocations(data.map((item: any) => item.name));
      } catch (error) {
        console.error("Error fetching work locations:", error);
      }
    };

    fetchDesignations();
    fetchDepartments();
    fetchWorkLocations();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert(
          "Registration successful! A one-time password has been sent to the email."
        );
        navigate("/employees");
      } else if (response.status === 409) {
        alert("User already exists.");
      } else {
        const error = await response.json();
        alert(error.message || "Failed to register user");
      }
    } catch (error) {
      console.error("Error during registration:", error);
      alert("An error occurred. Please try again.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto ">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 ">
          Create Your Account
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Enter your details below to register
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Personal Information
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="block w-full pl-3 py-2 border border-gray-300 rounded-md shadow-sm"
                placeholder="Enter first name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="block w-full pl-3 py-2 border border-gray-300 rounded-md shadow-sm"
                placeholder="Enter last name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="block w-full pl-3 py-2 border border-gray-300 rounded-md shadow-sm"
                placeholder="Enter email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="block w-full pl-3 py-2 border border-gray-300 rounded-md shadow-sm"
                placeholder="Enter phone number"
                required
              />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Employment Details
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Department
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="block w-full pl-3 py-2 border border-gray-300 rounded-md shadow-sm"
                required
              >
                <option value="">Select Department</option>
                {departments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="block w-full pl-3 py-2 border border-gray-300 rounded-md shadow-sm"
                required
              >
                <option value="">Select Role</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="hr">HR</option>
                <option value="employee">Employee</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Designation
              </label>
              <select
                name="position"
                value={formData.position}
                onChange={handleChange}
                className="block w-full pl-3 py-2 border border-gray-300 rounded-md shadow-sm"
                required
              >
                <option value="">Select Designation</option>
                {designations.map((designation) => (
                  <option key={designation} value={designation}>
                    {designation}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Join Date
              </label>
              <input
                type="date"
                name="joinDate"
                value={formData.joinDate}
                onChange={handleChange}
                className="block w-full pl-3 py-2 border border-gray-300 rounded-md shadow-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Work Location
              </label>
              <select
                name="workLocation"
                value={formData.workLocation}
                onChange={handleChange}
                className="block w-full pl-3 py-2 border border-gray-300 rounded-md shadow-sm"
                required
              >
                <option value="">Select Work Location</option>
                {workLocations.map((workLocation) => (
                  <option key={workLocation} value={workLocation}>
                    {workLocation}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate("/employees")}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            Register
          </button>
        </div>
      </form>
    </div>
  );
}
