import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  UserCircle,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  FileText,
  Wrench,
} from "lucide-react";
import api from '../api/axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_LOCAL;

export default function SelfService() {
  const { id } = useParams<string>(); // Get the employee ID from the URL if present
  const navigate = useNavigate();
  const [personalInfo, setPersonalInfo] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    department: "",
    joinDate: "",
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPersonalInfo = async (employeeId: string) => {
      // // console.log("Fetching for ID:", employeeId);
      try {
        const response = await api.get(`/auth/employees/${employeeId}`);
        // const text = await response.data;
        const data = response.data;
        // // console.log("Raw Response:", text);
        // const data = JSON.parse(text);
        // // console.log("Parsed Data:", data);
        setPersonalInfo({
          name: `${data.firstName} ${data.lastName}`,
          email: data.username,
          phone: data.phone || "Not Available",
          address: data.address || "Not Available",
          department: data.department || "Not Available",
          joinDate: data.joinDate || "Not Available",
        });
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(
          "Unable to fetch personal information. Please try again later."
        );
      }
    };


    if (id) {
      // If the manager is accessing another employee's page
      fetchPersonalInfo(id);
    } else {
      // If the employee is accessing their own page
      const storedUserData = localStorage.getItem("user");
      if (storedUserData) {
        try {
          const userData = JSON.parse(storedUserData);
          if (userData?.id) {
            fetchPersonalInfo(userData.id);
          } else {
            setError("Invalid user data. Please log in again.");
          }
        } catch (error) {
          setError("Failed to parse user data. Please log in again.");
          console.error("Error parsing user data:", error);
        }
      } else {
        setError("No user data found. Please log in again.");
      }
    }
  }, [id]);

  const quickActions = [
    { name: "Apply for Leave", icon: Calendar, href: "/leave/request" },
    { name: "Submit Timesheet", icon: FileText, href: "/timesheet/submit" },
    // { name: "View Payslip", icon: FileText, href: "/payroll" },
    { name: "Service Request", icon: Wrench, href: "/service-request" }, // Updated action
  ];

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Self Service Portal
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            {id
              ? "Viewing Employee's Self Service Page"
              : "Access and manage your personal information and requests"}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-700">
          {error}
        </div>
      )}

      {!error && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Personal Information Card */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Personal Information
            </h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <UserCircle className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-gray-900">{personalInfo.name}</span>
              </div>
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-gray-900">{personalInfo.email}</span>
              </div>
              <div className="flex items-center">
                <Phone className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-gray-900">{personalInfo.phone}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-gray-900">{personalInfo.address}</span>
              </div>
              <div className="flex items-center">
                <Building className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-gray-900">{personalInfo.department}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-gray-900">{personalInfo.joinDate}</span>
              </div>
            </div>

            {/* Edit Information Button - Visible Only for Logged-In User */}
            {!id && (
              <button
                className="mt-6 w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => navigate("/UpdateEmployee")}
              >
                Edit Information
              </button>
            )}
          </div>

          {/* Quick Actions Grid - Displayed Only for Logged-In User */}
          {!id && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <a
                      key={action.name}
                      href={action.href}
                      className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <Icon className="h-6 w-6 text-indigo-600" />
                      <span className="mt-2 text-sm font-medium text-gray-900">
                        {action.name}
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
