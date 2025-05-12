import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar } from "lucide-react";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext";
import LeaveSummary from "./LeaveSummary"; // ✅ Import Leave Summary

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_LOCAL;

interface LeaveType {
  id: number;
  name: string;
}

export default function RequestLeave() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [formData, setFormData] = useState({
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: "",
    proofs: [] as File[], // Stores selected files
  });

  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaveTypes = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/leave-types`);
        setLeaveTypes(response.data);
      } catch (err) {
        console.error("❌ Error fetching leave types:", err);
      }
    };

    fetchLeaveTypes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      console.error("❌ Employee ID is missing.");
      setMessage("User ID is missing.");
      return;
    }

    const formDataPayload = new FormData();

    // ✅ Construct JSON for leave request
    const leaveRequest = JSON.stringify({
      employee: { id: user.id },
      leaveType: { id: formData.leaveType },
      startDate: formData.startDate,
      endDate: formData.endDate,
      comments: formData.reason,
    });

    formDataPayload.append("leaveRequest", leaveRequest); // ✅ Attach JSON as a key

    // ✅ Append files to the form data
    formData.proofs.forEach((file) => {
      formDataPayload.append("files", file);
    });

    // ✅ Debugging: Log FormData before sending
    for (let [key, value] of formDataPayload.entries()) {
      // console.log(`${key}:`, value);
    }

    try {
      // ✅ Submit leave request with file uploads
      const response = await axios.post(
        `${API_BASE_URL}/api/leave-requests`,
        formDataPayload,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      // console.log("✅ Leave request submitted:", response.data);
      setMessage("Leave request submitted successfully.");
      navigate("/leave"); // Redirect on success
    } catch (error) {
      console.error(
        "❌ Error submitting leave request:",
        axios.isAxiosError(error)
          ? error.response?.data || error.message
          : error
      );
      setMessage("Error submitting leave request. Please try again.");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, files } = e.target as HTMLInputElement;

    if (files) {
      setFormData((prev) => ({
        ...prev,
        proofs: Array.from(files), // Replace existing proofs with new selection
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6 rounded-lg">
      {/* ✅ Leave Summary */}
      <LeaveSummary />

      {/* ✅ Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Request Leave</h1>
          <p className="mt-1 text-md text-gray-600">
            Submit your leave request
          </p>
        </div>
        <button
          onClick={() => navigate("/leave")}
          className="btn-secondary px-4 py-2 text-sm"
        >
          Back
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.includes("successfully")
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      {/* ✅ Leave Request Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-lg space-y-4"
      >
        <div>
          <label className="block text-sm font-semibold text-gray-700">
            Leave Type
          </label>
          <select
            name="leaveType"
            value={formData.leaveType}
            onChange={handleChange}
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            required
          >
            <option value="">Select Leave Type</option>
            {leaveTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700">
              Start Date
            </label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">
              End Date
            </label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700">
            Reason
          </label>
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            placeholder="Enter reason..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700">
            Attachments (optional)
          </label>
          <input
            type="file"
            name="proofs"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            multiple
          />
          {formData.proofs.length > 0 && (
            <ul className="mt-2 text-sm text-gray-600">
              {formData.proofs.map((file, index) => (
                <li key={index} className="truncate">
                  {file.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate("/leave")}
            className="btn-secondary px-4 py-2 text-sm"
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary px-4 py-2 text-sm">
            Submit
          </button>
        </div>
      </form>
    </div>
  );
}
