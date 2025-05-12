import React, { useEffect, useState } from "react";
import { User, Mail, Phone, MapPin } from "lucide-react";

interface PersonalInfoFormProps {
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function PersonalInfoForm({
  formData,
  onChange,
}: PersonalInfoFormProps) {
  const [personalInfo, setPersonalInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    department: "",
    joinDate: "",
  });
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_LOCAL;
  useEffect(() => {
    // Retrieve the user data from localStorage
    const storedUserData = localStorage.getItem("user");
    if (storedUserData) {
      try {
        // Parse the stored JSON string
        const userData = JSON.parse(storedUserData);
        if (userData?.id) {
          // Fetch personal info using the extracted ID
          fetch(`${API_BASE_URL}/auth/employees/${userData.id}`)
            .then((response) => {
              if (!response.ok) {
                throw new Error("Failed to fetch personal information.");
              }
              return response.json();
            })
            .then((data) => {
              console.log("Fetched data:", data); // Log the data to check its structure
              setPersonalInfo({
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.username,
                phone: data.phone || "Not Available",
                address: data.address || "Not Available",
                department: data.department || "Not Available",
                joinDate: data.joinDate || "Not Available",
              });
            })
            .catch((error) => {
              console.error("Error fetching data:", error);
            });
        }
      } catch (error) {
        console.error("Failed to parse user data:", error);
      }
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPersonalInfo((prevInfo) => ({
      ...prevInfo,
      [name]: value,
    }));
    onChange(e);
  };

  return (
    <div className="card p-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Personal Information
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <User className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              name="firstName"
              value={personalInfo.firstName}
              onChange={handleChange}
              className="block w-full pl-8 pr-2 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="First Name"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <User className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              name="lastName"
              value={personalInfo.lastName}
              onChange={handleChange}
              className="block w-full pl-8 pr-2 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Last Name"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <Mail className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="email"
              name="email"
              value={personalInfo.email}
              onChange={handleChange}
              className="block w-full pl-8 pr-2 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Email"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <Phone className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="tel"
              name="phone"
              value={personalInfo.phone}
              onChange={handleChange}
              className="block w-full pl-8 pr-2 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="+91 ----------"
              required
            />
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <MapPin className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              name="address"
              value={personalInfo.address}
              onChange={handleChange}
              className="block w-full pl-8 pr-2 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Full Address"
              required
            />
          </div>
        </div>
      </div>
    </div>
  );
}
