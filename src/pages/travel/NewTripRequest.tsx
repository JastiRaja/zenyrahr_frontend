import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Trash2,
  MapPin,
  Briefcase,
} from "react-feather";
import { Plane } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext"; // Import the useAuth hook

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_LOCAL;

export default function NewTripRequest() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth(); // Use the useAuth hook to get the user and authentication status

  const [formData, setFormData] = useState({
    destination: "",
    purpose: "",
    startDate: "",
    endDate: "",
    budget: "",
    description: "",
    transportation: "",
    accommodation: "",
    documents: [] as File[], // Track multiple files
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const uploadedFiles = Array.from(e.target.files); // Convert FileList to Array
      setFormData((prevState) => ({
        ...prevState,
        documents: [...prevState.documents, ...uploadedFiles], // Add new files to existing ones
      }));
    }
  };

  const handleRemoveFile = (index: number) => {
    setFormData((prevState) => ({
      ...prevState,
      documents: prevState.documents.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated || !user) {
      return;
    }

    try {
      const formDataToSend = new FormData();

      const travelRequestPayload = {
        destination: formData.destination,
        purpose: formData.purpose,
        startDate: formData.startDate,
        endDate: formData.endDate,
        budget: parseFloat(formData.budget),
        description: formData.description,
        transportation: formData.transportation,
        accommodation: formData.accommodation,
        employee: { id: user.id },
        status: "PENDING",
        firstLevelApprovalStatus: "PENDING",
        secondLevelApprovalStatus: "PENDING"
      };

      // Create a Blob with the correct MIME type
      const jsonBlob = new Blob([JSON.stringify(travelRequestPayload)], {
        type: 'application/json'
      });
      formDataToSend.append("travelRequest", jsonBlob);

      // Only append files if they exist
      if (formData.documents && formData.documents.length > 0) {
        formData.documents.forEach((file) => {
          formDataToSend.append("files", file);
        });
      }

      // Append the allowed category for backend
      formDataToSend.append('category', 'travel_requests');

      const response = await fetch(`${API_BASE_URL}/api/travel-requests`, {
        method: "POST",
        body: formDataToSend,
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          // Don't set Content-Type header - let the browser set it with the boundary
        }
      });

      // Handle different response types
      const contentType = response.headers.get("content-type");
      let errorMessage = "Failed to submit request";

      if (!response.ok) {
        if (contentType && contentType.includes("application/json")) {
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || "Failed to submit request";
          } catch (e) {
            errorMessage = `Server error: ${response.status}`;
          }
        } else {
          errorMessage = `Server error: ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      // Handle successful response
      let result;
      try {
        result = await response.json();
      } catch (e) {
        console.warn("Response was not JSON:", e);
        // If response is not JSON but request was successful, we can still proceed
        result = { success: true };
      }

      navigate("/travel");
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const handleCancel = () => {
    setFormData({
      destination: "",
      purpose: "",
      startDate: "",
      endDate: "",
      budget: "",
      description: "",
      transportation: "",
      accommodation: "",
      documents: [],
    });
    navigate("/travel");
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">New Trip Request</h1>
        <p className="mt-2 text-lg text-gray-600">
          Submit a new business travel request
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Trip Information */}
        <div className="card p-6 bg-gradient-to-br from-white to-purple-50">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Trip Details
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Destination */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Destination <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-purple-400" />
                </div>
                <input
                  type="text"
                  name="destination"
                  value={formData.destination}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 border border-purple-200 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                  placeholder="City, Country"
                  required
                />
              </div>
            </div>

            {/* Purpose of Travel */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Purpose of Travel <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Briefcase className="h-5 w-5 text-purple-400" />
                </div>
                <input
                  type="text"
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 border border-purple-200 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                  placeholder="e.g., Client Meeting, Conference"
                  required
                />
              </div>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Start Date <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-purple-400" />
                </div>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 border border-purple-200 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                End Date <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-purple-400" />
                </div>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 border border-purple-200 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>
            </div>

            {/* Transportation */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Transportation <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Plane className="h-5 w-5 text-purple-400" />
                </div>
                <select
                  name="transportation"
                  value={formData.transportation}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 border border-purple-200 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                  required
                >
                  <option value="">Select Transportation</option>
                  <option value="flight">Flight</option>
                  <option value="train">Train</option>
                  <option value="car">Car</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Estimated Budget */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Estimated Budget <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="h-5 w-5 text-purple-400">₹</span>
                </div>
                <input
                  type="text"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 border border-purple-200 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Enter amount"
                  required
                />
              </div>
            </div>

            {/* Additional Details */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Additional Details
              </label>
              <div className="mt-1">
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="block w-full px-3 py-2 border border-purple-200 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Any additional information about your trip..."
                />
              </div>
            </div>

            {/* Supporting Documents */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Supporting Documents <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-purple-200 border-dashed rounded-md hover:border-purple-300 transition-colors duration-300">
                <div className="space-y-1 text-center">
                  <FileText className="mx-auto h-12 w-12 text-purple-400" />
                  <div className="flex text-sm text-gray-600">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-purple-500">
                      <span>Upload files</span>
                      <input
                        type="file"
                        onChange={handleFileChange}
                        className="sr-only"
                        multiple
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PDF, DOC up to 10MB</p>
                </div>
              </div>
            </div>

            {/* Files List with Remove Button */}
            {formData.documents.length > 0 && (
              <div className="sm:col-span-2">
                <h4 className="text-sm font-medium text-gray-700">
                  Uploaded Files
                </h4>
                <ul className="mt-2 space-y-2 text-sm text-gray-700">
                  {formData.documents.map((file, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between bg-gray-100 px-4 py-2 rounded-md"
                    >
                      <span className="truncate">{file.name}</span>
                      <div className="flex items-center space-x-3">
                        <span className="text-xs text-gray-500">
                          ({(file.size / 1024).toFixed(2)} KB)
                        </span>
                        {/* Remove File Button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 border border-purple-300 text-purple-700 rounded-md hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-md hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-300"
          >
            Submit Request
          </button>
        </div>
      </form>
    </div>
  );
}
